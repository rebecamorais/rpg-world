import { describe, expect, it } from 'vitest';

import { FeedbackType } from './feedback/domain/Feedback';
import { submitFeedbackSchema } from './feedback/interfaces/feedback.schemas';
import { loreSchema } from './lore/interfaces/lore.schemas';
import { findSpellsQuerySchema } from './spells/interfaces/spells.schemas';
import {
  signInWithPasswordSchema,
  signUpSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from './users/interfaces/users.schemas';

describe('findSpellsQuerySchema', () => {
  it('converte strings da query e aplica os padrões', () => {
    expect(findSpellsQuerySchema.parse({})).toEqual({ locale: 'en', page: 0, limit: 12 });
    expect(
      findSpellsQuerySchema.parse({
        page: '2',
        limit: '24',
        level: '0',
        search: '',
        school: 'evocation',
      }),
    ).toEqual({ locale: 'en', page: 2, limit: 24, level: 0, school: 'evocation' });
  });

  it.each([
    ['limit acima de 50', { limit: '1000' }],
    ['página negativa', { page: '-1' }],
    ['nível acima de 9', { level: '10' }],
    ['número inválido', { page: 'abc' }],
  ])('rejeita %s', (_label, query) => {
    expect(findSpellsQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe('loreSchema', () => {
  it('aceita o payload do GET com campos nulos', () => {
    expect(
      loreSchema.parse({ age: '30', height: null, backstory: 'Era uma vez', extra: 1 }),
    ).toEqual({ age: '30', backstory: 'Era uma vez' });
  });

  it('rejeita campos curtos gigantes', () => {
    expect(loreSchema.safeParse({ age: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('aceita o payload do formulário de perfil', () => {
    expect(
      updateProfileSchema.parse({
        username: 'hero',
        fullName: '',
        avatarUrl: '',
        primaryColor: '#663399',
        id: 'someone-else',
      }),
    ).toEqual({ username: 'hero', fullName: '', avatarUrl: '', primaryColor: '#663399' });
  });

  it.each([
    ['username curto', { username: 'ab' }],
    ['avatar que não é URL', { avatarUrl: 'javascript:alert(1)' }],
    ['cor inválida', { primaryColor: 'red; background:url(x)' }],
  ])('rejeita %s', (_label, body) => {
    expect(updateProfileSchema.safeParse(body).success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('validam e-mail e tamanho mínimo de senha', () => {
    expect(signInWithPasswordSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(
      true,
    );
    expect(signInWithPasswordSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(
      false,
    );
    expect(updatePasswordSchema.safeParse({ newPassword: '12345' }).success).toBe(false);
    expect(
      signUpSchema.safeParse({ email: 'a@b.co', password: '1234567', turnstileToken: 't' }).success,
    ).toBe(false);
  });
});

describe('submitFeedbackSchema', () => {
  it('aceita só tipos conhecidos', () => {
    const base = { email: 'a@b.co', message: 'Mensagem longa o bastante' };
    expect(submitFeedbackSchema.parse({ ...base, type: 'bug' }).type).toBe(FeedbackType.BUG);
    expect(submitFeedbackSchema.safeParse({ ...base, type: 'spam' }).success).toBe(false);
  });
});
