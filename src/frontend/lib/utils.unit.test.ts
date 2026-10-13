import { describe, expect, it } from 'vitest';

import { cn, getStatColorClass } from './utils';

describe('cn', () => {
  it('junta classes e resolve conflitos do Tailwind pela última', () => {
    expect(cn('p-2 text-sm', false && 'hidden', 'p-4')).toBe('text-sm p-4');
  });
});

describe('getStatColorClass', () => {
  it('destaca bônus, penalidades e neutro com cores diferentes', () => {
    expect(getStatColorClass(2)).toBe('text-character-flare');
    expect(getStatColorClass(-1)).toBe('text-red-flare');
    expect(getStatColorClass(0)).toBe('text-foreground');
  });
});
