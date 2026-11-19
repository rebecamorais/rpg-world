import { describe, expect, it } from 'vitest';

import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it('mostra só a primeira letra do nome e o domínio', () => {
    expect(maskEmail('cora@email.com')).toBe('c***@email.com');
    expect(maskEmail('a@b.co')).toBe('a***@b.co');
  });

  it('usa o último @ como separador do domínio', () => {
    expect(maskEmail('"x@y"@email.com')).toBe('"***@email.com');
  });

  it('devolve como está o que não parece um e-mail', () => {
    expect(maskEmail('sem-arroba')).toBe('sem-arroba');
    expect(maskEmail('@email.com')).toBe('@email.com');
  });
});
