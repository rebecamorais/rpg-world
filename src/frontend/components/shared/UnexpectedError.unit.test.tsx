import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UnexpectedError } from './UnexpectedError';

const t = messages.errorPage;

/** What a Server Component's error looks like in the browser, in production. */
function serverError(digest?: string) {
  return Object.assign(new Error('An error occurred in the Server Components render.'), {
    digest,
  });
}

describe('UnexpectedError', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it('diz que algo deu errado sem mostrar o erro técnico', () => {
    renderWithProviders(
      <UnexpectedError error={new Error('relation "party" does not exist')} retry={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { level: 1, name: t.title })).toBeVisible();
    expect(screen.getByText(t.description)).toBeVisible();
    expect(document.body).not.toHaveTextContent('relation');
  });

  it('"Tentar de novo" chama o retry do Next', async () => {
    const retry = vi.fn();
    renderWithProviders(<UnexpectedError error={serverError()} retry={retry} />);

    await userEvent.click(screen.getByRole('button', { name: messages.common.retry }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('leva à página de suporte', () => {
    renderWithProviders(<UnexpectedError error={serverError()} retry={vi.fn()} />);

    expect(screen.getByRole('link', { name: t.support })).toHaveAttribute('href', '/support');
  });

  it('mostra o digest como código de referência, para casar com os logs', () => {
    renderWithProviders(<UnexpectedError error={serverError('2953187042')} retry={vi.fn()} />);

    expect(screen.getByText(t.reference.replace('{code}', '2953187042'))).toBeVisible();
  });

  it('sem digest (erro do próprio navegador ou algo que não é Error), não mostra código', () => {
    renderWithProviders(<UnexpectedError error="boom" retry={vi.fn()} />);

    expect(screen.queryByText(/Reference code/)).not.toBeInTheDocument();
  });

  it('com main, traz o landmark principal; sem, fica dentro do main do layout', () => {
    const { unmount } = renderWithProviders(
      <UnexpectedError error={serverError()} retry={vi.fn()} main />,
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    unmount();

    renderWithProviders(<UnexpectedError error={serverError()} retry={vi.fn()} />);
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });
});
