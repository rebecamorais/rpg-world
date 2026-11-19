import { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { SupabaseAuthEmailThrottleRepository } from './supabase-auth-email-throttle.repository';

vi.mock('server-only', () => ({}));

function setup(result: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  const repository = new SupabaseAuthEmailThrottleRepository({ rpc } as unknown as SupabaseClient);
  return { rpc, repository };
}

describe('SupabaseAuthEmailThrottleRepository', () => {
  it('reserva o envio pela função do banco, com o e-mail e o tipo', async () => {
    const { rpc, repository } = setup({ data: true, error: null });

    expect(await repository.claim('hero@example.com', 'recovery')).toBe(true);
    expect(rpc).toHaveBeenCalledWith('claim_auth_email', {
      p_email: 'hero@example.com',
      p_kind: 'recovery',
    });
  });

  it.each([false, null])('só reserva com um true explícito (%s)', async (data) => {
    const { repository } = setup({ data, error: null });

    expect(await repository.claim('hero@example.com', 'magiclink')).toBe(false);
  });

  it('lança erro se o banco falhar, em vez de mandar sem limite', async () => {
    const { repository } = setup({ data: null, error: { message: 'Database unreachable' } });

    await expect(repository.claim('hero@example.com', 'signup')).rejects.toThrow(
      'Failed to claim auth e-mail slot: Database unreachable',
    );
  });
});
