import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import { SupabaseAuthLoginThrottleRepository } from './supabase-auth-login-throttle.repository';

vi.mock('server-only', () => ({}));

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function setup(result: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  const repository = new SupabaseAuthLoginThrottleRepository({ rpc } as unknown as SupabaseClient);
  return { rpc, repository };
}

describe('SupabaseAuthLoginThrottleRepository', () => {
  it('manda só os hashes, com o e-mail normalizado', async () => {
    const { rpc, repository } = setup({ data: 0, error: null });

    await repository.claim({ email: '  Hero@Example.COM ', ip: '203.0.113.7' });

    expect(rpc).toHaveBeenCalledWith('claim_login_attempt', {
      p_email_hash: sha256('hero@example.com'),
      p_ip_hash: sha256('203.0.113.7'),
    });
  });

  it('sem IP, manda null e conta só o e-mail', async () => {
    const { rpc, repository } = setup({ data: 0, error: null });

    await repository.claim({ email: 'hero@example.com' });

    expect(rpc).toHaveBeenCalledWith('claim_login_attempt', {
      p_email_hash: sha256('hero@example.com'),
      p_ip_hash: null,
    });
  });

  it('devolve os segundos de espera que o banco responde', async () => {
    expect(await setup({ data: 0, error: null }).repository.claim({ email: 'a@b.co' })).toBe(0);
    expect(await setup({ data: 840, error: null }).repository.claim({ email: 'a@b.co' })).toBe(840);
  });

  it('lança erro se o banco falhar, em vez de deixar tentar sem limite', async () => {
    const { repository } = setup({ data: null, error: { message: 'Database unreachable' } });

    await expect(repository.claim({ email: 'a@b.co' })).rejects.toThrow(
      'Failed to claim login attempt: Database unreachable',
    );
  });

  it('não aceita resposta que não seja número', async () => {
    const { repository } = setup({ data: null, error: null });

    await expect(repository.claim({ email: 'a@b.co' })).rejects.toThrow(
      'Failed to claim login attempt',
    );
  });

  it.each([
    ['release', false],
    ['succeed', true],
  ] as const)('%s fecha a tentativa com p_success = %s', async (method, success) => {
    const { rpc, repository } = setup({ data: null, error: null });

    await repository[method]({ email: 'Hero@example.com', ip: '203.0.113.7' });

    expect(rpc).toHaveBeenCalledWith('finish_login_attempt', {
      p_email_hash: sha256('hero@example.com'),
      p_ip_hash: sha256('203.0.113.7'),
      p_success: success,
    });
  });

  it('lança erro se fechar a tentativa falhar', async () => {
    const { repository } = setup({ data: null, error: { message: 'boom' } });

    await expect(repository.release({ email: 'a@b.co' })).rejects.toThrow(
      'Failed to finish login attempt: boom',
    );
  });
});
