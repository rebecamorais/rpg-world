import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordForm from './ResetPasswordForm';

const auth = {
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
};
const replace = vi.fn();

vi.mock('@lib/supabase-browser', () => ({ getSupabaseBrowserClient: () => ({ auth }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const t = messages.resetPassword;
const SESSION = { data: { session: { access_token: 'token' } } };

async function submit(password = 'new-password', confirm = password) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(t.newPasswordLabel), password);
  await user.type(screen.getByLabelText(t.confirmPasswordLabel), confirm);
  await user.click(screen.getByRole('button', { name: t.submit }));
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/reset-password');
    auth.getSession.mockResolvedValue(SESSION);
    auth.updateUser.mockResolvedValue({ error: null });
  });

  it('ignora tokens de sessão no hash da URL (login CSRF)', async () => {
    window.history.replaceState(null, '', '/reset-password#access_token=at&refresh_token=rt');
    renderWithProviders(<ResetPasswordForm />);

    await screen.findByLabelText(t.newPasswordLabel);
    expect(auth.setSession).not.toHaveBeenCalled();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('diz de qual conta é a senha', () => {
    renderWithProviders(<ResetPasswordForm email="c***@email.com" />);

    expect(
      screen.getByText(t.subtitleForEmail.replace('{email}', 'c***@email.com')),
    ).toBeInTheDocument();
  });

  it('atualiza a senha e abre o app com o aviso "Senha alterada"', async () => {
    renderWithProviders(<ResetPasswordForm />);

    await submit();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/characters'));
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    expect(toast.success).toHaveBeenCalledWith(t.changed);
    // No card telling someone already signed in to "log in"
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('explica o erro quando as senhas não conferem, sem enviar', async () => {
    renderWithProviders(<ResetPasswordForm />);

    await submit('new-password', 'different');

    expect(await screen.findByText(messages.common.passwordsDoNotMatch)).toBeInTheDocument();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('explica o tamanho mínimo da senha, sem enviar', async () => {
    renderWithProviders(<ResetPasswordForm />);

    await submit('short');

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('avisa quando a sessão do link terminou enquanto o form estava aberto', async () => {
    renderWithProviders(<ResetPasswordForm />);
    await screen.findByLabelText(t.newPasswordLabel);
    auth.getSession.mockResolvedValue({ data: { session: null } });

    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(t.sessionNotFound);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('traduz o erro de senha fraca do Supabase', async () => {
    auth.updateUser.mockResolvedValue({ error: { code: 'weak_password', status: 422 } });
    renderWithProviders(<ResetPasswordForm />);

    await submit();

    // Shown under the new password field, which gets focus
    const field = screen.getByLabelText(t.newPasswordLabel);
    expect(
      await screen.findByText(messages.common.errors.auth_error_update_password_weak),
    ).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveFocus();
    expect(replace).not.toHaveBeenCalled();
  });

  it('sem conexão, diz que é a conexão, não "erro desconhecido"', async () => {
    // What supabase-js answers when fetch fails: an AuthRetryableFetchError with status 0
    auth.updateUser.mockResolvedValue({
      error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 },
    });
    renderWithProviders(<ResetPasswordForm />);

    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.common.errors.common_error_network,
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('sem conexão ao ler a sessão, também fala da conexão', async () => {
    auth.getSession.mockRejectedValue(new TypeError('Failed to fetch'));
    renderWithProviders(<ResetPasswordForm />);

    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.common.errors.common_error_network,
    );
  });
});
