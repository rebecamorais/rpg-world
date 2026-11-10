import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    document.cookie = 'theme=; path=/; max-age=0';
  });

  it('troca entre os temas, grava o cookie e atualiza o nome do botão', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = 'dark';
    renderWithProviders(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: messages.common.useLightTheme }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.cookie).toContain('theme=light');
    expect(
      await screen.findByRole('button', { name: messages.common.useDarkTheme }),
    ).toBeInTheDocument();
  });
});
