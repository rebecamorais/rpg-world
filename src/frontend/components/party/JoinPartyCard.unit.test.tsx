import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { UserProvider } from '@frontend/context/UserContext';
import { PARTIES_QUERY_KEY } from '@frontend/lib/query-keys';

import { JoinPartyCard } from './JoinPartyCard';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { post: vi.fn(), patch: vi.fn() },
}));

const t = messages.parties;
const invite = { partyId: 'p1', name: 'Mesa', gmUsername: 'mestra', myStatus: null };

function renderCard(myStatus: 'invited' | null) {
  return renderWithProviders(
    <UserProvider user={{ id: 'u1', email: 'u@example.com' }}>
      <JoinPartyCard code={'a'.repeat(32)} invite={{ ...invite, myStatus }} />
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
});
