import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
const named = (text: string, name: string) => text.replace('{name}', name);

const party = (id: string, overrides: Partial<PartySummary> = {}): PartySummary => ({
  id,
  name: `Mesa ${id}`,
  system: 'dnd_5e',
  role: 'player',
  status: 'active',
  gmUsername: 'mestra',
  pendingRequests: 0,
  activePlayers: 0,
  hasGm: true,
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
    expect(
      within(invites).getByRole('button', { name: named(t.acceptInvite, 'Mesa invite') }),
    ).toHaveTextContent(t.accept);
    expect(
      within(invites).getByRole('button', { name: named(t.declineInvite, 'Mesa invite') }),
    ).toHaveTextContent(t.decline);

    const asGm = screen.getByRole('region', { name: t.asGm });
    expect(within(asGm).getByRole('link', { name: /Mesa gm/ })).toHaveAttribute(
      'href',
      '/parties/gm',
    );
    expect(within(asGm).getByText('2 requests')).toBeInTheDocument();

    const asPlayer = screen.getByRole('region', { name: t.asPlayer });
    expect(within(asPlayer).getByRole('link', { name: /Mesa player/ })).toBeInTheDocument();
  });

  it('mesa sem mestre aparece como "Sem mestre" e continua abrindo', async () => {
    renderList(
      mine({ asPlayer: [party('orfa', { gmUsername: null, hasGm: false, activePlayers: 2 })] }),
    );

    const asPlayer = await screen.findByRole('region', { name: t.asPlayer });
    expect(within(asPlayer).getByText(t.noGm)).toBeInTheDocument();
    expect(within(asPlayer).queryByText(/GM: @/)).not.toBeInTheDocument();
    expect(within(asPlayer).getByRole('link', { name: /Mesa orfa/ })).toHaveAttribute(
      'href',
      '/parties/orfa',
    );
  });

  it('criar mesa fica numa seção própria, depois das mesas', async () => {
    renderList(mine({ asGm: [party('gm', { role: 'gm', status: 'gm' })] }));

    const create = await screen.findByRole('region', { name: t.create.title });
    expect(within(create).getByLabelText(t.create.label)).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: t.asGm })).queryByLabelText(t.create.label),
    ).not.toBeInTheDocument();
  });

  it('convite de mesa sem mestre não oferece Aceitar, só Recusar', async () => {
    renderList(mine({ invites: [party('invite', { status: 'invited', hasGm: false })] }));

    const invites = await screen.findByRole('region', { name: t.invites });
    expect(
      within(invites).getByRole('button', { name: named(t.declineInvite, 'Mesa invite') }),
    ).toBeInTheDocument();
    expect(
      within(invites).queryByRole('button', { name: named(t.acceptInvite, 'Mesa invite') }),
    ).not.toBeInTheDocument();
  });

  it('aceitar um convite manda PATCH no próprio membro', async () => {
    vi.mocked(rpgWorldApi.patch).mockResolvedValue(undefined);
    renderList(mine({ invites: [party('invite', { status: 'invited' })] }));

    (await screen.findByRole('button', { name: named(t.acceptInvite, 'Mesa invite') })).click();

    await vi.waitFor(() =>
      expect(rpgWorldApi.patch).toHaveBeenCalledWith('/api/parties/invite/members/user-1'),
    );
  });

  it('recusar um convite pede confirmação com o nome da mesa', async () => {
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.mocked(rpgWorldApi.delete).mockResolvedValue(undefined);
    renderList(mine({ invites: [party('invite', { status: 'invited' })] }));

    const decline = await screen.findByRole('button', {
      name: named(t.declineInvite, 'Mesa invite'),
    });
    await userEvent.click(decline);
    expect(confirm).toHaveBeenCalledWith(named(t.declineInviteConfirm, 'Mesa invite'));
    expect(rpgWorldApi.delete).not.toHaveBeenCalled();

    await userEvent.click(decline);
    await vi.waitFor(() => expect(rpgWorldApi.delete).toHaveBeenCalled());
  });

  it('cancelar um pedido pede confirmação com o nome da mesa', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderList(mine({ requests: [party('pedido', { status: 'requested' })] }));

    await userEvent.click(
      await screen.findByRole('button', { name: named(t.withdrawFrom, 'Mesa pedido') }),
    );

    expect(confirm).toHaveBeenCalledWith(named(t.withdrawConfirm, 'Mesa pedido'));
    expect(rpgWorldApi.delete).not.toHaveBeenCalled();
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
