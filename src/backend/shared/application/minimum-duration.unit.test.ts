import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { withMinimumDuration } from './minimum-duration';

describe('withMinimumDuration', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('segura a resposta rápida até completar o tempo mínimo', async () => {
    let settled = false;
    const result = withMinimumDuration(1500, async () => 'ok').then((value) => {
      settled = true;
      return value;
    });

    await vi.advanceTimersByTimeAsync(1499);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe('ok');
  });

  it('também segura um erro, para falhar no mesmo tempo que um sucesso', async () => {
    let settled = false;
    const result = withMinimumDuration(1500, async () => {
      throw new Error('boom');
    }).catch((error: Error) => {
      settled = true;
      return error.message;
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(500);
    await expect(result).resolves.toBe('boom');
  });

  it('não acrescenta espera quando o trabalho já demorou mais que o mínimo', async () => {
    const result = withMinimumDuration(100, async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return 'slow';
    });

    await vi.advanceTimersByTimeAsync(300);
    await expect(result).resolves.toBe('slow');
  });
});
