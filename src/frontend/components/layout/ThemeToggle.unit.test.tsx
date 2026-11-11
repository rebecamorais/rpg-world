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

  // jsdom doesn't apply Tailwind, so the visible variant is checked by the classes CSS keys on
  const variantOf = (name: string) => screen.getByText(name).parentElement!;

  it('renderiza os dois nomes; o CSS por data-theme escolhe qual aparece', () => {
    renderWithProviders(<ThemeToggle />);

    expect(variantOf(messages.common.useLightTheme)).toHaveClass('contents');
    expect(variantOf(messages.common.useLightTheme)).toHaveClass('[[data-theme=light]_&]:hidden');
    expect(variantOf(messages.common.useDarkTheme)).toHaveClass('hidden');
    expect(variantOf(messages.common.useDarkTheme)).toHaveClass('[[data-theme=light]_&]:contents');
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
  });

  it('troca entre os temas e grava o cookie', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = 'dark';
    renderWithProviders(<ThemeToggle />);

    await user.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.cookie).toContain('theme=light');

    await user.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
