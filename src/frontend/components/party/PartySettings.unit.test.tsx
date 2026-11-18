import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError } from '@client';

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
const channel = vi.hoisted(() => vi.fn(() => ({ live: true })));
vi.mock('@frontend/hooks/usePartyChannel', () => ({ usePartyChannel: channel }));
// The danger zone asks whether the chest or a combat would be lost: nothing here
vi.mock('@frontend/hooks/useEncounter', () => ({ useEncounter: () => ({ encounter: null }) }));
vi.mock('@frontend/hooks/useInventory', () => ({
  usePartyChest: () => ({ inventory: { containers: [], items: [] } }),
}));
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

  it('quem não está na mesa continua vendo mesa não encontrada, como título da página', () => {
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(screen.getByRole('heading', { level: 1, name: t.page.notFoundTitle })).toBeVisible();
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

const people = (...ids: string[]) =>
  ids.map((userId) => ({ userId, username: userId, avatarUrl: null, status: 'active' as const }));
const removeFrom = (name: string) => t.manage.removeFrom.replace('{name}', name);

describe('PartySettings: tempo real, Tirar e o link (fase 3)', () => {
  beforeEach(() => {
    hook.party = null;
    hook.removeMember.mutateAsync.mockReset();
    vi.mocked(toast).mockClear();
    channel.mockClear();
  });

  // d-fase2-tempo-real#1: outside PartyFrame, nothing listened, so Players never changed
  it('ouve o canal da mesa, como as abas', () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(channel).toHaveBeenCalledWith('party-1');
  });

  // d-fase2-tempo-real#1: the person had already left; the toast said "party not found"
  it('"Tirar" quem já saiu diz que a pessoa já não está na mesa, sem erro', async () => {
    hook.party = { ...party('gm'), people: people('ana') } as PartyView;
    hook.removeMember.mutateAsync.mockRejectedValue(new APIError('party_error_not_found', 404));
    const error = vi.spyOn(toast, 'error');
    renderWithProviders(<PartySettings partyId="party-1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: removeFrom('@ana') }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.manage.remove }),
    );

    await vi.waitFor(() =>
      expect(toast).toHaveBeenCalledWith(t.manage.alreadyGone.replace('{name}', '@ana')),
    );
    expect(error).not.toHaveBeenCalled();
  });

  // a-mesa-convite#7: the row went away and the focus fell to the page's start
  it('depois de tirar alguém, o foco vai para o próximo "Tirar"', async () => {
    hook.party = { ...party('gm'), people: people('ana', 'bia') } as PartyView;
    hook.removeMember.mutateAsync.mockImplementation(async () => {
      hook.party = { ...party('gm'), people: people('bia') } as PartyView;
    });
    const { rerender } = renderWithProviders(<PartySettings partyId="party-1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: removeFrom('@ana') }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.manage.remove }),
    );
    // The party reloads without her (useParty's refetch)
    await vi.waitFor(() => expect(hook.removeMember.mutateAsync).toHaveBeenCalled());
    rerender(<PartySettings partyId="party-1" />);

    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: removeFrom('@bia') })).toHaveFocus(),
    );
  });

  it('tirando o último jogador, o foco vai para o título Jogadores', async () => {
    hook.party = { ...party('gm'), people: people('ana') } as PartyView;
    hook.removeMember.mutateAsync.mockImplementation(async () => {
      hook.party = party('gm');
    });
    const { rerender } = renderWithProviders(<PartySettings partyId="party-1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: removeFrom('@ana') }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.manage.remove }),
    );
    await vi.waitFor(() => expect(hook.removeMember.mutateAsync).toHaveBeenCalled());
    rerender(<PartySettings partyId="party-1" />);

    await vi.waitFor(() =>
      expect(screen.getByRole('heading', { name: t.manage.members })).toHaveFocus(),
    );
  });

  // mesas 28: without clipboard permission nothing showed on screen
  it('copiar sem permissão avisa e deixa o link selecionado', async () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('NotAllowedError'));
    const select = vi.spyOn(HTMLInputElement.prototype, 'select');
    const error = vi.spyOn(toast, 'error');

    await user.click(screen.getByRole('button', { name: t.manage.copy }));

    await vi.waitFor(() => expect(error).toHaveBeenCalledWith(t.manage.copyFailed));
    expect(select.mock.contexts[0]).toBe(screen.getByLabelText(t.manage.link));
    select.mockRestore();
  });

  // a-mesa-convite#5: "Change link" and "Remove" picture fell on "Are you sure?"
  it('trocar o link e remover a imagem perguntam com título próprio', async () => {
    hook.party = { ...party('gm'), imageUrl: 'https://example.com/a.png' } as PartyView;
    renderWithProviders(<PartySettings partyId="party-1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: t.manage.rotate }));
    expect(screen.getByRole('alertdialog', { name: t.manage.rotateTitle })).toBeVisible();
    await user.click(screen.getByRole('button', { name: messages.common.cancel }));

    await user.click(screen.getByRole('button', { name: t.image.remove }));
    expect(screen.getByRole('alertdialog', { name: t.image.removeTitle })).toHaveTextContent(
      t.image.removeConfirm,
    );
  });

  // a-mesa-convite#11: invite and journal were primary, rename outline
  it('os três formulários têm o mesmo peso', () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);

    const invite = screen.getByRole('button', { name: t.manage.inviteSubmit });
    const rename = screen.getByRole('button', { name: t.manage.rename });
    const journal = screen.getByRole('button', { name: t.journal.save });
    expect(invite.className).toBe(rename.className);
    expect(journal.className).toBe(rename.className);
  });

  // mesas 30: "Manage", "Party settings" and "Manage the party" for one screen
  it('o card se chama Convites e jogadores', () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(screen.getByRole('heading', { level: 2, name: t.manage.title })).toBeVisible();
    expect(t.manage.title).toBe('Invites and players');
    expect(t.settings.manage).toBe('Settings');
  });

  // a-mesa-convite#9: the hint's button was inside the h2, in its name
  it('o título do card com dica tem só o nome, e a dica fica ao lado', () => {
    hook.party = party('gm');
    renderWithProviders(<PartySettings partyId="party-1" />);

    expect(screen.getByRole('heading', { level: 2, name: t.image.title })).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: messages.common.whatIs.replace('{label}', t.image.title),
      }),
    ).toBeVisible();
  });
});
