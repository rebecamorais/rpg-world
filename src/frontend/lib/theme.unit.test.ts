import { describe, expect, it } from 'vitest';

import { THEME_SCRIPT, parseTheme, themeCookie } from './theme';

function runScript(cookie: string): string | undefined {
  const document = { cookie, documentElement: { dataset: {} as Record<string, string> } };
  new Function('document', THEME_SCRIPT)(document);
  return document.documentElement.dataset.theme;
}

describe('theme', () => {
  it('parseTheme keeps known themes and falls back to dark', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
    for (const value of ['neon', '', undefined, 'LIGHT']) expect(parseTheme(value)).toBe('dark');
  });

  it('themeCookie builds the cookie string', () => {
    expect(themeCookie('light')).toBe('theme=light; path=/; max-age=31536000; SameSite=Lax');
  });

  it('THEME_SCRIPT reads the cookie', () => {
    expect(runScript('a=1; theme=light')).toBe('light');
    expect(runScript('theme=neon')).toBe('dark');
    expect(runScript('')).toBe('dark');
  });
});
