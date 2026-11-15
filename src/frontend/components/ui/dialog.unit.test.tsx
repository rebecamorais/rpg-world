import { useState } from 'react';

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

const t = messages.common;

/** Opened from state, the way most dialogs here are: no DialogTrigger for Radix to go back to. */
function FromState({ withAutoFocus = false, value }: { withAutoFocus?: boolean; value?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Add spell</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onOpenAutoFocus={
            withAutoFocus
              ? (event) => {
                  event.preventDefault();
                  document.getElementById('second')?.focus();
                }
              : undefined
          }
        >
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Find a spell</DialogDescription>
          <input aria-label="Name" defaultValue={value} />
          <input id="second" aria-label="Level" />
          <button onClick={() => setOpen(false)}>Done</button>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Opened from a DropdownMenu item: the item unmounts with the menu. */
function FromMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setOpen(true)}>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Rename</DialogTitle>
          <DialogDescription>New name</DialogDescription>
          <input aria-label="Name" />
        </DialogContent>
      </Dialog>
    </>
  );
}

describe('DialogContent', () => {
  it('abre no primeiro campo, não no X', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FromState />);
    await user.click(screen.getByRole('button', { name: 'Add spell' }));

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it('respeita o foco escolhido por quem usa o diálogo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FromState withAutoFocus />);
    await user.click(screen.getByRole('button', { name: 'Add spell' }));

    expect(screen.getByRole('textbox', { name: 'Level' })).toHaveFocus();
  });

  it('seleciona o valor do campo ao abrir (digitar substitui)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FromState value="10" />);
    await user.click(screen.getByRole('button', { name: 'Add spell' }));

    const field = screen.getByRole<HTMLInputElement>('textbox', { name: 'Name' });
    expect(field).toHaveFocus();
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(2);
  });

  it('o X é o primeiro tabbable do diálogo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FromState />);
    await user.click(screen.getByRole('button', { name: 'Add spell' }));
    const dialog = screen.getByRole('dialog');

    // The DOM order, not a Shift+Tab (the focus scope wraps around, so that passes either way)
    const tabbables = [...dialog.querySelectorAll<HTMLElement>('button, input')].filter(
      (element) => element.tabIndex >= 0,
    );
    expect(tabbables[0]).toBe(within(dialog).getByRole('button', { name: t.close }));
    expect(tabbables[1]).toBe(screen.getByRole('textbox', { name: 'Name' }));
  });

  it('aberto de um item de menu, devolve o foco ao gatilho do menu', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FromMenu />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('aberto por estado, devolve o foco ao botão que abriu ao fechar com Esc', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FromState />);
    const opener = screen.getByRole('button', { name: 'Add spell' });
    await user.click(opener);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it('devolve o foco também ao fechar por um botão do diálogo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FromState />);
    const opener = screen.getByRole('button', { name: 'Add spell' });
    await user.click(opener);

    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it('com DialogTrigger continua voltando ao gatilho', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Text</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    // Nothing else to focus: the close button gets it
    expect(screen.getByRole('button', { name: t.close })).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('a coluna do diálogo não cresce com uma palavra longa, e o texto quebra', () => {
    const word = 'Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    renderWithProviders(
      <Dialog open>
        <DialogContent>
          <DialogTitle>{word}</DialogTitle>
          <DialogDescription>{word}</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    // minmax(0,1fr): the track can shrink below the word's width (1fr alone grows with it)
    expect(screen.getByRole('dialog')).toHaveClass('grid', 'grid-cols-[minmax(0,1fr)]');
    expect(screen.getByRole('heading', { name: word })).toHaveClass('break-words');
    expect(screen.getByText(word, { selector: 'p' })).toHaveClass('break-words');
  });
});
