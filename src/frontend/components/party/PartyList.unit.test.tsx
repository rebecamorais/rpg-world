import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { UserProvider } from '@frontend/context/UserContext';

import type { MyParties, PartySummary } from '@backend/contexts/parties/domain/Party';

import PartyList from './PartyList';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>();
  return { ...actual, toast: Object.assign(vi.fn(), actual.toast, { success: vi.fn() }) };
});

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

  it('convite de mesa sem mestre não oferece Aceitar, só Recusar, e diz quando dá', async () => {
    renderList(mine({ invites: [party('invite', { status: 'invited', hasGm: false })] }));

    const invites = await screen.findByRole('region', { name: t.invites });
    expect(within(invites).getByText(t.noGmInviteHint)).toBeInTheDocument();
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
    vi.mocked(rpgWorldApi.delete).mockResolvedValue(undefined);
    renderList(mine({ invites: [party('invite', { status: 'invited' })] }));
    const user = userEvent.setup();

    const decline = await screen.findByRole('button', {
      name: named(t.declineInvite, 'Mesa invite'),
    });
    await user.click(decline);
    const dialog = screen.getByRole('alertdialog', { name: t.declineInviteTitle });
    expect(dialog).toHaveTextContent(named(t.declineInviteConfirm, 'Mesa invite'));
    await user.click(within(dialog).getByRole('button', { name: messages.common.cancel }));
    expect(rpgWorldApi.delete).not.toHaveBeenCalled();

    await user.click(decline);
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.decline }),
    );
    await vi.waitFor(() => expect(rpgWorldApi.delete).toHaveBeenCalled());
  });

  it('cancelar um pedido pede confirmação com o nome da mesa', async () => {
    renderList(mine({ requests: [party('pedido', { status: 'requested' })] }));
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole('button', { name: named(t.withdrawFrom, 'Mesa pedido') }),
    );

    expect(screen.getByRole('alertdialog', { name: t.withdrawTitle })).toHaveTextContent(
      named(t.withdrawConfirm, 'Mesa pedido'),
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
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

  it('os pedidos pendentes vêm logo depois dos convites, antes das mesas', async () => {
    renderList(
      mine({
        invites: [party('invite', { status: 'invited' })],
        requests: [party('pedido', { status: 'requested' })],
        asGm: [party('gm', { role: 'gm', status: 'gm' })],
        asPlayer: [party('player')],
      }),
    );

    await screen.findByRole('region', { name: t.requests });
    const order = screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'));
    expect(order).toEqual([t.invites, t.requests, t.asGm, t.asPlayer, t.create.title]);
    const pending = screen.getByRole('region', { name: t.requests });
    expect(within(pending).getByText(t.requestWaiting)).toBeInTheDocument();
  });

  it('a mesa de que sou mestre mostra quantos jogadores tem', async () => {
    renderList(
      mine({
        asGm: [
          party('cheia', { role: 'gm', status: 'gm', activePlayers: 3 }),
          party('vazia', { role: 'gm', status: 'gm', activePlayers: 0 }),
        ],
      }),
    );

    const asGm = await screen.findByRole('region', { name: t.asGm });
    expect(within(asGm).getByText('3 players')).toBeInTheDocument();
    expect(within(asGm).getByText('No players yet')).toBeInTheDocument();
  });

  it('o nome da mesa quebra em duas linhas com o nome inteiro no título, e o mestre em caixa normal', async () => {
    const name = 'Convite para a Grande Expedição às Montanhas Geladas do Norte';
    renderList(mine({ asPlayer: [party('longa', { name, gmUsername: 'Mestra_X' })] }));

    const link = await screen.findByRole('link', { name });
    expect(link).toHaveAttribute('title', name);
    expect(link).toHaveClass('line-clamp-2');
    expect(link).not.toHaveClass('truncate');
    const gm = screen.getByText('GM: @Mestra_X');
    expect(gm).toHaveClass('text-caption');
    expect(gm).not.toHaveClass('text-label');
  });

  it('responder a um convite trava só aquela linha', async () => {
    vi.mocked(rpgWorldApi.patch).mockReturnValue(new Promise(() => {}));
    renderList(
      mine({
        invites: [party('a', { status: 'invited' }), party('b', { status: 'invited' })],
      }),
    );
    const user = userEvent.setup();

    const acceptA = await screen.findByRole('button', { name: named(t.acceptInvite, 'Mesa a') });
    await user.click(acceptA);

    await vi.waitFor(() => expect(acceptA).toHaveAttribute('aria-busy', 'true'));
    expect(screen.getByRole('button', { name: named(t.declineInvite, 'Mesa a') })).toBeDisabled();
    expect(screen.getByRole('button', { name: named(t.acceptInvite, 'Mesa b') })).toBeEnabled();
  });

  // d-fase2-tempo-real#2: accepting from the list said nothing and stayed on /parties
  it('aceitar um convite avisa e leva para a mesa', async () => {
    vi.mocked(rpgWorldApi.patch).mockResolvedValue(undefined);
    renderList(mine({ invites: [party('invite', { status: 'invited' })] }));

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: named(t.acceptInvite, 'Mesa invite') }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/parties/invite'));
    expect(toast.success).toHaveBeenCalledWith(named(t.joinedParty, 'Mesa invite'));
  });

  it('recusar um convite e cancelar um pedido avisam', async () => {
    vi.mocked(rpgWorldApi.delete).mockResolvedValue(undefined);
    renderList(
      mine({
        invites: [party('invite', { status: 'invited' })],
        requests: [party('pedido', { status: 'requested' })],
      }),
    );
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole('button', { name: named(t.declineInvite, 'Mesa invite') }),
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.decline }),
    );
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(named(t.inviteDeclined, 'Mesa invite')),
    );

    await user.click(screen.getByRole('button', { name: named(t.withdrawFrom, 'Mesa pedido') }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.withdraw }),
    );
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(named(t.requestWithdrawn, 'Mesa pedido')),
    );
    expect(push).not.toHaveBeenCalled();
  });
});
