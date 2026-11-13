import type React from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { CombatRowDetails } from './CombatRowDetails';
import { gmRow } from './fixtures';

vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({ list: [], byKey: new Map(), isLoading: false }),
}));

const t = messages.combat;
const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);

const renderDetails = (props: Partial<React.ComponentProps<typeof CombatRowDetails>> = {}) =>
  renderWithProviders(
    <CombatRowDetails
      id="details"
      row={gmRow({ side: 'enemy', name: 'Goblin', hp: { current: 0, max: 7, temp: 0 } })}
      partyId="party-1"
      edition="2024"
      swapWith={[]}
      onSwap={vi.fn()}
      onChange={vi.fn()}
      onRemove={vi.fn()}
      onConditionsChange={vi.fn()}
      {...props}
    />,
  );

describe('CombatRowDetails', () => {
  it('grupos na ordem: números, caído, para os jogadores, ações, atributos', () => {
    const { container } = renderDetails();
    const text = container.textContent ?? '';
    const order = [
      messages.combatStats.armorClass,
      fill(t.chooseFate, { name: 'Goblin' }),
      t.forPlayers,
      messages.sheetViewer.open,
      messages.attributes.abbreviations.STR,
    ].map((part) => text.indexOf(part));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('a iniciativa salva ao sair do campo', async () => {
    const onChange = vi.fn();
    renderDetails({ onChange });
    const field = screen.getByLabelText(fill(t.initiativeOf, { name: 'Goblin' }));
    await userEvent.clear(field);
    await userEvent.type(field, '17');
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledWith({ initiative: 17 });
  });

  it('"Trocar com" chama onSwap com o id do vizinho', async () => {
    const onSwap = vi.fn();
    renderDetails({ onSwap, swapWith: [{ participantId: 'p-b', name: 'Brom' }] });
    await userEvent.click(screen.getByRole('button', { name: fill(t.swapWith, { name: 'Brom' }) }));
    expect(onSwap).toHaveBeenCalledWith('p-b');
  });
});
