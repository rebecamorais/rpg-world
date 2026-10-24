import { screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { useSession } from '@frontend/hooks/useSession';

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

    expect(screen.queryByRole('link', { name: 'Sign In' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Register' })).toBeNull();
  });

  it('signed-out mostra Entrar e Cadastrar, marcados para esconder enquanto a sessão é conferida', () => {
    session.mockReturnValue({ user: null, status: 'signed-out' });

    renderWithProviders(<HeaderSessionActions />);

    const signIn = screen.getByRole('link', { name: 'Sign In' });
    expect(signIn.closest('[data-signed-out]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('signed-in mostra o menu do usuário', () => {
    session.mockReturnValue({ user: { id: 'u1', email: 'a@b.c' }, status: 'signed-in' });

    renderWithProviders(<HeaderSessionActions />);

    expect(screen.queryByRole('link', { name: 'Sign In' })).toBeNull();
    expect(screen.getByRole('link', { name: /Back/ })).toHaveAttribute('href', '/characters');
  });
});
