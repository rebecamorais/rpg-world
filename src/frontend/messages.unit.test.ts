import { describe, expect, it } from 'vitest';

import en from '../../messages/en.json';
import pt from '../../messages/pt.json';

// Leaves are strings or lists of strings (e.g. terms items)
function keys(messages: object, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' && !Array.isArray(value)
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('mensagens', () => {
  it('en e pt têm exatamente as mesmas chaves', () => {
    const enKeys = keys(en);
    const ptKeys = keys(pt);

    expect(
      ptKeys.filter((key) => !enKeys.includes(key)),
      'só em pt',
    ).toEqual([]);
    expect(
      enKeys.filter((key) => !ptKeys.includes(key)),
      'só em en',
    ).toEqual([]);
  });
});
