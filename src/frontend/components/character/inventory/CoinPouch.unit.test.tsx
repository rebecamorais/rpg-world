import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { SheetFieldset } from '@frontend/components/character/sheet/SheetFieldset';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { CoinPouch } from './CoinPouch';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', () => ({ rpgWorldApi: { get: vi.fn(), put: vi.fn() } }));
const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({ useParams: () => params.value }));

const api = vi.mocked(rpgWorldApi);
const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1' } as DnD5eCharacter;

const inventory = (coins: Record<string, number>) => ({
  containers: [
    { id: 'pouch1', kind: 'coin_pouch', name: null, position: 0, coins },
    { id: 'bag1', kind: 'backpack', name: null, position: 1, coins: {} },
  ],
  items: [],
});
const PURSE = { cp: 12, sp: 3, ep: 0, gp: 45, pp: 2 };

async function renderPouch(coins = PURSE, readOnly = false) {
  api.get.mockResolvedValue(inventory(coins));
  const view = renderWithCharacter(
    readOnly ? (
      <SheetFieldset>
        <CoinPouch />
      </SheetFieldset>
    ) : (
      <CoinPouch />
    ),
    character,
  );
  await waitFor(() => expect(screen.getByLabelText('Gold pieces')).toHaveValue(String(coins.gp)));
  return view;
}

describe('CoinPouch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.value = {};
    api.put.mockResolvedValue(undefined);
  });

  it('mostra as cinco moedas da algibeira do inventário', async () => {
    await renderPouch();

    expect(api.get).toHaveBeenCalledWith('/api/characters/c1/inventory?locale=en');
    expect(screen.getByLabelText('Copper pieces')).toHaveValue('12');
    expect(screen.getByLabelText('Silver pieces')).toHaveValue('3');
    expect(screen.getByLabelText('Electrum pieces')).toHaveValue('0');
    expect(screen.getByLabelText('Gold pieces')).toHaveValue('45');
    expect(screen.getByLabelText('Platinum pieces')).toHaveValue('2');
  });

  it('edita uma moeda à mão e manda uma só vez, ao sair do campo', async () => {
    const user = userEvent.setup();
    await renderPouch();
    const gold = screen.getByLabelText('Gold pieces');

    await user.clear(gold);
    await user.type(gold, '120');
    expect(api.put).not.toHaveBeenCalled();
    await user.tab();

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
      containerId: 'pouch1',
      coins: { ...PURSE, gp: 120 },
    });
    expect(gold).toHaveValue('120');
  });

  it('paga com troco: mostra o que sai e o que volta, e a tela muda na hora', async () => {
    const user = userEvent.setup();
    await renderPouch();

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '50');

    expect(screen.getByText('45 GP + 1 PP')).toBeInTheDocument();
    expect(screen.getByText('5 GP')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(api.put).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
      containerId: 'pouch1',
      coins: { cp: 12, sp: 3, ep: 0, gp: 5, pp: 1 },
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Gold pieces')).toHaveValue('5');
  });

  it('sem dinheiro suficiente, diz quanto falta e não deixa confirmar', async () => {
    const user = userEvent.setup();
    await renderPouch({ cp: 0, sp: 5, ep: 0, gp: 4, pp: 0 });

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '5');

    expect(screen.getByRole('alert')).toHaveTextContent('5 SP short');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('recebe na moeda que veio', async () => {
    const user = userEvent.setup();
    await renderPouch();

    await user.click(screen.getByRole('button', { name: 'Receive' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '10');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(api.put).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
      containerId: 'pouch1',
      coins: { cp: 12, sp: 3, ep: 0, gp: 55, pp: 2 },
    });
  });

  it('servidor recusa: os números voltam ao que eram e avisa (Ponto 4)', async () => {
    const user = userEvent.setup();
    api.put.mockRejectedValue(new Error('boom'));
    await renderPouch();

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '50');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByLabelText('Gold pieces')).toHaveValue('45');
    expect(screen.getByLabelText('Platinum pieces')).toHaveValue('2');
  });

  it('ficha somente leitura (mestre): campos e botões desativados', async () => {
    params.value = { partyId: 'p1' };
    await renderPouch(PURSE, true);

    expect(api.get).toHaveBeenCalledWith('/api/parties/p1/characters/c1/inventory?locale=en');
    expect(screen.getByLabelText('Gold pieces')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pay' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Receive' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Gold pieces'), { target: { value: '50' } });
    expect(api.put).not.toHaveBeenCalled();
  });
});
