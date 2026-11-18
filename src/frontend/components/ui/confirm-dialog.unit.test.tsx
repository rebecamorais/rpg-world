import { useState } from 'react';

import { renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { type ConfirmOptions, useConfirm } from './confirm-dialog';

const t = messages.common;

function Asker(options: ConfirmOptions) {
  const confirm = useConfirm();
  const [answer, setAnswer] = useState('none');
  return (
    <>
      <button onClick={async () => setAnswer(String(await confirm(options)))}>ask</button>
      <output>{answer}</output>
    </>
  );
}

async function ask(options: ConfirmOptions = { description: 'Delete the party?' }) {
  const user = userEvent.setup();
  renderWithProviders(<Asker {...options} />);
  await user.click(screen.getByRole('button', { name: 'ask' }));
  return { user, dialog: screen.getByRole('alertdialog') };
}

const answer = () => screen.getByRole('status');

describe('ConfirmProvider / useConfirm', () => {
  it('mostra a descrição e responde true ao confirmar', async () => {
    const { user, dialog } = await ask({
      description: 'Delete the party?',
      confirmLabel: 'Delete',
    });

    expect(dialog).toHaveTextContent('Delete the party?');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(answer()).toHaveTextContent('true'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('responde false em Cancelar', async () => {
    const { user, dialog } = await ask();

    await user.click(within(dialog).getByRole('button', { name: t.cancel }));

    await waitFor(() => expect(answer()).toHaveTextContent('false'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('responde false no Escape', async () => {
    const { user } = await ask();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(answer()).toHaveTextContent('false'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('Cancelar recebe o foco ao abrir', async () => {
    const { dialog } = await ask();

    expect(within(dialog).getByRole('button', { name: t.cancel })).toHaveFocus();
  });

  it('sem título nem rótulo, usa "Tem certeza?" e "Confirmar"', async () => {
    const { dialog } = await ask();

    expect(within(dialog).getByRole('heading', { name: t.confirmTitle })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: t.confirm })).toBeInTheDocument();
  });

  it('usa o título dado quando há um', async () => {
    const { dialog } = await ask({ title: 'Delete party', description: 'Gone for good.' });

    expect(within(dialog).getByRole('heading', { name: 'Delete party' })).toBeInTheDocument();
    expect(within(dialog).queryByText(t.confirmTitle)).not.toBeInTheDocument();
  });

  it('destrutivo: o botão de confirmar fica vermelho', async () => {
    const { dialog } = await ask({
      description: 'Delete the party?',
      confirmLabel: 'Delete',
      destructive: true,
    });

    expect(within(dialog).getByRole('button', { name: 'Delete' })).toHaveClass('bg-destructive');
  });

  it('não destrutivo: o botão de confirmar não é vermelho', async () => {
    const { dialog } = await ask();

    expect(within(dialog).getByRole('button', { name: t.confirm })).not.toHaveClass(
      'bg-destructive',
    );
  });

  it('useConfirm fora do provider lança erro', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useConfirm())).toThrow(/ConfirmProvider/);
    silence.mockRestore();
  });

  it('com confirmText, só confirma depois de digitar o texto (sem contar espaços nas pontas)', async () => {
    const { user, dialog } = await ask({
      title: 'Delete A Torre?',
      description: 'Gone for good.',
      confirmLabel: 'Delete',
      confirmText: 'A Torre',
    });
    const field = within(dialog).getByRole('textbox', { name: t.typeToConfirmLabel });
    const button = within(dialog).getByRole('button', { name: 'Delete' });

    expect(field).toHaveFocus();
    expect(button).toBeDisabled();
    await user.type(field, 'A Tore{Enter}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, ' A Torre {Enter}');

    await waitFor(() => expect(answer()).toHaveTextContent('true'));
  });
});
