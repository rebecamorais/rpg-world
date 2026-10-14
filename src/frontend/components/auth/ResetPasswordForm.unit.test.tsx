import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordForm from './ResetPasswordForm';

const auth = {
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
};

vi.mock('@lib/supabase-browser', () => ({ getSupabaseBrowserClient: () => ({ auth }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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

  it('troca o código do link de recuperação pela sessão', async () => {
    window.history.replaceState(null, '', '/reset-password?code=recovery-code');
    renderWithProviders(<ResetPasswordForm />);

    expect(await screen.findByLabelText(t.newPasswordLabel)).toBeInTheDocument();
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('recovery-code');
  });

  it('restaura a sessão a partir dos tokens no hash da URL', async () => {
    auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    window.history.replaceState(null, '', '/reset-password#access_token=at&refresh_token=rt');
    renderWithProviders(<ResetPasswordForm />);

    await screen.findByLabelText(t.newPasswordLabel);
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: 'at', refresh_token: 'rt' });
  });

  it('atualiza a senha e mostra a confirmação', async () => {
    renderWithProviders(<ResetPasswordForm />);

    await submit();

    expect(await screen.findByText(t.successDescription)).toBeInTheDocument();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
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

  it('avisa quando a sessão de recuperação não existe', async () => {
    renderWithProviders(<ResetPasswordForm />);
    await screen.findByLabelText(t.newPasswordLabel);
    auth.getSession.mockResolvedValue({ data: { session: null } });

    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(t.sessionNotFound);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('traduz o erro de senha fraca do Supabase', async () => {
    auth.updateUser.mockResolvedValue({ error: { code: 'weak_password' } });
    renderWithProviders(<ResetPasswordForm />);

    await submit();

    // Shown under the new password field, which gets focus
    const field = screen.getByLabelText(t.newPasswordLabel);
    expect(
      await screen.findByText(messages.common.errors.auth_error_update_password_weak),
    ).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveFocus();
    expect(screen.queryByText(t.successDescription)).not.toBeInTheDocument();
  });
});
