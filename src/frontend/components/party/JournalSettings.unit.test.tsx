import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { googleDocUrl } from '@shared/google-docs';

import { JournalSettings } from './JournalSettings';

const hook = { setJournal: { mutate: vi.fn(), isPending: false } };
vi.mock('@frontend/hooks/useParty', () => ({ useParty: () => hook }));
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const t = messages.parties.journal;
const DOC_ID = 'abcDEF_123-xyz_0123456789';
const party = (journalDocId: string | null) => ({ id: 'party-1', journalDocId }) as PartyView;

describe('JournalSettings', () => {
  beforeEach(() => {
    hook.setJournal.mutate.mockClear();
    router.push.mockClear();
  });

  it('sem link: campo vazio, Salvar desabilitado e sem Remover', () => {
    renderWithProviders(<JournalSettings party={party(null)} />);

    expect(screen.getByLabelText(t.linkLabel)).toHaveValue('');
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
    expect(screen.queryByRole('button', { name: t.remove })).not.toBeInTheDocument();
  });

  it('uma URL válida habilita Salvar e o clique manda a URL', async () => {
    renderWithProviders(<JournalSettings party={party(null)} />);
    const url = googleDocUrl(DOC_ID);

    await userEvent.type(screen.getByLabelText(t.linkLabel), url);
    await userEvent.click(screen.getByRole('button', { name: t.save }));

    expect(hook.setJournal.mutate).toHaveBeenCalledWith(url, expect.anything());
  });

  it('um link do Drive não vale: Salvar continua desabilitado', async () => {
    renderWithProviders(<JournalSettings party={party(null)} />);

    await userEvent.type(
      screen.getByLabelText(t.linkLabel),
      'https://drive.google.com/file/d/abc123/view',
    );

    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
  });

  it('colar um link que não é de documento diz o porquê, ligado ao campo', async () => {
    renderWithProviders(<JournalSettings party={party(null)} />);
    const field = screen.getByLabelText(t.linkLabel);

    await userEvent.click(field);
    await userEvent.paste('https://example.com/abc');

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(
      messages.common.errors.party_error_journal_url_invalid,
    );
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
  });

  it('enquanto digita não acusa erro; ao sair do campo, sim', async () => {
    renderWithProviders(<JournalSettings party={party(null)} />);
    const field = screen.getByLabelText(t.linkLabel);

    await userEvent.type(field, 'https://docs.goo');
    expect(field).not.toHaveAttribute('aria-invalid');

    await userEvent.tab();
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });

  it('salvo, o aviso leva ao diário', async () => {
    renderWithProviders(<JournalSettings party={party(null)} />);
    const success = vi.spyOn(toast, 'success');

    await userEvent.type(screen.getByLabelText(t.linkLabel), googleDocUrl(DOC_ID));
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    const [, options] = hook.setJournal.mutate.mock.calls[0];
    options.onSuccess();

    const [message, toastOptions] = success.mock.calls[0];
    expect(message).toBe(t.saved);
    const action = (toastOptions as { action: { label: string; onClick: () => void } }).action;
    expect(action.label).toBe(t.view);
    action.onClick();
    expect(router.push).toHaveBeenCalledWith('/parties/party-1/journal');
  });

  it('com diário: mostra o link e Remover, depois de confirmar, tira o diário', async () => {
    renderWithProviders(<JournalSettings party={party(DOC_ID)} />);
    const user = userEvent.setup();

    expect(screen.getByLabelText(t.linkLabel)).toHaveValue(googleDocUrl(DOC_ID));
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: t.remove }));
    const dialog = screen.getByRole('alertdialog', { name: t.removeTitle });
    expect(dialog).toHaveTextContent(t.removeConfirm);
    expect(hook.setJournal.mutate).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: t.remove }));

    expect(hook.setJournal.mutate).toHaveBeenCalledWith(null, expect.anything());
  });

  it('enquanto salva, Remover fica desabilitado', () => {
    hook.setJournal.isPending = true;
    try {
      renderWithProviders(<JournalSettings party={party(DOC_ID)} />);

      expect(screen.getByRole('button', { name: t.remove })).toBeDisabled();
    } finally {
      hook.setJournal.isPending = false;
    }
  });

  it('explica como compartilhar o documento', () => {
    renderWithProviders(<JournalSettings party={party(null)} />);

    expect(screen.getByText('Anyone with the link')).toBeVisible();
  });
});
