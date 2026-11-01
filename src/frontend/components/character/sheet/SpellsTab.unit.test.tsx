import { screen, waitFor } from '@testing-library/react';
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
