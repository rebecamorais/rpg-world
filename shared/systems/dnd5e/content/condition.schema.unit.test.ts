import { describe, expect, it } from 'vitest';

import {
  conditionDataSchema,
  conditionTextSchema,
  conditionTranslationSchema,
} from './condition.schema';

describe('schema das condições', () => {
  it('aceita condição com e sem nível', () => {
    expect(conditionDataSchema.safeParse({ id: 'prone' }).success).toBe(true);
    expect(conditionDataSchema.safeParse({ id: 'exhaustion', maxLevel: 6 }).success).toBe(true);
  });

  it.each([
    ['nível acima de 6', { id: 'exhaustion', maxLevel: 7 }],
    ['nível zero', { id: 'exhaustion', maxLevel: 0 }],
    ['id com maiúscula', { id: 'Prone' }],
  ])('recusa %s', (_, data) => {
    expect(conditionDataSchema.safeParse(data).success).toBe(false);
  });

  it('o texto precisa de nome e descrição; a tradução pode faltar campo', () => {
    expect(conditionTextSchema.safeParse({ name: 'Prone', description: '' }).success).toBe(false);
    expect(conditionTranslationSchema.safeParse({ name: 'Caído' }).success).toBe(true);
    expect(conditionTranslationSchema.safeParse({ name: '', description: '' }).success).toBe(true);
  });
});
