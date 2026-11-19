import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import AuthErrorPage, { generateMetadata } from './page';

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) =>
    createTranslator({ locale: 'en', messages, namespace: namespace as never }),
}));

const errors = messages.common.errors;
const auth = messages.auth;

const props = (query: string) => ({
  searchParams: Promise.resolve(Object.fromEntries(new URLSearchParams(query))),
});

async function renderWith(query: string) {
  renderWithProviders(await AuthErrorPage(props(query)));
}

describe('AuthErrorPage', () => {
  it('mostra a mensagem traduzida do código', async () => {
    await renderWith('message=auth_error_provider');

    expect(screen.getByText(errors.auth_error_provider)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(errors.auth_error_title);
  });

  it('o título fica na cor do texto, não no vermelho do quadro', async () => {
    await renderWith('message=auth_error_provider');

    expect(screen.getByRole('heading', { level: 1 })).not.toHaveClass('text-danger-flare');
  });

  it.each(['no_code_provided', 'auth_error_link_expired'])(
    'trata %s como link que não vale mais, com a mensagem própria',
    async (code) => {
      await renderWith(`message=${code}`);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        errors.expired_link_title,
      );
      expect(screen.getByText(errors[code as keyof typeof errors])).toBeInTheDocument();
    },
  );

  it('o link incompleto não fala de "provedor"', async () => {
    await renderWith('message=no_code_provided');

    expect(document.body).not.toHaveTextContent(/provider/i);
  });

  it('link de nova senha vencido: oferece pedir outro, além do login', async () => {
    await renderWith('message=auth_error_link_expired&type=recovery');

    expect(screen.getByRole('link', { name: auth.requestNewLink })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(screen.getByRole('link', { name: auth.toLogin })).toHaveAttribute('href', '/login');
  });

  it('link de cadastro vencido: pede outro pelo login (o link mágico confirma a conta)', async () => {
    await renderWith('message=auth_error_link_expired&type=signup');

    expect(screen.getByRole('link', { name: auth.requestNewLink })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('sem o tipo do link, leva ao login', async () => {
    await renderWith('message=auth_error_link_expired');

    expect(screen.queryByRole('link', { name: auth.requestNewLink })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: auth.toLogin })).toHaveAttribute('href', '/login');
  });

  it('mostra a mensagem genérica para texto que não é um código conhecido', async () => {
    await renderWith('message=Email+link+is+invalid+or+has+expired');

    expect(screen.getByText(errors.unknown)).toBeInTheDocument();
    expect(screen.queryByText(/Email link/)).not.toBeInTheDocument();
  });

  it('mostra a mensagem genérica sem código', async () => {
    await renderWith('');

    expect(screen.getByText(errors.unknown)).toBeInTheDocument();
  });

  it('a aba tem o título da tela', async () => {
    expect(await generateMetadata(props('message=auth_error_link_expired'))).toEqual({
      title: errors.expired_link_title,
    });
    expect(await generateMetadata(props('message=auth_error_provider'))).toEqual({
      title: errors.auth_error_title,
    });
  });
});
