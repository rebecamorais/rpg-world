import { describe, expect, it } from 'vitest';

import { characterTheme, safeAccentColor } from './color-utils';

describe('safeAccentColor', () => {
  it.each(['#ff0000', '#F00', '#6d28d9'])('aceita %s', (color) => {
    expect(safeAccentColor(color)).toBe(color);
  });

  it.each(['#12345', 'red', '#gggggg', 'ff0000', '', null, undefined, 'var(--x); color: red'])(
    'rejeita %j',
    (color) => {
      expect(safeAccentColor(color)).toBeUndefined();
    },
  );
});

describe('characterTheme', () => {
  it('aplica a cor do personagem no contexto de tema', () => {
    expect(characterTheme('#ff0000')).toEqual({
      className: 'character-context',
      style: { '--character-color': '#ff0000' },
    });
  });

  it('usa a cor da marca quando a cor salva é inválida ou não existe', () => {
    expect(characterTheme('not-a-color').style).toEqual({ '--character-color': 'var(--brand)' });
    expect(characterTheme(undefined).style).toEqual({ '--character-color': 'var(--brand)' });
  });
});
