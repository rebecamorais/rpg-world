import type { ReactNode } from 'react';

import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NotFound from './not-found';

const getSessionUser = vi.fn();
const loadDashboardShell = vi.fn();

vi.mock('@api', () => ({ getApi: async () => ({ authApi: { getSessionUser } }) }));
vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) =>
    createTranslator({ locale: 'en', messages, namespace: namespace as never }),
}));
// The real shell needs the dashboard's providers and data; here it only marks where it goes
vi.mock('@frontend/components/layout/DashboardShell', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
  loadDashboardShell: (...args: unknown[]) => loadDashboardShell(...args),
}));

const t = messages.notFound;
const user = { id: 'user-1', email: 'cora@email.com' };

describe('(app) not-found', () => {
  beforeEach(() => vi.resetAllMocks());

  it('logada: diz que a página não existe, dentro do app com o menu, e leva aos personagens', async () => {
    getSessionUser.mockResolvedValue(user);
    loadDashboardShell.mockResolvedValue({ user, profile: null, parties: null });

    renderWithProviders(await NotFound());

    expect(loadDashboardShell).toHaveBeenCalledWith(user);
    const shell = screen.getByTestId('dashboard-shell');
    expect(shell).toContainElement(screen.getByRole('heading', { level: 1, name: t.title }));
    expect(screen.getByText(t.description)).toBeVisible();
    expect(screen.getByRole('link', { name: t.characters })).toHaveAttribute('href', '/characters');
  });

  it('sem sessão: fica fora do app, com o main da página, e leva ao início', async () => {
    getSessionUser.mockResolvedValue(null);

    renderWithProviders(await NotFound());

    expect(screen.queryByTestId('dashboard-shell')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { level: 1, name: t.title }),
    );
    expect(screen.getByRole('link', { name: t.home })).toHaveAttribute('href', '/');
    expect(loadDashboardShell).not.toHaveBeenCalled();
  });

  it('se a sessão não pôde ser lida, ainda mostra o 404, como para quem não entrou', async () => {
    getSessionUser.mockRejectedValue(new Error('auth down'));

    renderWithProviders(await NotFound());

    expect(screen.getByRole('heading', { level: 1, name: t.title })).toBeVisible();
    expect(screen.getByRole('link', { name: t.home })).toHaveAttribute('href', '/');
  });
});
