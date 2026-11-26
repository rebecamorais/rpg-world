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

  // The text says "nome de usuário"; {username} placeholders and @{username} are values, not text
  it('pt não diz "username" no texto', () => {
    const texts = keys(pt).map((key) =>
      key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], pt),
    );
    const visible = texts.flat().map((text) => String(text).replace(/\{username\}/g, ''));
    expect(visible.filter((text) => /\busername\b/i.test(text))).toEqual([]);
  });

  // The screen is "My profile" now; there is no "Settings > Profile" to look for
  it('a Privacidade aponta para "Meu perfil", o nome da tela', () => {
    const where = (messages: typeof en) => messages.privacy.sections;
    expect(JSON.stringify(where(pt))).not.toContain('Configurações > Perfil');
    expect(JSON.stringify(where(en))).not.toContain('Settings > Profile');
    expect(JSON.stringify(where(pt))).toContain(pt.dashboard.myProfile);
    expect(JSON.stringify(where(en))).toContain(en.dashboard.myProfile);
  });
});
