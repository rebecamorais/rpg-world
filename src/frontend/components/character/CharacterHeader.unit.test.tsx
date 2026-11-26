import { screen } from '@testing-library/react';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { SheetSourceContext } from '@frontend/hooks/useSheetSource';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CharacterHeader from './CharacterHeader';

vi.mock('next/navigation', () => ({ useParams: () => ({}) }));

const t = messages.characterHeader;

function renderHeader(overrides: Partial<DnD5eCharacter>, readOnly: boolean) {
  const character = {
    ...createDnD5eCharacter('owner', 'Arani', { level: 5 }),
    xp: 6500,
    // After the factory: it doesn't take every field (XP, background, alignment)
    ...overrides,
    id: 'c1',
  } as DnD5eCharacter;
  return renderWithCharacter(
    <SheetSourceContext.Provider
      value={{ readOnly, partyId: 'p1', apiPath: '/x', pagesPath: '/x' }}
    >
      <CharacterHeader />
    </SheetSourceContext.Provider>,
    character,
  );
}

/** The value under a label of the read-only identity. */
const valueOf = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling;

describe('CharacterHeader', () => {
  it('na ficha editável, raça, classe e nível são campos', () => {
    renderHeader({ race: 'elf' }, false);

    expect(screen.getByRole('combobox', { name: t.race })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: t.name })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.common.increase })).toBeInTheDocument();
  });

  it('na edição, a XP sai com separador de milhar como o alvo', () => {
    renderHeader({}, false);

    expect(screen.getByRole('textbox', { name: t.xp })).toHaveValue('6,500');
    expect(screen.getByText('/ 14,000')).toBeInTheDocument();
  });

  it('só leitura: a identidade é texto, sem select, campo nem −/+', () => {
    renderHeader(
      { race: 'elf', class: 'wizard', background: 'sage', alignment: 'lawful-good' },
      true,
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: messages.common.increase })).toBeNull();

    // Listed options in the reader's language, as the select would show them
    expect(valueOf(t.race)).toHaveTextContent(messages.characterRaces.elf);
    expect(valueOf(t.class)).toHaveTextContent(messages.spellsData.classes.wizard);
    expect(valueOf(t.background)).toHaveTextContent(messages.characterBackgrounds.sage);
    expect(valueOf(t.alignment)).toHaveTextContent(messages.characterAlignments['lawful-good']);
    expect(valueOf(t.level)).toHaveTextContent('5');
    expect(valueOf(t.proficiencyBonus)).toHaveTextContent('+3');
    expect(screen.getByText('6,500')).toBeInTheDocument();
  });

  it('só leitura: o que ninguém escolheu vira "—", não "Definir…"', () => {
    renderHeader({ race: '', background: '', alignment: '' }, true);

    expect(valueOf(t.race)).toHaveTextContent('—');
    expect(valueOf(t.background)).toHaveTextContent('—');
    expect(valueOf(t.alignment)).toHaveTextContent('—');
    expect(screen.queryByText(t.racePlaceholder)).not.toBeInTheDocument();
    expect(screen.queryByText(t.alignmentPlaceholder)).not.toBeInTheDocument();
  });

  it('só leitura: o texto próprio do jogador aparece como foi escrito', () => {
    renderHeader({ race: 'Meio-dragão' }, true);

    expect(valueOf(t.race)).toHaveTextContent('Meio-dragão');
  });
});
