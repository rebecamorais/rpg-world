import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { UserProvider } from '@frontend/context/UserContext';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartyFrame } from './PartyFrame';
import { PartyCombatTab, PartyPage, PartyTableTab } from './PartyPage';

const demo = vi.hoisted(() => ({ isDemo: false, search: '' }));
vi.mock('@frontend/demo/DemoContext', () => ({ useDemo: () => demo }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/parties/p1',
  useSearchParams: () => new URLSearchParams(demo.search),
}));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@frontend/hooks/usePartyChannel', () => ({ usePartyChannel: () => ({ live: true }) }));
const mine = vi.hoisted(() => ({
  characters: [] as { id: string; name: string; level: number; class: string }[],
}));
vi.mock('@frontend/hooks/useCharacters', () => ({ useCharacters: () => mine }));
vi.mock('@frontend/components/combat/PlayerCombatPanel', () => ({
  PlayerCombatPanel: () => <p>combat panel</p>,
}));

const t = messages.parties;
const named = (text: string, name: string) => text.replace('{name}', name);
const person = (userId: string, status: PartyView['people'][number]['status'] = 'active') => ({
  userId,
  username: userId,
  avatarUrl: null,
  status,
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

const encounter = vi.hoisted(() => ({ view: null as unknown }));

/** The party at a tab: the frame (name, menu, tabs) around that tab's content. */
function renderPage(view: PartyView, tab: 'overview' | 'combat' | 'demo' = 'overview') {
  vi.mocked(rpgWorldApi.get).mockImplementation(async (url: string) => {
    if (url === '/api/parties') return { asGm: [], asPlayer: [], invites: [], requests: [] };
    if (url.endsWith('/encounter')) return encounter.view ?? {};
    return view;
  });
  const content =
    tab === 'demo' ? (
      <PartyPage partyId="p1" />
    ) : (
      <PartyFrame partyId="p1">
        {tab === 'combat' ? <PartyCombatTab partyId="p1" /> : <PartyTableTab partyId="p1" />}
      </PartyFrame>
    );
  return renderWithProviders(
    <UserProvider user={{ id: 'ana', email: 'a@example.com' }}>{content}</UserProvider>,
  );
}

/** Leaving is in the player's own menu, out of the way of play. */
async function leaveParty() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: t.mine.open }));
  await user.click(await screen.findByRole('button', { name: t.mine.leave }));
}

describe('PartyPage sem mestre', () => {
  beforeEach(() => {
    demo.isDemo = false;
    demo.search = '';
    encounter.view = null;
    vi.clearAllMocks();
    vi.mocked(rpgWorldApi.delete).mockResolvedValue(undefined);
  });

  it('mostra o pedido de mestre na mesa e no lugar do combate', async () => {
    renderPage(party());
    expect(await screen.findByRole('button', { name: t.gmClaim.claim })).toBeInTheDocument();
  });

  it('na aba Combate, sem mestre, mostra o pedido e não o combate', async () => {
    renderPage(party(), 'combat');

    expect(await screen.findByRole('button', { name: t.gmClaim.claim })).toBeInTheDocument();
    expect(screen.queryByText('combat panel')).not.toBeInTheDocument();
  });

  it('com mestre e um combate, a aba Combate mostra o combate e não o pedido', async () => {
    encounter.view = { role: 'player', round: 1, hiddenTurn: false, turns: [] };
    renderPage(party({ hasGm: true }), 'combat');

    expect(await screen.findByText('combat panel')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.gmClaim.claim })).not.toBeInTheDocument();
  });

  it('com mestre e sem combate, a aba Combate diz que não há combate', async () => {
    renderPage(party({ hasGm: true }), 'combat');
    expect(await screen.findByText(messages.combat.noCombatPlayer)).toBeInTheDocument();
  });

  it('o último jogador que sai é avisado de que a mesa será apagada', async () => {
    renderPage(party({ people: [person('ana')] }));

    await leaveParty();

    const dialog = screen.getByRole('alertdialog', { name: t.mine.leaveTitleLastPlayer });
    expect(dialog).toHaveTextContent(t.mine.leaveConfirmLastPlayer);
    await userEvent.click(within(dialog).getByRole('button', { name: messages.common.cancel }));
    expect(rpgWorldApi.delete).not.toHaveBeenCalled();
  });

  it('com outros jogadores ativos, o aviso é o de sempre', async () => {
    renderPage(party());

    await leaveParty();

    // Its own title, not "Are you sure?", and it says what happens to the characters
    const dialog = screen.getByRole('alertdialog', { name: t.mine.leaveTitle });
    expect(dialog).toHaveTextContent(t.mine.leaveConfirm);
    await userEvent.click(within(dialog).getByRole('button', { name: t.mine.leave }));
    await waitFor(() =>
      expect(rpgWorldApi.delete).toHaveBeenCalledWith('/api/parties/p1/members/ana'),
    );
  });
});

