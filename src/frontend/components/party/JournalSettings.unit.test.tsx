import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { googleDocUrl } from '@shared/google-docs';

import { JournalSettings } from './JournalSettings';

const hook = { setJournal: { mutate: vi.fn(), isPending: false } };
vi.mock('@frontend/hooks/useParty', () => ({ useParty: () => hook }));

const t = messages.parties.journal;
const DOC_ID = 'abcDEF_123-xyz_0123456789';
const party = (journalDocId: string | null) => ({ id: 'party-1', journalDocId }) as PartyView;

describe('JournalSettings', () => {
  beforeEach(() => {
    hook.setJournal.mutate.mockClear();
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

  it('com diário: mostra o link e Remover, depois de confirmar, tira o diário', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<JournalSettings party={party(DOC_ID)} />);

    expect(screen.getByLabelText(t.linkLabel)).toHaveValue(googleDocUrl(DOC_ID));
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: t.remove }));

    expect(hook.setJournal.mutate).toHaveBeenCalledWith(null, expect.anything());
  });

  it('explica como compartilhar o documento', () => {
    renderWithProviders(<JournalSettings party={party(null)} />);

    expect(screen.getByText('Anyone with the link')).toBeVisible();
  });
});
