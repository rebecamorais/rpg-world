import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import AuthErrorPage from './page';

let search = '';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(search) }));

const errors = messages.common.errors;

function renderWith(query: string) {
  search = query;
  renderWithProviders(<AuthErrorPage />);
}

describe('AuthErrorPage', () => {
  it('mostra a mensagem traduzida do código', () => {
    renderWith('message=auth_error_provider');

    expect(screen.getByText(errors.auth_error_provider)).toBeInTheDocument();
    expect(screen.getByText(errors.auth_error_title)).toBeInTheDocument();
  });

  it.each(['no_code_provided', 'auth_error_link_expired'])(
    'trata %s como link expirado',
    (code) => {
      renderWith(`message=${code}`);

      expect(screen.getByText(errors.expired_link_title)).toBeInTheDocument();
      expect(screen.getByText(errors.expired_link_description)).toBeInTheDocument();
    },
  );

  it('mostra a mensagem genérica para texto que não é um código conhecido', () => {
    renderWith('message=Email+link+is+invalid+or+has+expired');

    expect(screen.getByText(errors.unknown)).toBeInTheDocument();
    expect(screen.queryByText(/Email link/)).not.toBeInTheDocument();
  });

  it('mostra a mensagem genérica sem código', () => {
    renderWith('');

    expect(screen.getByText(errors.unknown)).toBeInTheDocument();
  });
});
