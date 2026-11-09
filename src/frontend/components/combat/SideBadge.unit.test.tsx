import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { SideBadge } from './SideBadge';

const t = messages.combat;

describe('SideBadge', () => {
  it.each([
    ['player', t.player],
    ['ally', t.ally],
    ['neutral', t.neutral],
    ['enemy', t.enemy],
  ] as const)('mostra o texto do lado %s', (side, label) => {
    renderWithProviders(<SideBadge side={side} />);
    expect(screen.getByText(label)).toBeVisible();
  });
});
