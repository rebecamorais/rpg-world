import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CombatStatsSection from '../stats/CombatStatsSection';
import { SaveCharacterButton } from './SaveControls';

const t = messages.common;

const character = {
  ...createDnD5eCharacter('owner', 'Thor', { ac: 14 }),
  id: 'c1',
} as DnD5eCharacter;

function renderSheet() {
  return renderWithCharacter(
    <>
      <SaveCharacterButton />
      <CombatStatsSection />
    </>,
    character,
  );
}

describe('SaveCharacterButton', () => {
  it('segura o salvar enquanto um campo tem valor inválido', async () => {
    const user = userEvent.setup();
    const { save } = renderSheet();

    // A valid edit makes the sheet dirty
    await user.clear(screen.getByLabelText('AC'));
    await user.type(screen.getByLabelText('AC'), '15');
    expect(screen.getByRole('button', { name: t.saveChanges })).toBeEnabled();

    // Then a field is cleared: no save, from the buttons or Ctrl+S
    await user.clear(screen.getByLabelText('Speed'));
    await user.tab();
    expect(screen.getByRole('button', { name: t.saveChanges })).toBeDisabled();
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(t.fixFieldsToSave);
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(save).not.toHaveBeenCalled();

    // Fixing it frees the save
    await user.type(screen.getByLabelText('Speed'), '9');
    expect(screen.getByRole('button', { name: t.saveChanges })).toBeEnabled();
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(save).toHaveBeenCalled();
  });

  it('o campo com erro ganha borda vermelha', async () => {
    const user = userEvent.setup();
    renderSheet();

    const speed = screen.getByLabelText('Speed');
    await user.clear(speed);
    await user.tab();

    expect(speed).toHaveAttribute('aria-invalid', 'true');
    expect(speed).toHaveClass('border-danger');
  });
});
