import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartySettings } from './PartySettings';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const mutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
const hook = {
  party: null as PartyView | null,
  isLoading: false,
  invite: mutation(),
  rotateCode: mutation(),
  removeMember: mutation(),
  rename: mutation(),
  remove: mutation(),
};
vi.mock('@frontend/hooks/useParty', () => ({ useParty: () => hook }));

const t = messages.parties;
const party = (role: PartyView['role']) =>
  ({
    id: 'party-1',
    name: 'A Torre de Vidro',
    role,
    people: [],
    roster: [],
    myCharacterIds: [],
    gm: role === 'gm' ? { inviteCode: 'a'.repeat(32), rolePlay: [] } : null,
  }) as unknown as PartyView;

describe('PartySettings', () => {
  beforeEach(() => {
    hook.party = null;
  });

  it('o mestre vê convite, link, jogadores, nome e apagar', () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(screen.getByRole('heading', { level: 1, name: 'A Torre de Vidro' })).toBeVisible();
    expect(screen.getByText(t.settings.eyebrow)).toBeVisible();
    expect(screen.getByLabelText(t.manage.inviteLabel)).toBeVisible();
    expect(screen.getByRole('button', { name: t.manage.deleteParty })).toBeVisible();
  });

  it('o jogador não tem configurações: mesa não encontrada', () => {
    hook.party = party('player');
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(screen.getByText(t.page.notFoundTitle)).toBeVisible();
    expect(screen.queryByLabelText(t.manage.inviteLabel)).not.toBeInTheDocument();
  });
});
