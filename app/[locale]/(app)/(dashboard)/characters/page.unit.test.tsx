import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import NpcsPage from './npcs/page';
import CharactersPage from './page';

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: string) =>
    createTranslator({ locale: 'en', messages, namespace: namespace as never }),
}));
vi.mock('@api', () => ({
  getApi: async () => ({ authApi: { getSessionUser: async () => null } }),
}));
// The list has its own tests; here, only the page's frame
vi.mock('@frontend/components/character/CharacterList', () => ({ default: () => null }));

describe('páginas de personagens', () => {
  it('/characters tem "Novo personagem" no cabeçalho, como os NPCs', async () => {
    renderWithProviders(await CharactersPage());

    expect(
      screen.getByRole('heading', { level: 1, name: messages.characters.title }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: messages.dashboard.newCharacter })).toHaveAttribute(
      'href',
      '/characters/new',
    );
  });

  it('/characters/npcs tem o próprio h1, não "Personagens" de novo', async () => {
    renderWithProviders(await NpcsPage());

    expect(
      screen.getByRole('heading', { level: 1, name: messages.characters.kinds.npc }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 1, name: messages.characters.title }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.enemies.new })).toHaveAttribute(
      'href',
      '/characters/new?kind=npc',
    );
  });
});
