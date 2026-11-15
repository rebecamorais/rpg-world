import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError, rpgWorldApi } from '@client';

import { UserProvider } from '@frontend/context/UserContext';
import { PARTIES_QUERY_KEY } from '@frontend/lib/query-keys';

import { INVITE_POLL_MS, JoinPartyCard } from './JoinPartyCard';

const push = vi.fn();
const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: vi.fn() } }));

const t = messages.parties;
const invite = { partyId: 'p1', name: 'Mesa', gmUsername: 'mestra', hasGm: true, myStatus: null };

type Status = 'invited' | 'requested' | 'declined' | null;

function renderCard(myStatus: Status, hasGm = true) {
  return renderWithProviders(
    <UserProvider user={{ id: 'u1', email: 'u@example.com' }}>
      <JoinPartyCard
        code={'a'.repeat(32)}
        invite={{ ...invite, hasGm, gmUsername: hasGm ? 'mestra' : null, myStatus }}
      />
    </UserProvider>,
  );
}

describe('JoinPartyCard', () => {
  beforeEach(() => vi.clearAllMocks());

  // The party list (sidebar, /parties) must not keep showing the invite or miss the request
  it('aceitar o convite recarrega a lista de mesas e abre a mesa', async () => {
    vi.mocked(rpgWorldApi.patch).mockResolvedValue(undefined);
    const { queryClient } = renderCard('invited');
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await userEvent.setup().click(screen.getByRole('button', { name: t.accept }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/parties/p1'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PARTIES_QUERY_KEY });
  });

  it('pedir para entrar recarrega a lista de mesas', async () => {
    vi.mocked(rpgWorldApi.post).mockResolvedValue({ status: 'requested' });
    const { queryClient } = renderCard(null);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await userEvent.setup().click(screen.getByRole('button', { name: t.join.request }));

    expect(await screen.findByText(t.join.requested)).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PARTIES_QUERY_KEY });
  });

  it('mesa sem mestre avisa e não oferece entrar nem aceitar', () => {
    const { unmount } = renderCard(null, false);

    expect(screen.getByText(t.join.withoutGm)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.join.request })).not.toBeInTheDocument();
    expect(screen.queryByText(/is the GM of this table/)).not.toBeInTheDocument();
    unmount();

    renderCard('invited', false);
    expect(screen.getByText(t.join.withoutGm)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.accept })).not.toBeInTheDocument();
  });

  // Whoever asked isn't a member yet, so the party's private channel won't let them listen
  describe('pedido pendente', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    const poll = () => act(() => vi.advanceTimersByTimeAsync(INVITE_POLL_MS));

    it('começa pelo que o servidor mandou e pergunta de novo a cada 20 s', async () => {
      vi.mocked(rpgWorldApi.get).mockResolvedValue({ ...invite, myStatus: 'requested' });
      renderCard('requested');

      expect(screen.getByText(t.join.requested)).toBeInTheDocument();
      expect(rpgWorldApi.get).not.toHaveBeenCalled();

      await poll();
      expect(rpgWorldApi.get).toHaveBeenCalledWith(`/api/parties/join/${'a'.repeat(32)}`);
      await poll();
      expect(rpgWorldApi.get).toHaveBeenCalledTimes(2);
    });

    it('aprovado enquanto a página está aberta: avisa e abre a mesa', async () => {
      vi.mocked(rpgWorldApi.get).mockResolvedValue({ ...invite, myStatus: 'active' });
      const { queryClient } = renderCard('requested');
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

      await poll();

      await waitFor(() => expect(push).toHaveBeenCalledWith('/parties/p1'));
      expect(toastSuccess).toHaveBeenCalledWith(t.join.approved, expect.anything());
      expect(invalidate).toHaveBeenCalledWith({ queryKey: PARTIES_QUERY_KEY });
    });

    it('recusado enquanto a página está aberta: diz que foi recusado e para de perguntar', async () => {
      vi.mocked(rpgWorldApi.get).mockResolvedValue({ ...invite, myStatus: 'declined' });
      renderCard('requested');

      await poll();

      expect(await screen.findByText(t.join.declined)).toBeInTheDocument();
      expect(screen.queryByText(t.join.requested)).not.toBeInTheDocument();
      await poll();
      expect(rpgWorldApi.get).toHaveBeenCalledTimes(1);
      expect(push).not.toHaveBeenCalled();
    });

    it('pedir para entrar começa a perguntar', async () => {
      vi.mocked(rpgWorldApi.post).mockResolvedValue({ status: 'requested' });
      vi.mocked(rpgWorldApi.get).mockResolvedValue({ ...invite, myStatus: 'requested' });
      renderCard(null);

      await userEvent
        .setup({ advanceTimers: vi.advanceTimersByTime })
        .click(screen.getByRole('button', { name: t.join.request }));
      expect(await screen.findByText(t.join.requested)).toBeInTheDocument();
      expect(rpgWorldApi.get).not.toHaveBeenCalled();

      await poll();
      expect(rpgWorldApi.get).toHaveBeenCalledWith(`/api/parties/join/${'a'.repeat(32)}`);
    });

    // The GM changed the link (the pending request went with it) or deleted the party
    it('o convite deixou de existir: mostra convite inválido e para de perguntar', async () => {
      vi.mocked(rpgWorldApi.get).mockRejectedValue(new APIError('Not found', 404));
      renderCard('requested');

      await poll();

      expect(await screen.findByText(t.join.invalidTitle)).toBeInTheDocument();
      expect(screen.queryByText(t.join.requested)).not.toBeInTheDocument();
      await poll();
      expect(rpgWorldApi.get).toHaveBeenCalledTimes(1);
    });

    it('a mesa ficar sem mestre enquanto o pedido espera aparece na página', async () => {
      vi.mocked(rpgWorldApi.get).mockResolvedValue({
        ...invite,
        hasGm: false,
        gmUsername: null,
        myStatus: 'requested',
      });
      renderCard('requested');

      await poll();

      expect(await screen.findByText(t.join.withoutGm)).toBeInTheDocument();
      expect(screen.queryByText(/mestra/)).not.toBeInTheDocument();
    });

    it('sem pedido pendente, não pergunta', async () => {
      renderCard(null);

      await poll();

      expect(rpgWorldApi.get).not.toHaveBeenCalled();
    });
  });

  it('um pedido recusado aparece ao abrir o convite, e dá para pedir de novo', async () => {
    vi.mocked(rpgWorldApi.post).mockResolvedValue({ status: 'requested' });
    renderCard('declined');

    expect(screen.getByRole('status')).toHaveTextContent(t.join.declined);
    expect(screen.queryByRole('button', { name: t.join.request })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: t.join.requestAgain }));

    expect(await screen.findByText(t.join.requested)).toBeInTheDocument();
    expect(screen.queryByText(t.join.declined)).not.toBeInTheDocument();
  });

  it('mesa sem mestre não mostra a recusa antiga nem oferece pedir de novo', () => {
    renderCard('declined', false);

    expect(screen.getByText(t.join.withoutGm)).toBeInTheDocument();
    expect(screen.queryByText(t.join.declined)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.join.requestAgain })).not.toBeInTheDocument();
  });
});
