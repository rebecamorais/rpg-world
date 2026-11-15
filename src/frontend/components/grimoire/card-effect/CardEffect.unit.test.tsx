import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EffectLayers } from './CardEffect';
import { EFFECTS, EFFECT_IDS } from './types';

describe('EffectLayers', () => {
  it.each(EFFECT_IDS)('renders %s: its drawing or its CSS motif', (id) => {
    const { container } = render(<EffectLayers effect={id} />);
    const layer = container.firstElementChild!;
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveAttribute('data-enter', EFFECTS[id].enter);
    if (EFFECTS[id].parts === 'art') {
      expect(layer.querySelector(`svg[data-art="${id}"]`)?.childElementCount).toBeGreaterThan(0);
    } else {
      expect(layer.querySelector(`[data-effect="${id}"]`)).not.toBeNull();
    }
  });
});
