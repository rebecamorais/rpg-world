import { describe, expect, it } from 'vitest';

import { cn, getStatColorClass } from './utils';

describe('cn', () => {
  it('junta classes e resolve conflitos do Tailwind pela última', () => {
    expect(cn('p-2 text-sm', false && 'hidden', 'p-4')).toBe('text-sm p-4');
  });

  it('trata os papéis tipográficos como tamanho de fonte, não como cor', () => {
    expect(cn('text-label text-muted-foreground')).toBe('text-label text-muted-foreground');
    expect(cn('text-title', 'text-character-flare')).toBe('text-title text-character-flare');
    expect(cn('text-sm', 'text-heading')).toBe('text-heading');
  });

  it('um papel tipográfico substitui tamanho, peso e família vindos antes', () => {
    expect(cn('text-sm font-medium tracking-tight font-mono', 'text-label')).toBe('text-label');
    expect(cn('text-label', 'font-mono')).toBe('text-label font-mono');
    expect(cn('text-title', 'text-sm')).toBe('text-sm');
  });
});

describe('getStatColorClass', () => {
  it('destaca bônus, penalidades e neutro com cores diferentes', () => {
    expect(getStatColorClass(2)).toBe('text-character-flare');
    expect(getStatColorClass(-1)).toBe('text-danger-flare');
    expect(getStatColorClass(0)).toBe('text-foreground');
  });
});
