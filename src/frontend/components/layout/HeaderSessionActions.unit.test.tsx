import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { useSession } from '@frontend/hooks/useSession';
import { SESSION_QUERY_KEY } from '@frontend/lib/query-keys';

import pt from '../../../../messages/pt.json';
import { HeaderSessionActions } from './HeaderSessionActions';

vi.mock('@frontend/hooks/useSession', () => ({ useSession: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/',
}));

const session = vi.mocked(useSession);

describe('HeaderSessionActions', () => {
  it('com status loading não mostra Entrar nem Cadastrar', () => {
    session.mockReturnValue({ user: null, status: 'loading' });

    renderWithProviders(<HeaderSessionActions />);

    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Sign up' })).toBeNull();
  });

  it('signed-out mostra Entrar e Cadastrar, marcados para esconder enquanto a sessão é conferida', () => {
    session.mockReturnValue({ user: null, status: 'signed-out' });

    renderWithProviders(<HeaderSessionActions />);

    const signIn = screen.getByRole('link', { name: 'Sign in' });
    expect(signIn.closest('[data-signed-out]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('signed-in leva aos personagens pelo nome do destino (não "Voltar") e mostra o Sair', () => {
    session.mockReturnValue({ user: { id: 'u1', email: 'a@b.c' }, status: 'signed-in' });

    renderWithProviders(<HeaderSessionActions />);

    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
    expect(screen.getByRole('link', { name: messages.dashboard.myCharacters })).toHaveAttribute(
      'href',
      '/characters',
    );
    expect(screen.getByRole('button', { name: messages.common.logout })).toBeInTheDocument();
  });

  it('com a sessão do servidor, guarda-a para as páginas públicas não perguntarem de novo', () => {
    const user = { id: 'u1', email: 'a@b.c' };
    session.mockReturnValue({ user, status: 'signed-in' });

    const { queryClient } = renderWithProviders(<HeaderSessionActions serverUser={user} />);

    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(user);
  });

  it('em português, "Entrar" e "Criar conta" levam aos endereços em português', () => {
    session.mockReturnValue({ user: null, status: 'signed-out' });

    renderWithProviders(
      <NextIntlClientProvider locale="pt" messages={pt} timeZone="UTC">
        <HeaderSessionActions />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/pt/login');
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/pt/register',
    );
  });
});
