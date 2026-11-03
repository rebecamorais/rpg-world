import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { googleDocUrl } from '@shared/google-docs';

import { PartyJournal } from './PartyJournal';

const t = messages.parties.journal;
const DOC_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-abcd';

const desktop = (matches: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

describe('PartyJournal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('no computador com diário: iframe e link para abrir no Google Docs', () => {
    desktop(true);
    renderWithProviders(<PartyJournal docId={DOC_ID} role="player" partyId="p1" />);

    expect(screen.getByTitle(t.frameTitle)).toHaveAttribute('src', googleDocUrl(DOC_ID));
    const link = screen.getByRole('link', { name: t.open });
    expect(link).toHaveAttribute('href', googleDocUrl(DOC_ID));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('no celular com diário: aviso e link, sem iframe', () => {
    desktop(false);
    renderWithProviders(<PartyJournal docId={DOC_ID} role="player" partyId="p1" />);

    expect(screen.queryByTitle(t.frameTitle)).not.toBeInTheDocument();
    expect(screen.getByText(t.mobileNotice)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.open })).toHaveAttribute(
      'href',
      googleDocUrl(DOC_ID),
    );
  });

  it('sem diário, o jogador vê que o Mestre ainda não configurou', () => {
    desktop(true);
    renderWithProviders(<PartyJournal docId={null} role="player" partyId="p1" />);

    expect(screen.getByText(t.emptyPlayer)).toBeInTheDocument();
    expect(screen.queryByTitle(t.frameTitle)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('sem diário, o Mestre vê o link para as configurações', () => {
    desktop(true);
    renderWithProviders(<PartyJournal docId={null} role="gm" partyId="p1" />);

    expect(screen.getByRole('link', { name: t.setUp })).toHaveAttribute(
      'href',
      '/parties/p1/settings',
    );
  });
});
