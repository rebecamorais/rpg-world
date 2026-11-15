import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderHookWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { useCharacterSpells, useIsSpellPending } from './useCharacterSpells';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', () => ({ rpgWorldApi: { get: vi.fn(), post: vi.fn() } }));

const api = vi.mocked(rpgWorldApi);
const t = messages.spellsDrawer.toasts;
const tConfirm = messages.spellsDrawer.forgetConfirm;

/** Forgets through the confirmation dialog, answering it with `answer`. */
async function forget(forgetSpell: (id: string) => Promise<void>, id: string, answer = true) {
  let done!: Promise<void>;
  act(() => {
    done = forgetSpell(id);
  });
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).toHaveTextContent(tConfirm.description.replace('{name}', 'Fly'));
  await userEvent.click(
    screen.getByRole('button', { name: answer ? tConfirm.confirm : messages.common.cancel }),
  );
  await act(() => done);
}

/** Clicks the action button of the last success toast. */
async function clickToastAction() {
  const options = vi.mocked(toast.success).mock.calls.at(-1)![1] as {
    action: { label: string; onClick: () => Promise<void> };
  };
  expect(options.action.label).toBe(t.undo);
  await options.action.onClick();
}

async function renderSpells(isPrepared: boolean) {
  api.get.mockResolvedValue([
    { id: 'fly', name: 'Fly', level: 3, school: 'evocation', isPrepared },
  ]);
  const hook = renderHookWithProviders(() => useCharacterSpells('c1'));
  await waitFor(() => expect(hook.result.current.spells).toHaveLength(1));
  return hook;
}

describe('useCharacterSpells', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({ spell: null });
  });

  it('aprender põe na lista a magia que o servidor devolveu, sem buscar a lista de novo', async () => {
    const { result } = await renderSpells(false);
    const shield = {
      id: 'shield',
      name: 'Escudo',
      level: 1,
      school: 'abjuration',
      isPrepared: false,
    };
    api.post.mockResolvedValueOnce({ spell: shield });

    await result.current.learnSpell('shield');

    await waitFor(() => expect(result.current.spells.map((s) => s.id)).toEqual(['fly', 'shield']));
    expect(api.post).toHaveBeenCalledWith('/api/characters/c1/spells?locale=en', {
      id: 'shield',
      action: 'learn',
    });
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('preparar e esquecer atualizam a lista sem buscá-la de novo', async () => {
    const { result } = await renderSpells(false);

    await result.current.togglePrepared('fly', true);
    await waitFor(() => expect(result.current.spells[0].isPrepared).toBe(true));

    await forget(result.current.forgetSpell, 'fly');
    await waitFor(() => expect(result.current.spells).toEqual([]));
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('esquecer oferece desfazer, que aprende e prepara de novo', async () => {
    const { result } = await renderSpells(true);

    await forget(result.current.forgetSpell, 'fly');
    expect(toast.success).toHaveBeenCalledWith(
      t.forgotten,
      // One toast per spell: forgetting it again replaces it
      expect.objectContaining({ id: 'spell-forgotten-fly' }),
    );

    await clickToastAction();
    expect(api.post.mock.calls.map(([, body]) => body)).toEqual([
      { id: 'fly', action: 'forget' },
      { id: 'fly', action: 'learn' },
      { id: 'fly', action: 'prepare' },
    ]);
    // Undo restores quietly: only the "forgotten" toast was shown
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('desfazer não prepara uma magia que não estava preparada', async () => {
    const { result } = await renderSpells(false);

    await forget(result.current.forgetSpell, 'fly');
    await clickToastAction();

    expect(api.post.mock.calls.map(([, body]) => body)).toEqual([
      { id: 'fly', action: 'forget' },
      { id: 'fly', action: 'learn' },
    ]);
  });

  it('esquecer pede confirmação; cancelar não manda nada', async () => {
    const { result } = await renderSpells(true);

    await forget(result.current.forgetSpell, 'fly', false);

    expect(api.post).not.toHaveBeenCalled();
    expect(result.current.spells).toHaveLength(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('aprender e preparar não pedem confirmação', async () => {
    const { result } = await renderSpells(false);

    await act(() => result.current.togglePrepared('fly', true));
    await act(() => result.current.learnSpell('shield'));

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(api.post).toHaveBeenCalledTimes(2);
  });

  it('um duplo clique em aprender manda uma requisição só', async () => {
    const { result } = await renderSpells(false);
    let answer!: (value: { spell: null }) => void;
    api.post.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.learnSpell('shield');
      second = result.current.learnSpell('shield');
    });
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    await act(async () => {
      answer({ spell: null });
      await Promise.all([first, second]);
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('a espera é por magia: outra magia continua livre', async () => {
    const { result, queryClient } = await renderSpells(false);
    let answer!: (value: { spell: null }) => void;
    api.post.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    const pending = renderHook(
      () => ({ shield: useIsSpellPending('shield'), fly: useIsSpellPending('fly') }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      },
    );

    let learning!: Promise<unknown>;
    act(() => {
      learning = result.current.learnSpell('shield');
    });
    await waitFor(() => expect(pending.result.current).toEqual({ shield: true, fly: false }));

    // Fly isn't waiting on Shield's request
    await act(() => result.current.togglePrepared('fly', true));
    expect(api.post).toHaveBeenCalledTimes(2);

    await act(async () => {
      answer({ spell: null });
      await learning;
    });
    await waitFor(() => expect(pending.result.current).toEqual({ shield: false, fly: false }));
  });

  it('uma falha avisa e não muda o grimório', async () => {
    const { result } = await renderSpells(false);
    api.post.mockRejectedValueOnce(new Error('boom'));

    await act(() => result.current.togglePrepared('fly', true));

    expect(toast.error).toHaveBeenCalled();
    expect(result.current.spells[0].isPrepared).toBe(false);
  });
});
