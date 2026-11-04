import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { UserProvider } from '@frontend/context/UserContext';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartyPage } from './PartyPage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/parties/p1',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('@frontend/hooks/usePartyChannel', () => ({ usePartyChannel: () => ({ live: true }) }));
vi.mock('@frontend/hooks/useCharacters', () => ({ useCharacters: () => ({ characters: [] }) }));
vi.mock('@frontend/components/combat/PlayerCombatPanel', () => ({
  PlayerCombatPanel: () => <p>combat panel</p>,
}));

const t = messages.parties;
const person = (userId: string) => ({
  userId,
  username: userId,
  avatarUrl: null,
  status: 'active' as const,
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
  people: [person('ana'), person('bia')],
  roster: [],
  myCharacterIds: [],
  journalDocId: null,
  gm: null,
  ...overrides,
});

function renderPage(view: PartyView) {
  vi.mocked(rpgWorldApi.get).mockImplementation(async (url: string) =>
    url === '/api/parties' ? { asGm: [], asPlayer: [], invites: [], requests: [] } : view,
  );
  return renderWithProviders(
    <UserProvider user={{ id: 'ana', email: 'a@example.com' }}>
      <PartyPage partyId="p1" />
    </UserProvider>,
  );
}

describe('PartyPage sem mestre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rpgWorldApi.delete).mockResolvedValue(undefined);
  });

  it('mostra o pedido de mestre no lugar do combate', async () => {
    renderPage(party());

    expect(await screen.findByRole('button', { name: t.gmClaim.claim })).toBeInTheDocument();
    expect(screen.queryByText('combat panel')).not.toBeInTheDocument();
  });

  it('com mestre, a página de jogador segue com o combate e sem o pedido', async () => {
    renderPage(party({ hasGm: true }));

    expect(await screen.findByText('combat panel')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.gmClaim.claim })).not.toBeInTheDocument();
  });

  it('o último jogador que sai é avisado de que a mesa será apagada', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage(party({ people: [person('ana')] }));

    await userEvent.setup().click(await screen.findByRole('button', { name: t.mine.leave }));

    expect(confirm).toHaveBeenCalledWith(t.mine.leaveConfirmLastPlayer);
    expect(rpgWorldApi.delete).not.toHaveBeenCalled();
  });

  it('com outros jogadores ativos, o aviso é o de sempre', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(party());

    await userEvent.setup().click(await screen.findByRole('button', { name: t.mine.leave }));

    expect(confirm).toHaveBeenCalledWith(t.mine.leaveConfirm);
    await waitFor(() =>
      expect(rpgWorldApi.delete).toHaveBeenCalledWith('/api/parties/p1/members/ana'),
    );
  });
});
