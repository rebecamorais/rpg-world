import { ReactNode } from 'react';

import { screen } from '@testing-library/react';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { UsePips } from '@frontend/components/character/stats/UsePips';
import { SheetSourceContext } from '@frontend/hooks/useSheetSource';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CombatStatsSection from '../stats/CombatStatsSection';
import { DeathSavesCard } from '../stats/DeathSavesCard';
import SavingThrowsSection from '../stats/SavingThrowsSection';
import { READ_ONLY_SHEET, SheetFieldset } from './SheetFieldset';

vi.mock('next/navigation', () => ({ useParams: () => ({}) }));

const character = {
  ...createDnD5eCharacter('owner', 'Thor', { hpCurrent: 9, hpMax: 12, ac: 14 }),
  id: 'c1',
  deathSaves: { successes: 1, failures: 0 },
} as DnD5eCharacter;

const SOURCE = { partyId: null, apiPath: '/x', pagesPath: '/x' };

function renderSheet(ui: ReactNode, readOnly: boolean) {
  return renderWithCharacter(
    <SheetSourceContext.Provider value={{ ...SOURCE, readOnly }}>
      <SheetFieldset>{ui}</SheetFieldset>
    </SheetSourceContext.Provider>,
    character,
  );
}

/** The CSS selectors behind the `[&_…]:hidden` classes, to ask the DOM what they catch. */
const hiddenSelectors = READ_ONLY_SHEET.split(' ')
  .filter((name) => name.startsWith('[&_') && name.endsWith(']:hidden'))
  .map((name) => name.slice(3, -']:hidden'.length).replaceAll('_', ' '));

function isHidden(element: Element, root: Element) {
  return hiddenSelectors.some((selector) =>
    Array.from(root.querySelectorAll(selector)).includes(element),
  );
}

describe('SheetFieldset', () => {
  it('na ficha editável não esconde nada', () => {
    const { container } = renderSheet(<CombatStatsSection />, false);

    const fieldset = container.querySelector('fieldset')!;
    expect(fieldset).not.toBeDisabled();
    expect(fieldset).not.toHaveAttribute('data-read-only');
    expect(fieldset.className).not.toContain(':hidden');
  });

  it('só leitura: some com −/+, engrenagens e o chevron do dado de vida', () => {
    const { container } = renderSheet(<CombatStatsSection />, true);
    const fieldset = container.querySelector('fieldset')!;
    const tc = messages.combatStats;

    expect(fieldset).toBeDisabled();
    expect(fieldset).toHaveAttribute('data-read-only', 'true');
    for (const name of [tc.loseHp, tc.gainHp, tc.configureHp]) {
      expect(isHidden(screen.getByRole('button', { name }), fieldset)).toBe(true);
    }
    // The die stays as text ("d8"); only the chevron that made it look like a select goes
    const hitDie = screen.getByRole('combobox', { name: tc.hitDice });
    expect(hitDie).toHaveTextContent(/^d\d+$/);
    expect(isHidden(hitDie, fieldset)).toBe(false);
    expect(isHidden(hitDie.querySelector('svg')!, fieldset)).toBe(true);
  });

  it('só leitura: o − e o + de uma contagem somem, os quadradinhos ficam', () => {
    const { container } = renderSheet(
      <>
        <UsePips label="Ki" max={12} used={2} asNumber onChange={() => {}} />
        <UsePips label="Rage" max={3} used={1} onChange={() => {}} />
      </>,
      true,
    );
    const fieldset = container.querySelector('fieldset')!;
    const tr = messages.usePips;

    expect(
      isHidden(
        screen.getByRole('button', { name: tr.spendOne.replace('{label}', 'Ki') }),
        fieldset,
      ),
    ).toBe(true);
    expect(
      isHidden(
        screen.getByRole('button', { name: tr.returnOne.replace('{label}', 'Ki') }),
        fieldset,
      ),
    ).toBe(true);
    const pips = screen.getAllByRole('button', { name: /Rage/ });
    expect(pips).toHaveLength(3);
    for (const pip of pips) expect(isHidden(pip, fieldset)).toBe(false);
  });

  it('só leitura: o estado continua à vista (proficiência, testes contra a morte), sem o zerar', () => {
    const { container } = renderSheet(
      <>
        <SavingThrowsSection />
        <DeathSavesCard />
      </>,
      true,
    );
    const fieldset = container.querySelector('fieldset')!;
    const buttons = Array.from(fieldset.querySelectorAll('button'));
    const reset = screen.getByRole('button', { name: messages.savingThrows.resetDeathSaves });

    expect(isHidden(reset, fieldset)).toBe(true);
    for (const button of buttons.filter((b) => b !== reset)) {
      expect(isHidden(button, fieldset)).toBe(false);
    }
  });

  it('esconde o que vier marcado com data-sheet-edit', () => {
    const { container } = renderSheet(
      <button type="button" data-sheet-edit>
        Pay
      </button>,
      true,
    );

    const fieldset = container.querySelector('fieldset')!;
    expect(isHidden(screen.getByRole('button', { name: 'Pay' }), fieldset)).toBe(true);
  });
});
