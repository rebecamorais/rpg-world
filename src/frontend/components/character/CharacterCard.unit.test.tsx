import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import type { CharacterSummary } from '@shared/types/character';

import { CharacterCard, CharacterCardSkeleton } from './CharacterCard';

const push = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const context = vi.hoisted(() => ({ kind: 'pc' as 'pc' | 'npc' }));
vi.mock('@frontend/context/CharactersContext', () => ({
  useCharactersContext: () => ({ kind: context.kind, setCharacterToDelete: vi.fn() }),
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
    context.kind = 'pc';
  });

  it('sem classe, o personagem é "Aventureiro" e o NPC não mostra classe nenhuma', () => {
    const { unmount } = renderWithProviders(<CharacterCard character={goblin} />);
    expect(screen.getByText(t.defaultClass)).toBeVisible();
    unmount();

    context.kind = 'npc';
    renderWithProviders(<CharacterCard character={goblin} />);
    expect(screen.queryByText(t.defaultClass)).not.toBeInTheDocument();
  });

  it('o nome longo quebra em até duas linhas e guarda o nome inteiro no title', () => {
    const name = 'Revisão F2 C NPC 1 com um nome bem comprido';
    renderWithProviders(<CharacterCard character={{ ...goblin, name }} />);

    const heading = screen.getByRole('heading', { name });
    expect(heading).toHaveAttribute('title', name);
    expect(heading).toHaveClass('line-clamp-2', 'break-normal');
    expect(heading).not.toHaveClass('truncate');
  });

  it('o selo de nível fica na linha da classe, não ao lado do nome', () => {
    renderWithProviders(<CharacterCard character={{ ...goblin, level: 7 }} />);

    const level = screen.getByText(t.levelShort.replace('{level}', '7'));
    expect(level.parentElement).toContainElement(screen.getByText(t.defaultClass));
    expect(level.parentElement).not.toContainElement(screen.getByRole('heading'));
  });

  it('o esqueleto tem o lugar do retrato, como o card', () => {
    const { container } = renderWithProviders(<CharacterCardSkeleton />);

    expect(container.querySelector('.h-16.w-16')).toBeInTheDocument();
  });

  it('mostra o nome traduzido do sistema, não o id interno', () => {
    renderWithProviders(<CharacterCard character={goblin} />);

    expect(screen.getByText(messages.characterCreation.systems.dnd5e)).toBeVisible();
    expect(screen.queryByText('DnD 5e')).not.toBeInTheDocument();
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

  describe('ampliar a imagem', () => {
    const view = { name: messages.avatarUpload.viewOf.replace('{name}', 'Goblin') };
    const withImage = { ...goblin, avatarUrl: 'https://img.test/g.webp' };

    it('abre o modal com a imagem, sem estar dentro do link da ficha', async () => {
      renderWithProviders(<CharacterCard character={withImage} />);
      const button = screen.getByRole('button', view);

      expect(button.closest('a')).toBeNull();
      await userEvent.click(button);

      expect(screen.getByRole('img', { name: 'Goblin' })).toHaveAttribute(
        'src',
        withImage.avatarUrl,
      );
    });

    it('sem imagem não mostra o botão', () => {
      renderWithProviders(<CharacterCard character={goblin} />);

      expect(screen.queryByRole('button', view)).not.toBeInTheDocument();
    });
  });

  it('o botão de ampliar tem área de toque de 44px', () => {
    renderWithProviders(
      <CharacterCard character={{ ...goblin, avatarUrl: 'https://img.test/g.webp' }} />,
    );

    expect(
      screen.getByRole('button', { name: messages.avatarUpload.viewOf.replace('{name}', 'Goblin') })
        .className,
    ).toContain('pointer-coarse:after:-inset-2');
  });
});
