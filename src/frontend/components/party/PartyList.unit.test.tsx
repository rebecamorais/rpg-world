import { screen, within } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { UserProvider } from '@frontend/context/UserContext';

import type { MyParties, PartySummary } from '@backend/contexts/parties/domain/Party';

import PartyList from './PartyList';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const t = messages.parties;

const party = (id: string, overrides: Partial<PartySummary> = {}): PartySummary => ({
  id,
  name: `Mesa ${id}`,
  system: 'dnd_5e',
  role: 'player',
  status: 'active',
  gmUsername: 'mestra',
  pendingRequests: 0,
  ...overrides,
});

const mine = (overrides: Partial<MyParties> = {}): MyParties => ({
  asGm: [],
  asPlayer: [],
  invites: [],
  requests: [],
  ...overrides,
});

function renderList(parties: MyParties) {
  vi.mocked(rpgWorldApi.get).mockResolvedValue(parties);
  return renderWithProviders(
    <UserProvider user={{ id: 'user-1', email: 'u@example.com' }}>
      <PartyList />
    </UserProvider>,
  );
}

describe('PartyList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra convites com aceitar/recusar e separa mestre e jogador', async () => {
    renderList(
      mine({
        asGm: [party('gm', { role: 'gm', status: 'gm', pendingRequests: 2 })],
        asPlayer: [party('player')],
        invites: [party('invite', { status: 'invited' })],
      }),
    );

    const invites = await screen.findByRole('region', { name: t.invites });
    expect(within(invites).getByText('Mesa invite')).toBeInTheDocument();
    expect(within(invites).getByRole('button', { name: t.accept })).toBeInTheDocument();
    expect(within(invites).getByRole('button', { name: t.decline })).toBeInTheDocument();

    const asGm = screen.getByRole('region', { name: t.asGm });
    expect(within(asGm).getByRole('link', { name: /Mesa gm/ })).toHaveAttribute(
      'href',
      '/parties/gm',
    );
    expect(within(asGm).getByText('2 requests')).toBeInTheDocument();

    const asPlayer = screen.getByRole('region', { name: t.asPlayer });
    expect(within(asPlayer).getByRole('link', { name: /Mesa player/ })).toBeInTheDocument();
  });

  it('aceitar um convite manda PATCH no próprio membro', async () => {
    vi.mocked(rpgWorldApi.patch).mockResolvedValue(undefined);
    renderList(mine({ invites: [party('invite', { status: 'invited' })] }));

    (await screen.findByRole('button', { name: t.accept })).click();

    await vi.waitFor(() =>
      expect(rpgWorldApi.patch).toHaveBeenCalledWith('/api/parties/invite/members/user-1'),
    );
  });

  it('com 5 mesas como mestre o botão de criar fica desabilitado com o aviso do limite', async () => {
    renderList(
      mine({
        asGm: ['1', '2', '3', '4', '5'].map((id) => party(id, { role: 'gm', status: 'gm' })),
      }),
    );

    expect(await screen.findByRole('button', { name: t.create.submit })).toBeDisabled();
    expect(screen.getByText(t.create.limit.replace('{max}', '5'))).toBeInTheDocument();
  });
});
