import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { SpellsTab } from './SpellsTab';

vi.mock('@client', () => ({ rpgWorldApi: { get: vi.fn(), post: vi.fn() } }));
// The condition catalog is its own request; these tests only look at the spell ones
vi.mock('@frontend/hooks/useItems', () => ({
  useItems: () => ({ list: [], byKey: new Map(), isLoading: false }),
}));

vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({ list: [], byKey: new Map(), isLoading: false }),
}));

const api = vi.mocked(rpgWorldApi);

const learned = (id: string) => ({
  id: `dnd5e:srd-5.1:spell:${id}`,
  edition: '2014',
  name: id,
  level: 1,
  school: 'evocation',
  castingTime: 'action',
  isPrepared: false,
});

describe('SpellsTab', () => {
  // The dialog is mounted before the spellbook arrives; it must still start on its edition
  it('a lista abre na edição do grimório carregado', async () => {
    api.get.mockImplementation(async (url: string) =>
      url.startsWith('/api/characters/')
        ? [learned('shield'), learned('light')]
        : { data: [], total: 0 },
    );
    const user = userEvent.setup();
    const character = { ...createDnD5eCharacter('owner', 'Elminster'), id: 'c1' } as DnD5eCharacter;
    renderWithCharacter(<SpellsTab />, character);

    await screen.findByText('shield');
    await user.click(screen.getAllByRole('button', { name: messages.characters.spells.addBtn })[0]);

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: messages.spellsDrawer.filterLabels.edition }),
      ).toHaveTextContent('2014'),
    );
  });
});

describe('SpellsTab: foco depois de esquecer', () => {
  const tc = messages.characters;
  const tConfirm = messages.spellsDrawer.forgetConfirm;

  async function openForget(user: ReturnType<typeof userEvent.setup>, name: string) {
    await user.click(screen.getByRole('button', { name: `${tc.expand} ${name}` }));
    const card = screen.getByRole('article', { name: new RegExp(name) });
    await user.click(within(card).getByRole('button', { name: tc.forgetSpell }));
  }

  function renderTab(spells: ReturnType<typeof learned>[]) {
    api.get.mockImplementation(async (url: string) =>
      url.startsWith('/api/characters/') ? spells : { data: [], total: 0 },
    );
    api.post.mockResolvedValue({ spell: null });
    const character = { ...createDnD5eCharacter('owner', 'Elminster'), id: 'c1' } as DnD5eCharacter;
    renderWithCharacter(<SpellsTab />, character);
  }

  // The card and its forget button unmount; focus would fall to the page's top
  it('vai para o próximo card do mesmo nível', async () => {
    renderTab([learned('light'), learned('shield')]);
    const user = userEvent.setup();
    await screen.findByText('light');

    await openForget(user, 'light');
    await user.click(await screen.findByRole('button', { name: tConfirm.confirm }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: `${tc.expand} shield` })).toHaveFocus(),
    );
  });

  it('vai para o título de outro nível quando o nível fica vazio', async () => {
    renderTab([{ ...learned('light'), level: 0 }, learned('shield')]);
    const user = userEvent.setup();
    await screen.findByText('shield');

    await openForget(user, 'shield');
    await user.click(await screen.findByRole('button', { name: tConfirm.confirm }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: tc.cantrips, level: 2 })).toHaveFocus(),
    );
  });

  it('cancelar não manda nada e o card fica', async () => {
    vi.mocked(api.post).mockClear();
    renderTab([learned('light'), learned('shield')]);
    const user = userEvent.setup();
    await screen.findByText('light');

    await openForget(user, 'light');
    await user.click(await screen.findByRole('button', { name: messages.common.cancel }));

    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByText('light')).toBeVisible();
  });
  // A failed forget leaves the card; the next change to the list must not move the focus to
  // where it would have gone
  it('falha ao esquecer não rouba o foco depois', async () => {
    vi.mocked(api.post).mockClear();
    renderTab([learned('light'), learned('shield')]);
    const user = userEvent.setup();
    await screen.findByText('light');
    api.post.mockRejectedValueOnce(new Error('offline'));

    await openForget(user, 'light');
    await user.click(await screen.findByRole('button', { name: tConfirm.confirm }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(screen.getByText('light')).toBeVisible();

    // Preparing another spell changes the list; the stale target was the shield's toggle
    api.post.mockResolvedValueOnce({ spell: { ...learned('shield'), isPrepared: true } });
    const shield = screen.getByRole('article', { name: /shield/ });
    const prepare = within(shield).getByRole('button', { name: tc.prepareSpell });
    await user.click(prepare);

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(within(shield).getByRole('button', { name: tc.unprepareSpell })).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: `${tc.expand} shield` })).not.toHaveFocus();
  });
});

