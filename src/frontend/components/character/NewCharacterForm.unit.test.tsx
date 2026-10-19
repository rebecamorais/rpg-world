import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { APIError } from '@frontend/lib/api-client';

import type { User } from '@shared/types/user';

import NewCharacterForm from './NewCharacterForm';

const push = vi.fn();
let currentUser: User | null = { id: 'user-1' };

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@frontend/context/UserContext', () => ({ useCurrentUser: () => ({ currentUser }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { post: vi.fn() },
}));

const t = messages.characterCreation;
const post = vi.mocked(rpgWorldApi.post);

async function createCharacter(name: string) {
  const user = userEvent.setup();
  if (name) await user.type(screen.getByLabelText(t.nameLabel), name);
  await user.click(screen.getByRole('button', { name: t.submit }));
}

describe('NewCharacterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 'user-1' };
    post.mockResolvedValue({ id: 'char-1' });
  });

  it('pede login quando não há usuário', () => {
    currentUser = null;
    renderWithProviders(<NewCharacterForm />);

    expect(screen.getByText(t.requireLogin)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.submit })).not.toBeInTheDocument();
  });

  it('cria o personagem de D&D 5e com o nome sem espaços e abre a ficha', async () => {
    renderWithProviders(<NewCharacterForm />);

    await createCharacter('  Thor  ');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/system/DnD_5e/character/char-1'));
    expect(post).toHaveBeenCalledWith('/api/characters', {
      name: 'Thor',
      system: 'DnD_5e',
    });
    expect(toast.success).toHaveBeenCalledWith(t.success);
  });

  it('exige o nome', async () => {
    renderWithProviders(<NewCharacterForm />);

    await createCharacter('');

    expect(await screen.findByText(t.nameRequired)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('mostra o erro traduzido quando a API recusa', async () => {
    post.mockRejectedValue(new APIError('character_error_create_name_required', 400));
    renderWithProviders(<NewCharacterForm />);

    await createCharacter('Thor');

    const message = messages.common.errors.character_error_create_name_required;
    // Inline only: a toast too would say the same thing twice
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(toast.error).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
