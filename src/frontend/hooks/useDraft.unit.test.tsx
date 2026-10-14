import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDraft } from './useDraft';

type Hero = { name: string; stats: { str: number; dex: number }; hp: number };

const server: Hero = { name: 'Thor', stats: { str: 10, dex: 10 }, hp: 12 };

function renderDraft(initial: Hero | undefined) {
  return renderHook((props: { server: Hero | undefined }) => useDraft(props.server), {
    initialProps: { server: initial },
  });
}

describe('useDraft', () => {
  it('sem edições, o rascunho é o dado do servidor', () => {
    const { result } = renderDraft(server);

    expect(result.current.draft).toEqual(server);
    expect(result.current.isDirty).toBe(false);
  });

  it('aplica patches por cima do servidor sem alterá-lo', () => {
    const { result } = renderDraft(server);

    act(() => result.current.update({ name: 'Thor Odinson' }));

    expect(result.current.draft?.name).toBe('Thor Odinson');
    expect(result.current.isDirty).toBe(true);
    expect(server.name).toBe('Thor');
  });

  it('patches em função do rascunho não se perdem quando vêm juntos', () => {
    const { result } = renderDraft(server);

    act(() => {
      result.current.update((d) => ({ stats: { ...d.stats, str: 18 } }));
      result.current.update((d) => ({ stats: { ...d.stats, dex: 14 } }));
    });

    expect(result.current.draft?.stats).toEqual({ str: 18, dex: 14 });
  });

  it('um refetch atualiza o que não foi editado e mantém o que foi', () => {
    const { result, rerender } = renderDraft(server);

    act(() => result.current.update({ name: 'Local edit' }));
    rerender({ server: { ...server, name: 'From server', hp: 30 } });

    expect(result.current.draft).toMatchObject({ name: 'Local edit', hp: 30 });
  });

  it('commit salva o rascunho e volta a acompanhar o servidor', async () => {
    const { result, rerender } = renderDraft(server);
    act(() => result.current.update({ name: 'Saved' }));
    let persisted: Hero | undefined;

    await act(() =>
      result.current.commit(async (draft) => {
        persisted = draft;
      }),
    );
    rerender({ server: { ...server, name: 'Saved' } });

    expect(persisted?.name).toBe('Saved');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.draft?.name).toBe('Saved');
  });

  it('mantém o que foi digitado enquanto o salvamento estava em andamento', async () => {
    const { result } = renderDraft(server);
    act(() => result.current.update({ name: 'First' }));
    let finish!: () => void;

    let saving!: Promise<void>;
    act(() => {
      saving = result.current.commit(() => new Promise<void>((resolve) => (finish = resolve)));
    });
    act(() => result.current.update({ hp: 5 }));
    await act(async () => {
      finish();
      await saving;
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.draft?.hp).toBe(5);
  });

  it('não salva se o persist falhar', async () => {
    const { result } = renderDraft(server);
    act(() => result.current.update({ name: 'Unsaved' }));

    await act(async () => {
      await result.current.commit(() => Promise.reject(new Error('boom'))).catch(() => {});
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('ignora edições antes de o servidor responder e permite descartar', () => {
    const { result, rerender } = renderDraft(undefined);

    act(() => result.current.update({ name: 'Too early' }));
    expect(result.current.draft).toBeNull();

    rerender({ server });
    act(() => result.current.update({ name: 'Edited' }));
    act(() => result.current.discard());

    expect(result.current.draft).toEqual(server);
  });

  it('update, commit e discard mantêm a identidade entre renders', () => {
    const { result } = renderDraft(server);
    const before = result.current;

    act(() => result.current.update({ hp: 1 }));

    expect(result.current.update).toBe(before.update);
    expect(result.current.commit).toBe(before.commit);
    expect(result.current.discard).toBe(before.discard);
  });
});
