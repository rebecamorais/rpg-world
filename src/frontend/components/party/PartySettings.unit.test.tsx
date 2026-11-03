import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  setEdition: mutation(),
  setJournal: mutation(),
  removeImage: mutation(),
  remove: mutation(),
};
vi.mock('@frontend/hooks/useParty', () => ({ useParty: () => hook }));
vi.mock('@frontend/context/FileUploaderContext', () => ({
  useFileUploader: () => ({ upload: vi.fn(), isUploading: false }),
}));

const t = messages.parties;
const party = (role: PartyView['role']) =>
  ({
    id: 'party-1',
    name: 'A Torre de Vidro',
    role,
    people: [],
    roster: [],
    myCharacterIds: [],
    journalDocId: null,
    imageUrl: null,
    edition: '2024',
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

  it('o campo de edição tem rótulo e a dica como descrição', () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(screen.getByLabelText(t.manage.editionLabel)).toHaveAccessibleDescription(
      t.manage.editionHint,
    );
  });

  it('trocar a edição da mesa salva só a edição', async () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);

    await userEvent.click(screen.getByRole('combobox', { name: t.manage.editionLabel }));
    await userEvent.click(screen.getByRole('option', { name: t.manage.edition2014 }));

    expect(hook.setEdition.mutate).toHaveBeenCalledWith('2014', expect.anything());
  });
});
