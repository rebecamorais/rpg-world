import { describe, expect, it } from 'vitest';

import { tagConditions } from './tag-conditions';

const frightened = { id: 'frightened', words: ['frightened'] };
const en = { display: 'when-different' } as const;
const pt = { display: 'always' } as const;

describe('tagConditions', () => {
  it('marca a palavra que é o próprio id sem exibição', () => {
    expect(tagConditions('The target is frightened.', [frightened], en)).toBe(
      'The target is {@condition frightened}.',
    );
  });

  it('em inglês, grava a exibição quando a palavra difere do id', () => {
    expect(tagConditions('Frightened creatures', [frightened], en)).toBe(
      '{@condition frightened||Frightened} creatures',
    );
  });

  it('em português, grava sempre a palavra do texto', () => {
    expect(
      tagConditions(
        'fica amedrontada e caída',
        [
          {
            id: 'frightened',
            words: ['amedrontado', 'amedrontada', 'amedrontados', 'amedrontadas'],
          },
          { id: 'prone', words: ['caído', 'caída', 'caídos', 'caídas'] },
        ],
        pt,
      ),
    ).toBe('fica {@condition frightened||amedrontada} e {@condition prone||caída}');
  });

  it('não diferencia maiúscula nem acento', () => {
    expect(tagConditions('CAIDO', [{ id: 'prone', words: ['caído'] }], pt)).toBe(
      '{@condition prone||CAIDO}',
    );
  });

  it('não marca dentro de palavra', () => {
    expect(tagConditions('unfrightened', [frightened], en)).toBe('unfrightened');
    expect(tagConditions('caídona', [{ id: 'prone', words: ['caído'] }], pt)).toBe('caídona');
  });

  it('não marca o que já está numa tag', () => {
    const prone = [{ id: 'prone', words: ['prone'] }];
    expect(tagConditions('{@condition prone}', prone, en)).toBe('{@condition prone}');
    expect(tagConditions('{@b {@i prone}} prone', prone, en)).toBe(
      '{@b {@i prone}} {@condition prone}',
    );
  });

  // The script does not understand meaning: a fallen shield is tagged too, and review undoes it
  it('marca também o uso comum da palavra', () => {
    expect(tagConditions('o escudo caído no chão', [{ id: 'prone', words: ['caído'] }], pt)).toBe(
      'o escudo {@condition prone||caído} no chão',
    );
  });
});
