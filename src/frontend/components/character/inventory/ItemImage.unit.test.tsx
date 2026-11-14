import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ItemImage } from './ItemImage';
import { UNKNOWN_ITEM_ICON, gameIconOf } from './item-visuals';

const item = { id: 'spellbook', category: 'adventuring-gear' } as never;

describe('ItemImage', () => {
  it('renders the uploaded image over art and icon', () => {
    const { container } = render(
      <ItemImage item={item} imageUrl="https://x/y.png" art={{ spellbook: '/a.svg' }} />,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://x/y.png');
    expect(img).toHaveAttribute('alt', '');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders own art as a mask, with no sprite icon', () => {
    const { container } = render(<ItemImage item={item} art={{ spellbook: '/a.svg' }} />);
    const span = container.querySelector('span') as HTMLElement;
    expect(span.getAttribute('style')).toContain('/a.svg');
    expect(span.getAttribute('style')).toContain('mask-image');
    expect(container.querySelector('use')).toBeNull();
  });

  it('falls back to the game icon', () => {
    const { container } = render(<ItemImage item={item} art={{}} />);
    expect(container.querySelector('use')?.getAttribute('href')).toMatch(
      new RegExp(`#${gameIconOf(item)}$`),
    );
  });

  it('uses the unknown icon for a null item', () => {
    const { container } = render(<ItemImage item={null} art={{}} />);
    expect(container.querySelector('use')?.getAttribute('href')).toMatch(
      new RegExp(`#${UNKNOWN_ITEM_ICON}$`),
    );
  });
});
