import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartySettings } from './PartySettings';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>();
  return { ...actual, toast: Object.assign(vi.fn(), actual.toast) };
});

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
    router.replace.mockClear();
    vi.mocked(toast).mockClear();
  });

  it('o mestre vê convite, link, jogadores, nome e apagar', () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(screen.getByRole('heading', { level: 1, name: 'A Torre de Vidro' })).toBeVisible();
    expect(screen.getByText(t.settings.eyebrow)).toBeVisible();
    expect(screen.getByLabelText(t.manage.inviteLabel)).toBeVisible();
    expect(screen.getByRole('button', { name: t.manage.deleteParty })).toBeVisible();
  });

  it('o jogador da mesa vai para a mesa, com o aviso de que só o mestre gerencia', () => {
    hook.party = party('player');
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(router.replace).toHaveBeenCalledWith('/parties/party-1');
    expect(toast).toHaveBeenCalledWith(t.settings.gmOnly, expect.anything());
    // Not "not found": the party exists and they are in it
    expect(screen.queryByText(t.page.notFoundTitle)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(t.manage.inviteLabel)).not.toBeInTheDocument();
  });

  it('quem não está na mesa continua vendo mesa não encontrada', () => {
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(screen.getByText(t.page.notFoundTitle)).toBeVisible();
    expect(router.replace).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it('"Tirar" diz quem sai; só aquela linha espera, e o aviso diz quem saiu', async () => {
    const people = ['ana', 'bia'].map((userId) => ({
      userId,
      username: userId,
      avatarUrl: null,
      status: 'active' as const,
    }));
    hook.party = { ...party('gm'), people } as PartyView;
    let finish = () => {};
    hook.removeMember.mutateAsync.mockImplementation(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const success = vi.spyOn(toast, 'success');
    renderWithProviders(<PartySettings partyId="party-1" />);
    const user = userEvent.setup();
    const removeFrom = (name: string) => t.manage.removeFrom.replace('{name}', name);

    await user.click(screen.getByRole('button', { name: removeFrom('@ana') }));
    const dialog = screen.getByRole('alertdialog', {
      name: t.manage.removeTitle.replace('{name}', '@ana'),
    });
    await user.click(within(dialog).getByRole('button', { name: t.manage.remove }));

    expect(hook.removeMember.mutateAsync).toHaveBeenCalledWith('ana');
    expect(screen.getByRole('button', { name: removeFrom('@ana') })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('button', { name: removeFrom('@bia') })).toBeEnabled();
    finish();
    await vi.waitFor(() =>
      expect(success).toHaveBeenCalledWith(t.manage.removed.replace('{name}', '@ana')),
    );
  });

  it('aberta em #journal, rola até o card do diário', () => {
    hook.party = party('gm');
    // jsdom has no scrollIntoView: the stub goes away after this test
    const original = Element.prototype.scrollIntoView;
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    window.location.hash = '#journal';
    try {
      renderWithProviders(<PartySettings partyId="party-1" />);

      expect(scroll).toHaveBeenCalled();
      expect(scroll.mock.contexts[0]).toBe(document.getElementById('journal'));
    } finally {
      window.location.hash = '';
      Element.prototype.scrollIntoView = original;
    }
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
