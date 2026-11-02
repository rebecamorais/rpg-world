import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { describe, expect, it } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { CoinPouch } from './CoinPouch';

const character = {
  ...createDnD5eCharacter('owner', 'Thor'),
  id: 'c1',
  coins: { cp: 12, sp: 3, ep: 0, gp: 45, pp: 2 },
} as DnD5eCharacter;

const renderPouch = (overrides: Partial<DnD5eCharacter> = {}) =>
  renderWithCharacter(<CoinPouch />, { ...character, ...overrides });

describe('CoinPouch', () => {
  it('mostra as cinco moedas', () => {
    renderPouch();

    expect(screen.getByLabelText('Copper pieces')).toHaveValue('12');
    expect(screen.getByLabelText('Silver pieces')).toHaveValue('3');
    expect(screen.getByLabelText('Electrum pieces')).toHaveValue('0');
    expect(screen.getByLabelText('Gold pieces')).toHaveValue('45');
    expect(screen.getByLabelText('Platinum pieces')).toHaveValue('2');
  });

  it('personagem sem moedas começa com tudo em zero', () => {
    renderPouch({ coins: undefined });

    expect(screen.getByLabelText('Gold pieces')).toHaveValue('0');
  });

  it('edita uma moeda à mão, no rascunho da ficha', () => {
    const { draft, isDirty } = renderPouch();

    fireEvent.change(screen.getByLabelText('Gold pieces'), { target: { value: '50' } });

    expect(draft().coins).toEqual({ cp: 12, sp: 3, ep: 0, gp: 50, pp: 2 });
    expect(isDirty()).toBe(true);
  });

  it('paga com troco: mostra o que sai e o que volta antes de confirmar', async () => {
    const user = userEvent.setup();
    const { draft } = renderPouch();

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '50');

    expect(screen.getByText('45 GP + 1 PP')).toBeInTheDocument();
    expect(screen.getByText('5 GP')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(draft().coins).toEqual({ cp: 12, sp: 3, ep: 0, gp: 5, pp: 1 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sem dinheiro suficiente, diz quanto falta e não deixa confirmar', async () => {
    const user = userEvent.setup();
    renderPouch({ coins: { cp: 0, sp: 5, ep: 0, gp: 4, pp: 0 } });

    await user.click(screen.getByRole('button', { name: 'Pay' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '5');

    expect(screen.getByRole('alert')).toHaveTextContent('5 SP short');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('recebe na moeda que veio', async () => {
    const user = userEvent.setup();
    const { draft } = renderPouch();

    await user.click(screen.getByRole('button', { name: 'Receive' }));
    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '10');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(draft().coins).toEqual({ cp: 12, sp: 3, ep: 0, gp: 55, pp: 2 });
  });
});
