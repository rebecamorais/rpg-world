import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import DemoNotFound from './not-found';

const t = messages.notFound;

// A demo sheet that doesn't exist fell to Next's built-in 404, outside the demo
describe('demo not-found', () => {
  it('diz que a página não existe e leva ao início da demo', () => {
    renderWithProviders(<DemoNotFound />);

    expect(screen.getByRole('heading', { level: 1, name: t.title })).toBeVisible();
    expect(screen.getByRole('link', { name: t.demo })).toHaveAttribute('href', '/demo');
  });
});
