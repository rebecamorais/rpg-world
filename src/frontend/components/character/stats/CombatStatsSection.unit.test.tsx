import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CombatStatsSection from './CombatStatsSection';

const character = {
  ...createDnD5eCharacter('owner', 'Thor', { hpCurrent: 9, hpMax: 12, ac: 14, initiative: 2 }),
  id: 'c1',
  hitDice: { total: '1d10', current: 1 },
  spellcastingSystem: 'points',
  spellPoints: { current: 3, max: 6 },
} as DnD5eCharacter;

function renderCombat(overrides: Partial<DnD5eCharacter> = {}) {
  const handlers = {
    onBasicInfoChange: vi.fn(),
    onSpellcastingSystemChange: vi.fn(),
    onSpellPointsChange: vi.fn(),
    onSpellSlotsChange: vi.fn(),
    onHitDiceChange: vi.fn(),
  };
  renderWithProviders(
    <CombatStatsSection character={{ ...character, ...overrides }} {...handlers} />,
  );
  return handlers;
}

describe('CombatStatsSection', () => {
  it('mostra CA, iniciativa, deslocamento e PV atuais', () => {
    renderCombat();

    expect(screen.getByLabelText('AC')).toHaveValue(14);
    expect(screen.getByLabelText('Initiative')).toHaveValue(2);
    expect(screen.getByLabelText('Speed')).toHaveValue(30);
    expect(screen.getByLabelText('Hit Points')).toHaveValue(9);
  });

  it.each([
    ['AC', 'ac', '17', 17],
    ['Initiative', 'initiative', '-1', -1],
    ['Speed', 'speed', '7.5', 7.5],
    ['Hit Points', 'hpCurrent', '4', 4],
  ])('edita %s', (label, field, typed, expected) => {
    const { onBasicInfoChange } = renderCombat();

    fireEvent.change(screen.getByLabelText(label), { target: { value: typed } });

    expect(onBasicInfoChange).toHaveBeenCalledWith(field, expected);
  });

  it('troca o dado de vida', async () => {
    const { onHitDiceChange } = renderCombat();

    await userEvent.click(screen.getByRole('combobox', { name: 'Hit Dice' }));
    await userEvent.click(screen.getByRole('option', { name: '1d12' }));

    expect(onHitDiceChange).toHaveBeenCalledWith('1d12');
  });

  it('mostra os pontos de magia e repassa a edição', () => {
    const { onSpellPointsChange } = renderCombat();

    const points = screen.getByLabelText('Spell Points');
    expect(points).toHaveValue(3);
    fireEvent.change(points, { target: { value: '5' } });

    expect(onSpellPointsChange).toHaveBeenCalledWith('current', 5);
  });

  it('troca o sistema de magia para espaços', async () => {
    const { onSpellcastingSystemChange } = renderCombat();

    await userEvent.click(screen.getByRole('combobox', { name: 'System Used' }));
    await userEvent.click(screen.getByRole('option', { name: 'Spell Slots' }));

    expect(onSpellcastingSystemChange).toHaveBeenCalledWith('slots');
  });

  it('com espaços de magia, não mostra o campo de pontos', () => {
    renderCombat({ spellcastingSystem: 'slots', spellSlots: { '1': { max: 2, used: 1 } } });

    expect(screen.queryByLabelText('Spell Points')).not.toBeInTheDocument();
  });
});
