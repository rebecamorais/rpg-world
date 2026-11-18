import { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupabaseProfileRepository } from './supabase-profile-repository';

vi.mock('server-only', () => ({}));

describe('SupabaseProfileRepository.update', () => {
  const update = vi.fn();
  const eq = vi.fn();
  const client = { from: vi.fn(() => ({ update })) } as unknown as SupabaseClient;
  const repository = new SupabaseProfileRepository(client);

  beforeEach(() => {
    vi.clearAllMocks();
    update.mockReturnValue({ eq });
    eq.mockResolvedValue({ error: null });
  });

  const written = () => update.mock.calls[0][0];

  it('um nome vazio apaga o nome (grava null)', async () => {
    await repository.update({ id: 'user-1', fullName: '' });

    expect(written().full_name).toBeNull();
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('um avatar vazio apaga o avatar', async () => {
    await repository.update({ id: 'user-1', avatarUrl: '' });

    expect(written().avatar_url).toBeNull();
  });

  it('o que não veio continua como está', async () => {
    await repository.update({ id: 'user-1', username: 'hero' });

    // undefined fica fora do update do Supabase
    expect(written().full_name).toBeUndefined();
    expect(written().avatar_url).toBeUndefined();
  });

  it('não grava mais a cor do tema', async () => {
    await repository.update({ id: 'user-1', fullName: 'Rebeca' });

    expect(written()).not.toHaveProperty('primary_color');
    expect(written().full_name).toBe('Rebeca');
  });
});
