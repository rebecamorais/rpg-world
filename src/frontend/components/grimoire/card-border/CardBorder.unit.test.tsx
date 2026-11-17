import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BorderOpeningLayer, cardBorder } from './CardBorder';
import { BORDER_OPENINGS } from './types';

describe('BorderOpeningLayer', () => {
  it.each(BORDER_OPENINGS)('renders %s, hidden from screen readers', (kind) => {
    const { container } = render(<BorderOpeningLayer kind={kind} />);
    const layer = container.firstElementChild!;
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveAttribute('data-opening', kind);
    expect(layer.childElementCount).toBe(kind === 'corners' ? 4 : 1);
  });
});

describe('cardBorder', () => {
  it('keeps the pair and renders nothing on open without an opening effect', () => {
    const border = cardBorder('glow', null);
    expect(border).toMatchObject({ hover: 'glow', opening: null });
    expect(border.className).toBeTruthy();
    expect(render(<>{border.layers()}</>).container).toBeEmptyDOMElement();
  });

  it('renders its opening layer', () => {
    const { container } = render(<>{cardBorder(null, 'beam').layers()}</>);
    expect(container.querySelector('[data-opening="beam"]')).not.toBeNull();
  });
});
