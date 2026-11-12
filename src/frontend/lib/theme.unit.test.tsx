import { describe, expect, it } from 'vitest';

import { THEME_COLORS, THEME_SCRIPT, applyTheme, parseTheme, themeCookie } from './theme';

function runScript(cookie: string) {
  const head: { name?: string; content?: string }[] = [];
  const document = {
    cookie,
    documentElement: { dataset: {} as Record<string, string> },
    createElement: () => ({}),
    head: { appendChild: (el: { name?: string; content?: string }) => head.push(el) },
  };
  new Function('document', THEME_SCRIPT)(document);
  return { theme: document.documentElement.dataset.theme, meta: head[0] };
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
    expect(runScript('a=1; theme=light').theme).toBe('light');
    expect(runScript('theme=neon').theme).toBe('dark');
    expect(runScript('').theme).toBe('dark');
  });

  it('THEME_SCRIPT pinta a barra do navegador com o fundo do tema', () => {
    expect(runScript('theme=light').meta).toEqual({
      name: 'theme-color',
      content: THEME_COLORS.light,
    });
    expect(runScript('').meta?.content).toBe(THEME_COLORS.dark);
  });

  it('applyTheme troca o theme-color junto com o tema', () => {
    applyTheme('light');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      THEME_COLORS.light,
    );
    applyTheme('dark');
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      THEME_COLORS.dark,
    );
  });
});
