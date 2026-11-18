import { screen } from '@testing-library/react';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { Dialog } from '@frontend/components/ui/dialog';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { type CombatConfigSection, CombatStatsDialog } from './CombatStatsDialog';

const character = {
  ...createDnD5eCharacter('owner', 'Thor'),
  id: 'c1',
  spellcastingSystem: 'slots',
} as DnD5eCharacter;

function renderDialog(section: CombatConfigSection) {
  return renderWithCharacter(
    <Dialog open>
      <CombatStatsDialog section={section} />
    </Dialog>,
    character,
  );
}

describe('CombatStatsDialog', () => {
  it('a nota do rascunho vem antes do Concluir, também no celular', () => {
    renderDialog('hp');

    const note = screen.getByText(messages.common.draftNote);
    const done = screen.getByRole('button', { name: messages.common.done });
    // DialogFooter alone is flex-col-reverse below sm: the note ended up under the button
    expect(note.parentElement).not.toHaveClass('flex-col-reverse');
    expect(note.compareDocumentPosition(done) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('o Concluir e as abas mantêm a caixa do texto', () => {
    renderDialog('magic');

    expect(screen.getByRole('button', { name: messages.common.done })).not.toHaveClass('uppercase');
    for (const tab of screen.getAllByRole('tab')) expect(tab).not.toHaveClass('uppercase');
  });

  it('os rótulos dos campos usam o mesmo estilo dos passos (text-label)', () => {
    renderDialog('hp');
    expect(screen.getByText(messages.combatStats.hitPointsMax)).toHaveClass('text-label');
    expect(screen.getByText(messages.combatStats.hitPointsMax)).not.toHaveClass('font-bold');
  });

  it('a capacidade de espaços por nível usa text-label', () => {
    renderDialog('magic');
    expect(screen.getByText(messages.magicSystem.slotsCapacity)).toHaveClass('text-label');
  });
});
