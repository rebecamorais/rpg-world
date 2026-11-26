import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CombatStatsSection from '../stats/CombatStatsSection';
import { SaveBarSlotProvider, SaveCharacterButton, SaveControls } from './SaveControls';

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

  it('descartar pede confirmação e só então volta ao salvo', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.clear(screen.getByLabelText('AC'));
    await user.type(screen.getByLabelText('AC'), '15');
    await user.click(screen.getByRole('button', { name: t.discard }));

    const dialog = screen.getByRole('alertdialog', { name: t.discardConfirmTitle });
    expect(dialog).toHaveTextContent(t.discardConfirm);
    await user.click(within(dialog).getByRole('button', { name: t.cancel }));
    expect(screen.getByLabelText('AC')).toHaveValue('15');

    await user.click(screen.getByRole('button', { name: t.discard }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.discard }),
    );
    expect(screen.getByLabelText('AC')).toHaveValue('14');
  });
});

describe('SaveControls: foco quando a barra some', () => {
  // Discard and Save unmount the whole bar: the focus would fall to the page's start
  it('descartar devolve o foco ao campo de onde ele veio', async () => {
    const user = userEvent.setup();
    renderSheet();

    const ac = screen.getByLabelText('AC');
    await user.clear(ac);
    await user.type(ac, '15');
    await user.click(screen.getByRole('button', { name: t.discard }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.discard }),
    );

    expect(ac).toHaveValue('14');
    await waitFor(() => expect(ac).toHaveFocus());
  });
});

describe('SaveBarSlotProvider', () => {
  async function editAc() {
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('AC'));
    await user.type(screen.getByLabelText('AC'), '15');
  }

  it('numa aba sem botão de salvar, o rascunho do personagem ainda mostra a barra', async () => {
    const { save } = renderWithCharacter(
      <SaveBarSlotProvider>
        <CombatStatsSection />
      </SaveBarSlotProvider>,
      character,
    );

    await editAc();

    expect(screen.getByText(t.unsavedSheet)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    expect(save).toHaveBeenCalled();
  });

  it('na aba com botão de salvar, mostra uma barra só', async () => {
    renderWithCharacter(
      <SaveBarSlotProvider>
        <SaveCharacterButton />
        <CombatStatsSection />
      </SaveBarSlotProvider>,
      character,
    );

    await editAc();

    expect(screen.getAllByRole('button', { name: t.save })).toHaveLength(1);
    expect(screen.queryByText(t.unsavedSheet)).not.toBeInTheDocument();
  });

  // Between sm and md the tab bar starts right of the side menu; the bars stack over that span
  it('a coluna de barras começa onde começa a barra de abas', async () => {
    renderWithCharacter(
      <SaveBarSlotProvider>
        <CombatStatsSection />
      </SaveBarSlotProvider>,
      character,
    );

    await editAc();

    const column = screen.getByText(t.unsavedSheet).closest('.fixed');
    expect(column).toHaveClass(
      'inset-x-4',
      'sm:left-[calc(var(--sidebar-offset)+1rem)]',
      'md:right-6',
      'md:left-auto',
    );
  });

  // The footer and the toasts keep this much room, so neither ends up under Discard and Save
  it('com uma barra na tela, reserva o espaço dela embaixo; sem barra, devolve', async () => {
    const { unmount } = renderWithCharacter(
      <SaveBarSlotProvider>
        <CombatStatsSection />
      </SaveBarSlotProvider>,
      character,
    );
    const space = () => document.documentElement.style.getPropertyValue('--save-bar-space');
    expect(space()).toBe('');

    await editAc();

    // jsdom lays nothing out: the bar's top is 0, so it "covers" the whole window
    await waitFor(() => expect(space()).toBe(`${window.innerHeight}px`));
    unmount();
    expect(space()).toBe('');
  });
});

describe('SaveControls: sem conexão e conflito', () => {
  afterEach(() => vi.restoreAllMocks());

  function renderBar(props: Partial<Parameters<typeof SaveControls>[0]> = {}) {
    const handlers = { onSave: vi.fn(), onDiscard: vi.fn(), onReload: vi.fn() };
    renderWithProviders(<SaveControls isDirty isSaving={false} {...handlers} {...props} />);
    return handlers;
  }

  it('offline, a barra diz que as alterações continuam aqui e Descartar segue ativo', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderBar();

    expect(screen.getByText(t.offlineDraft)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.discard })).toBeEnabled();
    expect(screen.getByRole('button', { name: t.save })).toBeEnabled();
  });

  it('no conflito, troca Salvar por Recarregar e segura o Ctrl+S', async () => {
    const { onSave, onReload } = renderBar({ conflict: true });

    expect(screen.getByRole('alert')).toHaveTextContent(t.changedElsewhere);
    expect(screen.queryByRole('button', { name: t.save })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.saveChanges })).toBeDisabled();
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: t.reload }));
    expect(onReload).toHaveBeenCalled();
  });
});
