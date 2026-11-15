import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { CharactersProvider } from '@frontend/context/CharactersContext';

import type { CharacterKind, CharacterSummary } from '@shared/types/character';

import CharacterList from './CharacterList';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@frontend/context/UserContext', () => ({
  useCurrentUser: () => ({ currentUser: { id: 'u1' } }),
}));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), delete: vi.fn() },
}));

const api = vi.mocked(rpgWorldApi);
const t = messages.characters;

const sheet = (id: string, name: string) =>
  ({ id, name, system: 'DnD_5e', level: 1 }) as CharacterSummary;

function renderList(list: CharacterSummary[], kind: CharacterKind = 'pc') {
  let current = list;
  api.get.mockImplementation(async () => current);
  api.delete.mockImplementation(async (url: string) => {
    current = current.filter((c) => !url.endsWith(c.id));
  });
  return renderWithProviders(
    <main>
      <h1>{t.title}</h1>
      <CharactersProvider kind={kind}>
        <CharacterList />
      </CharactersProvider>
    </main>,
  );
}

/** Deletes `name` the way the keyboard does: "…", Delete, type the name, Enter. */
async function deleteByKeyboard(name: string) {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: t.cardActions.replace('{name}', name) }),
  );
  await user.click(await screen.findByRole('menuitem', { name: messages.common.delete }));
  await user.keyboard(`${name}{Enter}`);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

describe('CharacterList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('as colunas seguem a largura da lista, não a da tela', async () => {
    renderList([sheet('a', 'Ada')]);

    const card = await screen.findByRole('heading', { name: 'Ada' });
    const grid = card.closest('[data-character-id]')!.parentElement!;
    expect(grid).toHaveClass('@2xl:grid-cols-2');
    expect(grid.className).not.toMatch(/(^|\s)md:grid-cols-2/);
    expect(grid.parentElement).toHaveClass('@container');
  });

  it('depois de excluir, o foco vai para o card seguinte, não para o <body>', async () => {
    renderList([sheet('a', 'Ada'), sheet('b', 'Katherine'), sheet('c', 'Maren')]);

    await deleteByKeyboard('Katherine');

    await waitFor(() => expect(screen.getByRole('link', { name: 'Maren' })).toHaveFocus());
    expect(screen.queryByRole('heading', { name: 'Katherine' })).not.toBeInTheDocument();
  });

  it('o último da lista passa o foco para o anterior', async () => {
    renderList([sheet('a', 'Ada'), sheet('b', 'Katherine')]);

    await deleteByKeyboard('Katherine');

    await waitFor(() => expect(screen.getByRole('link', { name: 'Ada' })).toHaveFocus());
  });

  it('com a lista vazia, o foco vai para o título da página', async () => {
    renderList([sheet('a', 'Ada')]);

    await deleteByKeyboard('Ada');

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
    expect(screen.getByText(t.emptyState)).toBeInTheDocument();
  });

  it('cancelar devolve o foco ao "…" do card, como antes', async () => {
    const user = userEvent.setup();
    renderList([sheet('a', 'Ada'), sheet('b', 'Katherine')]);
    const actions = await screen.findByRole('button', {
      name: t.cardActions.replace('{name}', 'Ada'),
    });

    await user.click(actions);
    await user.click(await screen.findByRole('menuitem', { name: messages.common.delete }));
    await user.keyboard('{Escape}');

    await waitFor(() => expect(actions).toHaveFocus());
  });

  it('excluir um NPC fala de NPC no diálogo e no aviso', async () => {
    const user = userEvent.setup();
    renderList([sheet('n', 'Goblin')], 'npc');

    await user.click(
      await screen.findByRole('button', { name: t.cardActions.replace('{name}', 'Goblin') }),
    );
    await user.click(await screen.findByRole('menuitem', { name: messages.common.delete }));
    expect(
      screen.getByRole('dialog', { name: messages.enemies.deleteDialogTitle }),
    ).toBeInTheDocument();
    await user.keyboard('Goblin{Enter}');

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(messages.enemies.deleteSuccess));
  });

  it('o diálogo não fecha no meio da exclusão, e o foco ainda vai para o card seguinte', async () => {
    const user = userEvent.setup();
    renderList([sheet('a', 'Ada'), sheet('b', 'Katherine'), sheet('c', 'Maren')]);
    // The delete waits until `finish()`, then goes on as usual
    const remove = api.delete.getMockImplementation()!;
    let finish = () => {};
    api.delete.mockImplementationOnce(
      (url: string) =>
        new Promise((resolve) => {
          finish = () => resolve(remove(url));
        }),
    );

    await user.click(
      await screen.findByRole('button', { name: t.cardActions.replace('{name}', 'Katherine') }),
    );
    await user.click(await screen.findByRole('menuitem', { name: messages.common.delete }));
    await user.keyboard('Katherine{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: messages.common.cancel })).toBeDisabled(),
    );
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    finish();

    await waitFor(() => expect(screen.getByRole('link', { name: 'Maren' })).toHaveFocus());
  });
});
