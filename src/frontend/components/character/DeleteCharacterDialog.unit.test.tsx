import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import type { CharacterSummary } from '@shared/types/character';

import { DeleteCharacterDialog } from './DeleteCharacterDialog';

const goblin = { id: 'npc-1', name: 'Goblin', system: 'DnD_5e', level: 1 } as CharacterSummary;

function renderDialog(confirmName: string) {
  const onConfirm = vi.fn();
  renderWithProviders(
    <DeleteCharacterDialog
      character={goblin}
      confirmName={confirmName}
      onConfirmNameChange={vi.fn()}
      onConfirm={onConfirm}
      onCancel={vi.fn()}
      isPending={false}
    />,
  );
  return { onConfirm, field: screen.getByRole('textbox') };
}

describe('DeleteCharacterDialog', () => {
  it('Enter confirma quando o nome digitado confere', async () => {
    const { onConfirm, field } = renderDialog('Goblin');

    await userEvent.type(field, '{Enter}');

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('Enter não faz nada enquanto o nome não confere', async () => {
    const { onConfirm, field } = renderDialog('Gob');

    await userEvent.type(field, '{Enter}');

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('o campo do nome não passa pelo corretor ortográfico', () => {
    const { field } = renderDialog('');

    expect(field).toHaveAttribute('spellcheck', 'false');
  });
});
