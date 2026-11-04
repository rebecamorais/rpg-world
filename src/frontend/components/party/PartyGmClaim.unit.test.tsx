import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { UserProvider } from '@frontend/context/UserContext';
import { PARTIES_QUERY_KEY, partyQueryKey } from '@frontend/lib/query-keys';

import type { MyParties, PartySummary } from '@backend/contexts/parties/domain/Party';
import type { GmClaim, PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartyGmClaim } from './PartyGmClaim';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const t = messages.parties.gmClaim;

const person = (userId: string, username: string | null) => ({
  userId,
  username,
  avatarUrl: null,
  status: 'active' as const,
});

const claim = (overrides: Partial<GmClaim> = {}): GmClaim => ({
  candidateId: 'bia',
  candidateUsername: 'bia',
  createdAt: '2026-11-01T12:00:00Z',
  pendingUserIds: ['caio', 'dani'],
  canAskSupport: false,
  ...overrides,
});

const party = (overrides: Partial<PartyView> = {}): PartyView => ({
  id: 'p1',
  name: 'Mesa',
  system: 'dnd_5e',
  edition: '2014',
  imageUrl: null,
  role: 'player',
  hasGm: false,
  gmClaim: null,
  people: [
    person('ana', 'ana'),
    person('bia', 'bia'),
    person('caio', 'caio'),
    person('dani', null),
  ],
  roster: [],
  myCharacterIds: [],
  journalDocId: null,
  gm: null,
  ...overrides,
});

const summary = (id: string, role: 'gm' | 'player'): PartySummary => ({
  id,
  name: id,
  system: 'dnd_5e',
  role,
  status: role === 'gm' ? 'gm' : 'active',
  gmUsername: null,
  pendingRequests: 0,
  activePlayers: 0,
  hasGm: true,
});

function renderClaim(view: PartyView, me: string, asGmCount = 0) {
  const mine: MyParties = {
    asGm: Array.from({ length: asGmCount }, (_, i) => summary(`gm-${i}`, 'gm')),
    asPlayer: [summary('p1', 'player')],
    invites: [],
    requests: [],
  };
  vi.mocked(rpgWorldApi.get).mockResolvedValue(mine);
  return renderWithProviders(
    <UserProvider user={{ id: me, email: 'u@example.com' }}>
      <PartyGmClaim party={view} />
    </UserProvider>,
  );
}

describe('PartyGmClaim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rpgWorldApi.post).mockResolvedValue(undefined);
    vi.mocked(rpgWorldApi.patch).mockResolvedValue(undefined);
    vi.mocked(rpgWorldApi.delete).mockResolvedValue(undefined);
  });

  it('sem pedido: Quero ser mestre, avisando do acordo e das fichas', async () => {
    renderClaim(party(), 'ana');

    const button = await screen.findByRole('button', { name: t.claim });
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByText(t.claimHint)).toBeInTheDocument();

    await userEvent.setup().click(button);
    await waitFor(() => expect(rpgWorldApi.post).toHaveBeenCalledWith('/api/parties/p1/gm-claim'));
  });

  it('com 5 mesas como mestre o botão fica desativado, com o motivo', async () => {
    renderClaim(party(), 'ana', 5);

    expect(await screen.findByText(t.limit.replace('{max}', '5'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.claim })).toBeDisabled();
  });

  it('o candidato vê quem falta e pode desistir', async () => {
    renderClaim(party({ gmClaim: claim() }), 'bia');

    const waiting = await screen.findByText(/@caio/);
    expect(waiting).toHaveTextContent(messages.parties.manage.unnamed);
    expect(waiting).not.toHaveTextContent('@bia');
    expect(screen.queryByRole('button', { name: t.accept })).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: t.cancel }));
    await waitFor(() =>
      expect(rpgWorldApi.delete).toHaveBeenCalledWith('/api/parties/p1/gm-claim'),
    );
  });

  it('quem falta aceita ou recusa, com o aviso sobre a ficha', async () => {
    renderClaim(party({ gmClaim: claim() }), 'caio');
    const user = userEvent.setup();

    expect(await screen.findByText(t.sheetWarning)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.accept }));
    await waitFor(() =>
      expect(rpgWorldApi.patch).toHaveBeenCalledWith('/api/parties/p1/gm-claim', {
        accept: true,
      }),
    );

    await user.click(screen.getByRole('button', { name: t.decline }));
    await waitFor(() =>
      expect(rpgWorldApi.patch).toHaveBeenCalledWith('/api/parties/p1/gm-claim', {
        accept: false,
      }),
    );
  });

  it('quem já aceitou vê que aceitou, sem os botões', async () => {
    renderClaim(party({ gmClaim: claim({ pendingUserIds: ['dani'] }) }), 'caio');

    expect(await screen.findByText(t.youAccepted)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.accept })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.decline })).not.toBeInTheDocument();
  });

  it('Pedir ajuda ao suporte fica desativado até canAskSupport', async () => {
    const { unmount } = renderClaim(party({ gmClaim: claim() }), 'caio');

    expect(await screen.findByRole('button', { name: t.askSupport })).toBeDisabled();
    expect(screen.getByText(t.supportLater)).toBeInTheDocument();
    unmount();

    renderClaim(party({ gmClaim: claim({ canAskSupport: true }) }), 'caio');
    expect(await screen.findByRole('link', { name: t.askSupport })).toHaveAttribute(
      'href',
      '/support?party=p1',
    );
  });

  it('depois de agir, a página da mesa e a lista são recarregadas', async () => {
    const { queryClient } = renderClaim(party(), 'ana');
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await userEvent.setup().click(await screen.findByRole('button', { name: t.claim }));

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: partyQueryKey('p1') });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: PARTIES_QUERY_KEY });
    });
  });
});
