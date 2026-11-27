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
vi.mock('@client', () => ({ rpgWorldApi: { get: vi.fn(), patch: vi.fn() } }));
const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({ useParams: () => params.value }));
const demo = vi.hoisted(() => ({ isDemo: false, refuseWrite: vi.fn() }));
// The real guard reads the demo from its own context; here the demo is whatever the test says
vi.mock('@frontend/demo/DemoContext', async (actual) => ({
  ...(await actual<typeof import('@frontend/demo/DemoContext')>()),
  useWriteGuard:
    () =>
    <Args extends unknown[]>(open: (...args: Args) => void) =>
    (...args: Args) =>
      demo.isDemo ? demo.refuseWrite() : open(...args),
}));

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
    demo.isDemo = false;
    api.patch.mockResolvedValue(undefined);
  });

  it('na demo, Pagar e Receber recusam na hora, sem abrir o formulário', async () => {
    const user = userEvent.setup();
    demo.isDemo = true;
    await renderPouch();

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    await user.click(screen.getByRole('button', { name: 'Receive' }));

    expect(demo.refuseWrite).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('enquanto carrega, não mostra as moedas zeradas', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderWithCharacter(<CoinPouch />, character);

    expect(await screen.findByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByLabelText('Gold pieces')).not.toBeInTheDocument();
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
    api.get.mockResolvedValue(inventory({ ...PURSE, gp: 120 }));

    await user.clear(gold);
    await user.type(gold, '120');
    expect(api.patch).not.toHaveBeenCalled();
    await user.tab();

    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    // The final value, with what the field showed: a stale screen can't add up to a number nobody
    // typed (it saw 45, another tab made it 50, typing 120 must not give 125)
    expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
      containerId: 'pouch1',
      coins: { gp: 120 },
      expected: { gp: 45 },
      key: expect.any(String),
    });
    expect(gold).toHaveValue('120');
  });

  it('mudou em outro lugar enquanto digitava: avisa quanto há agora e o campo mostra isso', async () => {
    const user = userEvent.setup();
    await renderPouch();
    const gold = screen.getByLabelText('Gold pieces');
    api.patch.mockRejectedValueOnce(
      Object.assign(new Error('character_error_coins_changed'), {
        status: 409,
        data: { error: 'character_error_coins_changed', coins: { ...PURSE, gp: 50 } },
      }),
    );
    api.get.mockResolvedValue(inventory({ ...PURSE, gp: 50 }));

    await user.clear(gold);
    await user.type(gold, '70');
    await user.tab();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Changed somewhere else: it's now 50 GP. What you typed was not saved.",
        { action: undefined },
      ),
    );
    await waitFor(() => expect(gold).toHaveValue('50'));
  });

  it('com uma moeda digitada e ainda não enviada, recarregar a aba pergunta antes', async () => {
    const user = userEvent.setup();
    await renderPouch();
    const unload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };

    const gold = screen.getByLabelText('Gold pieces');
    await user.clear(gold);
    await user.type(gold, '120');
    expect(unload()).toBe(true);

    fireEvent.blur(gold);
    expect(unload()).toBe(false);
  });

  it('digitar e voltar ao mesmo número não manda nada', async () => {
    const user = userEvent.setup();
    await renderPouch();
    const gold = screen.getByLabelText('Gold pieces');

    await user.clear(gold);
    await user.type(gold, '45');
    await user.tab();

    expect(api.patch).not.toHaveBeenCalled();
  });

  // The read-only sheet (the GM's) hides what is marked data-sheet-edit: no Pay or Receive there
  it('Pagar e Receber ficam marcados como edição da ficha', async () => {
    await renderPouch();

    const pay = screen.getByRole('button', { name: 'Pay' });
    expect(pay.closest('[data-sheet-edit]')).toContainElement(
      screen.getByRole('button', { name: 'Receive' }),
    );
    expect(screen.getByLabelText('Gold pieces').closest('[data-sheet-edit]')).toBeNull();
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

    api.get.mockResolvedValue(inventory({ cp: 12, sp: 3, ep: 0, gp: 5, pp: 1 }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
      containerId: 'pouch1',
      delta: { gp: -40, pp: -1 },
      key: expect.any(String),
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

  // #294: the "Pouch after" went away with the error, and the person couldn't see what she had
  it('sem dinheiro suficiente, mostra a algibeira de agora para comparar', async () => {
    const user = userEvent.setup();
    await renderPouch({ cp: 0, sp: 5, ep: 0, gp: 4, pp: 0 });

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '5');

    const now = screen.getByText('Pouch now', { selector: 'dt' });
    expect(now.nextElementSibling).toHaveTextContent('5 SP · 4 GP');
    expect(screen.queryByText('Pouch after')).not.toBeInTheDocument();
  });

  it('a falta vem na moeda do pagamento, e não convertida para platina', async () => {
    const user = userEvent.setup();
    await renderPouch({ cp: 0, sp: 7, ep: 0, gp: 0, pp: 0 });

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '50');

    expect(screen.getByRole('alert')).toHaveTextContent('3 SP + 49 GP short');
  });

  // The field keeps the last valid amount: the summary would still show what 1 buys
  it('com o campo vazio ou inválido, o resumo some', async () => {
    const user = userEvent.setup();
    await renderPouch();

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    expect(screen.getByText('Pouch after')).toBeInTheDocument();
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);

    expect(screen.queryByText('Pouch after')).not.toBeInTheDocument();
    expect(screen.queryByText('Paid')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('receber além do teto de 1 bilhão de uma moeda avisa e não deixa confirmar', async () => {
    const user = userEvent.setup();
    await renderPouch({ ...PURSE, gp: 999_999_995 });

    await user.click(screen.getByRole('button', { name: 'Receive' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '6');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The pouch holds at most 1,000,000,000 of each coin.',
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();

    await user.clear(amount);
    await user.type(amount, '5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });

  it('recebe na moeda que veio', async () => {
    const user = userEvent.setup();
    await renderPouch();

    await user.click(screen.getByRole('button', { name: 'Receive' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '10');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
      containerId: 'pouch1',
      delta: { gp: 10 },
      key: expect.any(String),
    });
  });

  it('Enter no campo confirma como sair dele', async () => {
    const user = userEvent.setup();
    await renderPouch();
    const gold = screen.getByLabelText('Gold pieces');

    await user.clear(gold);
    await user.type(gold, '70{Enter}');

    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
  });

  it('servidor recusa: os números voltam ao que eram e avisa (Ponto 4)', async () => {
    const user = userEvent.setup();
    api.patch.mockRejectedValue(new Error('boom'));
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
    expect(api.patch).not.toHaveBeenCalled();
  });
});