describe('Abas da mesa', () => {
  beforeEach(() => {
    demo.isDemo = false;
    encounter.view = null;
    vi.clearAllMocks();
  });

  it('o mestre vê as quatro abas, Gerenciar, e o aviso de combate em andamento na mesa', async () => {
    encounter.view = { role: 'gm', round: 2, rows: [] };
    renderPage(party({ role: 'gm', hasGm: true, gm: { inviteCode: 'X', rolePlay: [] } }));

    expect(await screen.findByRole('link', { name: t.settings.manage })).toHaveAttribute(
      'href',
      '/parties/p1/settings',
    );
    const [tabs] = screen.getAllByRole('navigation', { name: t.tabs.label });
    expect(tabs).toBeInTheDocument();
    for (const [tab, href] of [
      [t.tabs.overview, '/parties/p1'],
      [t.tabs.journal, '/parties/p1/journal'],
      [t.tabs.chest, '/parties/p1/inventory'],
    ]) {
      expect(screen.getAllByRole('link', { name: tab })[0]).toHaveAttribute('href', href);
    }
    // The combat tab carries the round, and the table leads to the combat going on
    expect(
      await screen.findAllByRole('link', { name: new RegExp(t.tabs.combat) }),
    ).not.toHaveLength(0);
    expect(
      await screen.findByRole('link', { name: new RegExp(t.page.goToCombat) }),
    ).toHaveAttribute('href', '/parties/p1/combat');
    // The current tab is marked
    expect(screen.getAllByRole('link', { name: t.tabs.overview })[0]).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('o jogador escolhe os personagens em "Minha participação", fora da tela de jogo', async () => {
    renderPage(party({ hasGm: true }));

    // The button carries the dialog's own name
    expect(t.mine.open).toBe(t.mine.title);
    expect(await screen.findByRole('button', { name: t.mine.open })).toBeInTheDocument();
    expect(screen.queryByText(t.mine.description)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: t.settings.manage })).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: t.mine.open }));
    expect(await screen.findByRole('dialog', { name: t.mine.title })).toBeInTheDocument();
  });
});

