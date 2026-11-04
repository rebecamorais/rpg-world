import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import HeroCTA from './HeroCTA';

describe('HeroCTA', () => {
  it('links to the demo beside the main call to action', () => {
    renderWithProviders(<HeroCTA />);

    expect(screen.getByRole('link', { name: messages.landing.ctaDemo })).toHaveAttribute(
      'href',
      '/demo',
    );
    expect(screen.getByRole('link', { name: messages.landing.ctaStart })).toHaveAttribute(
      'href',
      '/characters',
    );
  });
});
