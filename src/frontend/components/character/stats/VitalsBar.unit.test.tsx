import { screen, within } from '@testing-library/react';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { VitalsBar } from './VitalsBar';

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({ useParams: () => params.value }));

const t = messages.combatStats;
const character = {
  ...createDnD5eCharacter('o', 'Ada'),
  id: 'c1',
  hpCurrent: 24,
  hpMax: 31,
  hpTemp: 5,
  ac: 14,
  initiative: 2,
  speed: 9,
} as DnD5eCharacter;

describe('VitalsBar', () => {
  it('mostra PV, temporário e os números do combate com rótulo', () => {
    params.value = { id: 'c1' };
    renderWithCharacter(<VitalsBar />, character);

    const bar = screen.getByRole('region', { name: t.summary });
    expect(bar).toHaveTextContent('24 / 31 +5');
    const stat = (name: string) =>
      within(bar).getByText(name, { selector: '.sr-only' }).closest('div');
    expect(stat(t.armorClass)).toHaveTextContent('14');
    expect(stat(t.initiative)).toHaveTextContent('+2');
    expect(stat(t.speed)).toHaveTextContent(`9${t.speedUnit}`);
    expect(stat(messages.characters.passivePerception)).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: t.adjustHp })).toBeInTheDocument();
  });

  it('na ficha só de leitura não oferece ajustar PV', () => {
    params.value = { partyId: 'p1', id: 'c1' };
    renderWithCharacter(<VitalsBar />, character);

    expect(screen.queryByRole('button', { name: t.adjustHp })).not.toBeInTheDocument();
  });
});