describe('Aba Mesa: vazios e respostas do mestre', () => {
  const gmParty = (people: PartyView['people']) =>
    party({ role: 'gm', hasGm: true, people, gm: { inviteCode: 'X', rolePlay: [] } });

  beforeEach(() => {
    demo.isDemo = false;
    encounter.view = null;
    vi.clearAllMocks();
  });

  it('a jogadora numa mesa vazia escolhe quem levar dali mesmo', async () => {
    renderPage(party({ hasGm: true }));

    expect(await screen.findByText(t.page.noCharactersPlayer)).toBeInTheDocument();
    expect(screen.getByText(t.page.noCharactersPlayerHint)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: t.page.chooseCharacters }));
    expect(await screen.findByRole('dialog', { name: t.mine.title })).toBeInTheDocument();
  });

  // d-fase2-tempo-real#4: saved, the dialog closes (the toast stays); the focus goes to the list
  it('salvar dali enche a mesa e fecha o diálogo; o foco vai à lista', async () => {
    mine.characters = [{ id: 'c1', name: 'Arani', level: 3, class: 'wizard' }];
    const arani = {
      characterId: 'c1',
      ownerId: 'ana',
      name: 'Arani',
      avatarUrl: null,
      race: 'elf',
      class: 'wizard',
      level: 3,
      accentColor: null,
    };
    try {
      renderPage(party({ hasGm: true }));
      // The save fills the table: the reload after it brings the roster back with Arani in it
      const filled = party({ hasGm: true, roster: [arani], myCharacterIds: ['c1'] });
      const before = vi.mocked(rpgWorldApi.get).getMockImplementation()!;
      vi.mocked(rpgWorldApi.put).mockImplementation(async () => {
        vi.mocked(rpgWorldApi.get).mockImplementation(async (url: string) =>
          url === '/api/parties/p1' ? filled : before(url),
        );
        return undefined;
      });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: t.page.chooseCharacters }));
      const dialog = await screen.findByRole('dialog', { name: t.mine.title });
      await user.click(within(dialog).getByRole('checkbox', { name: /Arani/ }));
      await user.click(within(dialog).getByRole('button', { name: t.mine.save }));

      const list = await screen.findByRole('region', { name: t.page.characters });
      expect(await within(list).findByText('Arani')).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: t.mine.title })).not.toBeInTheDocument(),
      );
      expect(screen.getByRole('heading', { name: t.page.characters })).toHaveFocus();
    } finally {
      mine.characters = [];
    }
  });

  it('o mestre sem jogadores é levado ao convite', async () => {
    renderPage(gmParty([]));

    expect(await screen.findByText(t.page.noCharactersGm)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.page.invitePlayers })).toHaveAttribute(
      'href',
      '/parties/p1/settings#invite',
    );
  });

  it('com jogadores ativos e sem personagens, o mestre lê que falta eles escolherem', async () => {
    renderPage(gmParty([person('ana')]));

    expect(await screen.findByText(t.page.noCharactersGmWaiting)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: t.page.invitePlayers })).not.toBeInTheDocument();
  });

  it('aprovar um pedido gira só aquele botão e avisa quem entrou', async () => {
    const success = vi.spyOn(toast, 'success');
    let finish = () => {};
    vi.mocked(rpgWorldApi.patch).mockImplementation(
      () => new Promise<undefined>((resolve) => (finish = () => resolve(undefined))),
    );
    renderPage(gmParty([person('ana', 'requested'), person('bia', 'requested')]));
    const user = userEvent.setup();

    const approveAna = await screen.findByRole('button', {
      name: named(t.requestsSection.approveFrom, '@ana'),
    });
    await user.click(approveAna);

    await waitFor(() => expect(approveAna).toHaveAttribute('aria-busy', 'true'));
    expect(
      screen.getByRole('button', { name: named(t.requestsSection.approveFrom, '@bia') }),
    ).toBeEnabled();
    finish();
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith(named(t.requestsSection.approved, '@ana')),
    );
  });

  it('recusar um pedido e cancelar um convite têm cada um o seu aviso', async () => {
    const success = vi.spyOn(toast, 'success');
    vi.mocked(rpgWorldApi.delete).mockResolvedValue(undefined);
    renderPage(gmParty([person('ana', 'requested'), person('caio', 'invited')]));
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole('button', { name: named(t.requestsSection.declineFrom, '@ana') }),
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: t.requestsSection.decline,
      }),
    );
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith(named(t.requestsSection.declined, '@ana')),
    );

    await user.click(
      screen.getByRole('button', { name: named(t.requestsSection.cancelFor, '@caio') }),
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: t.requestsSection.cancelInvite,
      }),
    );
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith(named(t.requestsSection.canceled, '@caio')),
    );
  });
});

describe('PartyPage na demo', () => {
  it('mostra os cards de Role Play, sem a aba Combate nem as configurações, mesmo com ?mode=combat', async () => {
    demo.isDemo = true;
    demo.search = 'mode=combat';
    const card = {
      characterId: 'ada',
      ownerId: 'o1',
      ownerUsername: 'pioneer_ada',
      name: 'Ada',
      avatarUrl: null,
      race: 'Human',
      class: 'Wizard',
      level: 3,
      accentColor: null,
      personalityTraits: null,
      ideals: null,
      bonds: null,
      flaws: null,
      passivePerception: 10,
      passiveInsight: 10,
    };
    renderPage(
      party({ role: 'gm', hasGm: true, gm: { inviteCode: 'X', rolePlay: [card] } }),
      'demo',
    );

    expect((await screen.findAllByText('Ada'))[0]).toBeInTheDocument();
    // The GM's view, said as a view: the visitor is not the party's GM
    expect(screen.getByText(messages.demo.gmEyebrow)).toBeInTheDocument();
    expect(screen.queryByText(t.page.gmEyebrow)).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: t.tabs.label })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: t.settings.manage })).not.toBeInTheDocument();
  });
});
