import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const execute = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@lib/supabase', () => ({ SupabaseFactory: { createAdmin: () => ({}) } }));
vi.mock('@backend/shared/application/cleanup-orphan-avatars.use-case', () => ({
  CleanupOrphanAvatarsUseCase: class {
    execute = execute;
  },
}));

const call = (authorization?: string) =>
  GET(
    new Request('https://rpg.test/api/cron/cleanup-avatars', {
      headers: authorization ? { authorization } : {},
    }),
  );

describe('GET /api/cron/cleanup-avatars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    execute.mockResolvedValue({ removed: 3 });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('roda a limpeza quando a chamada traz o segredo da Vercel', async () => {
    const res = await call('Bearer cron-secret');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ removed: 3 });
  });

  it.each([undefined, 'Bearer wrong', 'cron-secret'])(
    'recusa sem rodar nada quando o cabeçalho é %s',
    async (authorization) => {
      const res = await call(authorization);

      expect(res.status).toBe(401);
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it('recusa tudo quando CRON_SECRET não está configurado', async () => {
    vi.stubEnv('CRON_SECRET', '');

    const res = await call('Bearer ');

    expect(res.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it('responde 500 sem detalhes quando a limpeza falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    execute.mockRejectedValue(new Error('relation storage.objects does not exist'));

    const res = await call('Bearer cron-secret');

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Cleanup failed' });
  });
});