describe('SpellsTab: foco ao fechar a busca', () => {
  const tc = messages.characters;

  // The empty state's "Add spell" opened the search; learning a spell takes the empty state (and
  // that button) away while the dialog is open, so closing it had nowhere to give the focus back
  it('grimório vazio: aprender e fechar leva o foco ao "Add spell" do cabeçalho', async () => {
    const spell = learned('shield');
    api.get.mockImplementation(async (url: string) =>
      url.startsWith('/api/characters/') ? [] : { data: [spell], total: 1 },
    );
    api.post.mockResolvedValue({ spell });
    const user = userEvent.setup();
    const character = { ...createDnD5eCharacter('owner', 'Elminster'), id: 'c1' } as DnD5eCharacter;
    renderWithCharacter(<SpellsTab />, character);

    await screen.findByText(messages.spellsDrawer.emptyState);
    // Empty, only the empty state has "Add spell"; the header's comes with the first spell
    const [empty] = screen.getAllByRole('button', { name: tc.spells.addBtn });
    await user.click(empty);
    const dialog = await screen.findByRole('dialog');
    await user.click(await within(dialog).findByRole('button', { name: tc.learnSpell }));
    await waitFor(() =>
      expect(screen.queryByText(messages.spellsDrawer.emptyState)).not.toBeInTheDocument(),
    );

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: tc.spells.addBtn })).toHaveFocus(),
    );
  });

  // The search closed before the learn POST came back: the focus went back to the empty state's
  // button, which then goes away with the empty state
  it('grimório vazio: fechar antes de o aprender voltar leva o foco ao "Add spell" do cabeçalho', async () => {
    const spell = learned('shield');
    let answer: (value: unknown) => void = () => {};
    api.get.mockImplementation(async (url: string) =>
      url.startsWith('/api/characters/') ? [] : { data: [spell], total: 1 },
    );
    api.post.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
    const user = userEvent.setup();
    const character = { ...createDnD5eCharacter('owner', 'Elminster'), id: 'c1' } as DnD5eCharacter;
    renderWithCharacter(<SpellsTab />, character);

    await screen.findByText(messages.spellsDrawer.emptyState);
    const [empty] = screen.getAllByRole('button', { name: tc.spells.addBtn });
    await user.click(empty);
    const dialog = await screen.findByRole('dialog');
    await user.click(await within(dialog).findByRole('button', { name: tc.learnSpell }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(empty).toHaveFocus());
    answer({ spell });

    await waitFor(() =>
      expect(screen.queryByText(messages.spellsDrawer.emptyState)).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: tc.spells.addBtn })).toHaveFocus(),
    );
  });

  // Shown while loading, it unmounted once an empty spellbook arrived, taking the focus to body
  it('carregando, o cabeçalho ainda não oferece "Add spell"', async () => {
    let resolveSpells: (spells: unknown[]) => void = () => {};
    api.get.mockImplementation((url: string) =>
      url.startsWith('/api/characters/')
        ? new Promise((resolve) => (resolveSpells = resolve))
        : Promise.resolve({ data: [], total: 0 }),
    );
    const character = { ...createDnD5eCharacter('owner', 'Elminster'), id: 'c1' } as DnD5eCharacter;
    renderWithCharacter(<SpellsTab />, character);

    await screen.findByText(messages.spellsDrawer.loading);
    expect(screen.queryByRole('button', { name: tc.spells.addBtn })).not.toBeInTheDocument();

    resolveSpells([learned('shield')]);
    await screen.findByText('shield');
    expect(screen.getByRole('button', { name: tc.spells.addBtn })).toBeInTheDocument();
  });

  // Two "Add spell" in two styles, and "0 prepared", on an empty spellbook
  it('grimório vazio: só o "Add spell" do estado vazio, sem "0 preparadas" no cabeçalho', async () => {
    api.get.mockImplementation(async (url: string) =>
      url.startsWith('/api/characters/') ? [] : { data: [], total: 0 },
    );
    const character = { ...createDnD5eCharacter('owner', 'Elminster'), id: 'c1' } as DnD5eCharacter;
    renderWithCharacter(<SpellsTab />, character);

    await screen.findByText(messages.spellsDrawer.emptyState);
    expect(screen.getAllByRole('button', { name: tc.spells.addBtn })).toHaveLength(1);
    expect(screen.queryByText(/0 prepared/i)).not.toBeInTheDocument();
  });
});
