import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import type { CharacterKind, CharacterSummary } from '@shared/types/character';

import { DeleteCharacterDialog } from './DeleteCharacterDialog';

const goblin = { id: 'npc-1', name: 'Goblin', system: 'DnD_5e', level: 1 } as CharacterSummary;

function renderDialog(
  confirmName: string,
  { kind, character = goblin }: { kind?: CharacterKind; character?: CharacterSummary } = {},
) {
  const onConfirm = vi.fn();
  renderWithProviders(
    <DeleteCharacterDialog
      character={character}
      kind={kind}
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

  it('um NPC é chamado de NPC no título, na descrição e na instrução', () => {
    renderDialog('', { kind: 'npc' });
    const t = messages.enemies;

    const dialog = screen.getByRole('dialog', { name: t.deleteDialogTitle });
    expect(dialog).toHaveTextContent(t.deleteDialogDescription.replace('{name}', 'Goblin'));
    expect(dialog).toHaveTextContent(
      t.deleteConfirmInstruction.replace('<bold>{name}</bold>', 'Goblin'),
    );
    expect(dialog).not.toHaveTextContent(messages.characters.deleteDialogTitle);
  });

  it('um personagem continua "Excluir personagem?"', () => {
    renderDialog('');

    expect(
      screen.getByRole('dialog', { name: messages.characters.deleteDialogTitle }),
    ).toBeInTheDocument();
  });

  it('um nome sem espaços quebra dentro do diálogo', () => {
    const name = 'Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    renderDialog('', { character: { ...goblin, name } });

    expect(screen.getByText(name, { selector: 'strong' }).closest('p')).toHaveClass(
      'wrap-anywhere',
    );
    expect(screen.getByRole('dialog')).toHaveClass('grid-cols-[minmax(0,1fr)]');
  });

  it('enquanto exclui, nem Cancelar nem Esc fecham o diálogo', async () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <DeleteCharacterDialog
        character={goblin}
        confirmName="Goblin"
        onConfirmNameChange={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        isPending
      />,
    );

    const cancel = screen.getByRole('button', { name: messages.common.cancel });
    expect(cancel).toBeDisabled();
    await userEvent.keyboard('{Escape}');

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
