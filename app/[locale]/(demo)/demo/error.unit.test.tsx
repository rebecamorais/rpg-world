import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DemoError from './error';

// Without it, a demo page error went up to [locale]/error, above the demo's frame and navigation
describe('demo error', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it('mostra o erro sem um main próprio (o do DemoFrame vale) e tenta de novo', async () => {
    const retry = vi.fn();
    renderWithProviders(<DemoError error={new Error('boom')} retry={retry} />);

    expect(screen.getByRole('heading', { level: 1, name: messages.errorPage.title })).toBeVisible();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: messages.common.retry }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
