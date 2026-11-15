import { describe, expect, it } from 'vitest';

import { withFallback } from './messages';

describe('withFallback', () => {
  const en = { common: { save: 'Save', cancel: 'Cancel' }, title: 'RPG World' };

  it('keeps the translated texts', () =>
    expect(withFallback({ common: { save: 'Salvar' } }, en).common.save).toBe('Salvar'));

  it('falls back to English for a missing key', () =>
    expect(withFallback({ common: { save: 'Salvar' } }, en).common.cancel).toBe('Cancel'));

  it('treats an empty text as missing', () =>
    expect(withFallback({ common: { save: '', cancel: 'Cancelar' } }, en).common.save).toBe(
      'Save',
    ));

  it('falls back for a whole missing group', () =>
    expect(withFallback({ title: 'RPG World' }, en).common).toEqual(en.common));

  it('drops keys English no longer has', () =>
    expect(withFallback({ old: 'x', title: 'T' } as never, en)).not.toHaveProperty('old'));

  it('keeps lists as lists, the translated one when there is one', () => {
    const withList = { items: ['One', 'Two'] } as never;
    expect(withFallback({ items: ['Um', 'Dois'] } as never, withList)).toEqual({
      items: ['Um', 'Dois'],
    });
    expect(withFallback({} as never, withList)).toEqual({ items: ['One', 'Two'] });
  });
});
