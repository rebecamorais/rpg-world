import { act, screen, waitFor } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError, rpgWorldApi } from '@client';

import { UserProvider } from '@frontend/context/UserContext';
import { partyQueryKey } from '@frontend/lib/query-keys';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartyFrame } from './PartyFrame';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const toast = vi.hoisted(() => vi.fn());
vi.mock('@frontend/demo/DemoContext', () => ({ useDemo: () => ({ isDemo: false }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/parties/p1',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), delete: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: Object.assign(toast, { success: vi.fn(), error: vi.fn() }) }));
vi.mock('@frontend/hooks/usePartyChannel', () => ({ usePartyChannel: () => ({ live: true }) }));
vi.mock('@frontend/components/combat/useYourTurnToast', () => ({ useYourTurnToast: () => {} }));

const t = messages.parties.page;

const party = (role: PartyView['role'] = 'player'): PartyView => ({
  id: 'p1',
  name: 'Mesa de Quinta',
  system: 'dnd5e',
  edition: '2014',
  imageUrl: null,
  role,
  hasGm: true,
  gmClaim: null,
  people: [],
  roster: [],
  myCharacterIds: [],
  journalDocId: null,
  gm: role === 'gm' ? { inviteCode: 'c'.repeat(32), rolePlay: [] } : null,
});

const notFound = () => new APIError('party_not_found', 404);

function renderFrame() {
  return renderWithProviders(
    <UserProvider user={{ id: 'ana', email: 'a@example.com' }}>
      <PartyFrame partyId="p1">
        <p>tab content</p>
      </PartyFrame>
    </UserProvider>,
  );
}

/** The next fetch of the party (a "party" notice on the channel) answers "not found". */
async function partyGoesAway(queryClient: ReturnType<typeof renderFrame>['queryClient']) {
  vi.mocked(rpgWorldApi.get).mockRejectedValue(notFound());
  await act(() => queryClient.invalidateQueries({ queryKey: partyQueryKey('p1') }));
}

describe('PartyFrame: a mesa some com a página aberta', () => {
  beforeEach(() => vi.clearAllMocks());

  it('o jogador tirado pelo mestre é avisado e vai para a lista de mesas', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue(party());
    const { queryClient } = renderFrame();
    expect(await screen.findByText('tab content')).toBeInTheDocument();

    await partyGoesAway(queryClient);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/parties'));
    expect(toast).toHaveBeenCalledWith(t.removed, { id: 'party-gone-p1' });
    // On the way out: not the "Party not found" page in between
    expect(screen.queryByText(t.notFoundTitle)).not.toBeInTheDocument();
  });

  it('o mestre com a mesa aberta em outra aba vê que ela foi apagada', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue(party('gm'));
    const { queryClient } = renderFrame();
    expect(await screen.findByText('tab content')).toBeInTheDocument();

    await partyGoesAway(queryClient);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/parties'));
    expect(toast).toHaveBeenCalledWith(t.deleted, { id: 'party-gone-p1' });
  });

  // "Leave party" says so and navigates itself; a second notice would read as being kicked out
  it('sair por conta própria não dá o aviso de quem foi tirado', async () => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue(party());
    const { queryClient } = renderFrame();
    expect(await screen.findByText('tab content')).toBeInTheDocument();

    vi.mocked(rpgWorldApi.delete).mockResolvedValue(undefined);
    await act(async () => {
      await queryClient
        .getMutationCache()
        .build(queryClient, { mutationFn: (_userId: string) => rpgWorldApi.delete('/members/ana') })
        .execute('ana');
    });
    await partyGoesAway(queryClient);

    await waitFor(() =>
      expect(queryClient.getQueryState(partyQueryKey('p1'))?.status).toBe('error'),
    );
    expect(toast).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('abrir uma mesa de que nunca fez parte continua em "Mesa não encontrada", sem aviso', async () => {
    vi.mocked(rpgWorldApi.get).mockRejectedValue(notFound());
    renderFrame();

    expect(await screen.findByText(t.notFoundTitle)).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
