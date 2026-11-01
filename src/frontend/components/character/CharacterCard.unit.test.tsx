import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import type { CharacterSummary } from '@shared/types/character';

import { CharacterCard } from './CharacterCard';

const push = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@frontend/context/CharactersContext', () => ({
  useCharactersContext: () => ({ setCharacterToDelete: vi.fn() }),
}));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { post: vi.fn() },
}));

const t = messages.characters;
const post = vi.mocked(rpgWorldApi.post);
const goblin = { id: 'npc-1', name: 'Goblin', system: 'DnD_5e', level: 1 } as CharacterSummary;

describe('CharacterCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({ id: 'copy-1' });
  });

  it('Duplicar cria a cópia com o nome "(cópia)" e abre a ficha nova', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CharacterCard character={goblin} />);

    await user.click(
      screen.getByRole('button', { name: t.cardActions.replace('{name}', 'Goblin') }),
    );
    await user.click(await screen.findByRole('menuitem', { name: t.duplicate }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/system/DnD_5e/character/copy-1'));
    expect(post).toHaveBeenCalledWith('/api/characters/npc-1/duplicate', {
      name: t.copyName.replace('{name}', 'Goblin'),
    });
    expect(toast.success).toHaveBeenCalledWith(t.duplicateSuccess);
  });
});
