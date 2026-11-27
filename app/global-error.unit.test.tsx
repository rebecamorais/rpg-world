import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import en from '../messages/en.json';
import pt from '../messages/pt.json';
import GlobalError from './global-error';

// next/font only works inside the Next build
vi.mock('@frontend/lib/fonts', () => ({ fontVariables: '' }));

// The root layout failed, so there is no NextIntlClientProvider: the page renders on its own
describe('global error', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it('fala em inglês e em português, cada um com o seu "tentar de novo"', async () => {
    const retry = vi.fn();
    render(<GlobalError error={new Error('boom')} retry={retry} />, { container: document });

    const [english, portuguese] = screen.getAllByRole('heading', { level: 1 });
    expect(english).toHaveTextContent(en.errorPage.title);
    expect(english.closest('section')).toHaveAttribute('lang', 'en');
    expect(portuguese).toHaveTextContent(pt.errorPage.title);
    expect(portuguese.closest('section')).toHaveAttribute('lang', 'pt');

    const ptSection = portuguese.closest('section') as HTMLElement;
    await userEvent.click(within(ptSection).getByRole('button', { name: pt.common.retry }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('mostra o código de referência de um erro do servidor', () => {
    const error = Object.assign(new Error('boom'), { digest: '12345' });
    render(<GlobalError error={error} retry={vi.fn()} />, { container: document });

    expect(
      screen.getByText(new RegExp(en.errorPage.reference.replace('{code}', '12345'))),
    ).toBeVisible();
  });

  // In the browser the inline theme script doesn't run, so the light theme came back dark
  it('no navegador, aplica o tema do cookie', () => {
    document.cookie = 'theme=light; path=/';
    render(<GlobalError error={new Error('boom')} retry={vi.fn()} />, { container: document });

    expect(document.documentElement.dataset.theme).toBe('light');
    document.cookie = 'theme=; path=/; max-age=0';
  });
});
