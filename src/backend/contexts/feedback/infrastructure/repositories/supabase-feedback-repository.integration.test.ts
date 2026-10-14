import { createSignedInClient } from '@tests/helpers/signed-in-client';
import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { FeedbackStatus, FeedbackType } from '../../domain/Feedback';
import { SupabaseFeedbackRepository } from './supabase-feedback-repository';

const admin = SupabaseFactory.createAdmin();
const repo = new SupabaseFeedbackRepository(admin);

const FEEDBACK = {
  email: 'visitor@example.com',
  type: FeedbackType.BUG,
  message: 'The spell list does not load.',
};

describe('SupabaseFeedbackRepository (integração)', () => {
  it('grava feedback anônimo como aberto', async () => {
    const saved = await repo.save(FEEDBACK);

    expect(saved).toMatchObject({ ...FEEDBACK, userId: undefined, status: FeedbackStatus.OPEN });
    expect(saved.id).toEqual(expect.any(String));
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  it('associa o feedback ao usuário logado', async () => {
    const { userId } = await createSignedInClient('feedback');

    const saved = await repo.save({ ...FEEDBACK, userId });

    expect(saved.userId).toBe(userId);
  });

  it('falha quando o usuário não existe', async () => {
    await expect(
      repo.save({ ...FEEDBACK, userId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toThrow('Failed to save feedback');
  });
});

describe('RLS da tabela feedback', () => {
  it('a chave pública não lê nem grava feedback', async () => {
    await repo.save(FEEDBACK);
    const anon = SupabaseFactory.createAnon();

    const { data } = await anon.from('feedback').select('*');
    const { error: insertError } = await anon.from('feedback').insert(FEEDBACK);

    expect(data ?? []).toEqual([]);
    expect(insertError).not.toBeNull();
  });

  it('um usuário logado não lê o feedback de ninguém, nem o próprio', async () => {
    const { client, userId } = await createSignedInClient('feedback-reader');
    await repo.save({ ...FEEDBACK, userId });

    const { data } = await client.from('feedback').select('*');

    expect(data ?? []).toEqual([]);
  });
});
