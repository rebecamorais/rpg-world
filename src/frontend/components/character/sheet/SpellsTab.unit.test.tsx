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
