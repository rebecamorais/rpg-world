import { waitFor } from '@testing-library/react';
import { messages, renderHookWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { useCharacterSpells } from './useCharacterSpells';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', () => ({ rpgWorldApi: { get: vi.fn(), post: vi.fn() } }));

const api = vi.mocked(rpgWorldApi);
const t = messages.spellsDrawer.toasts;

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

    await result.current.forgetSpell('fly');
    await waitFor(() => expect(result.current.spells).toEqual([]));
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('esquecer oferece desfazer, que aprende e prepara de novo', async () => {
    const { result } = await renderSpells(true);

    await result.current.forgetSpell('fly');
    expect(toast.success).toHaveBeenCalledWith(t.forgotten, expect.anything());

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

    await result.current.forgetSpell('fly');
    await clickToastAction();

    expect(api.post.mock.calls.map(([, body]) => body)).toEqual([
      { id: 'fly', action: 'forget' },
      { id: 'fly', action: 'learn' },
    ]);
  });
});
