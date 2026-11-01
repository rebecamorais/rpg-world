import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { CharacterPortrait } from './CharacterPortrait';

const emblem = (container: HTMLElement) => container.querySelector('[data-class]');

describe('CharacterPortrait', () => {
  it.each([
    ['Wizard', 'wizard'],
    ['Clériga 3', 'cleric'],
    ['Fighter/Rogue', 'fighter'],
  ])('sem foto, "%s" mostra o emblema de %s', (characterClass, cls) => {
    const { container } = renderWithProviders(
      <CharacterPortrait characterClass={characterClass} />,
    );
    expect(emblem(container)).toHaveAttribute('data-class', cls);
    expect(emblem(container)!.querySelector('use')).toHaveAttribute(
      'href',
      expect.stringMatching(/#.+$/),
    );
  });

  it.each([['Artífice'], [''], [null]])(
    'classe "%s" fora do sistema ganha o emblema genérico',
    (characterClass) => {
      const { container } = renderWithProviders(
        <CharacterPortrait characterClass={characterClass} />,
      );
      expect(emblem(container)).toHaveAttribute('data-class', 'unknown');
      expect(emblem(container)!.querySelector('use')).toHaveAttribute(
        'href',
        expect.stringMatching(/#hooded-figure$/),
      );
    },
  );

  it('é decorativo: o nome sempre vem ao lado', () => {
    const { container } = renderWithProviders(<CharacterPortrait characterClass="Mago" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
