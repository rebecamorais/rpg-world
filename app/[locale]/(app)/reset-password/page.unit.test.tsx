import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordPage from './page';

const getSessionUser = vi.fn();

vi.mock('@api', () => ({ getApi: async () => ({ authApi: { getSessionUser } }) }));
vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) =>
    createTranslator({ locale: 'en', messages, namespace: namespace as never }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@lib/supabase-browser', () => ({ getSupabaseBrowserClient: () => ({ auth: {} }) }));

const t = messages.resetPassword;
const errors = messages.common.errors;

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('sem a sessão do link, diz na hora que o link não vale mais e oferece outro', async () => {
    getSessionUser.mockResolvedValue(null);

    renderWithProviders(await ResetPasswordPage());

    expect(
      screen.getByRole('heading', { level: 1, name: errors.expired_link_title }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: messages.auth.requestNewLink })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(screen.queryByLabelText(t.newPasswordLabel)).not.toBeInTheDocument();
  });

  it('com a sessão, mostra o form com o e-mail da conta mascarado e sem "Voltar"', async () => {
    getSessionUser.mockResolvedValue({ id: 'user-1', email: 'cora@email.com' });

    renderWithProviders(await ResetPasswordPage());

    expect(screen.getByLabelText(t.newPasswordLabel)).toBeInTheDocument();
    expect(
      screen.getByText(t.subtitleForEmail.replace('{email}', 'c***@email.com')),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: messages.common.back })).not.toBeInTheDocument();
  });
});
