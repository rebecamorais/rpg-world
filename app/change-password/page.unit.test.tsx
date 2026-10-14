import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChangePasswordPage from './page';

const updatePassword = vi.fn();

vi.mock('@frontend/hooks/useAuth', () => ({ useAuth: () => ({ updatePassword }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const t = messages.changePassword;

async function submit(password: string, confirm = password) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(t.newPasswordLabel), password);
  await user.type(screen.getByLabelText(t.confirmPasswordLabel), confirm);
  await user.click(screen.getByRole('button', { name: t.submit }));
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatePassword.mockResolvedValue(undefined);
  });

  it('troca a senha', async () => {
    renderWithProviders(<ChangePasswordPage />);

    await submit('new-password');

    expect(updatePassword).toHaveBeenCalledWith('new-password');
    expect(toast.success).toHaveBeenCalledWith(t.success);
  });

  it('exige 8 caracteres, como o cadastro', async () => {
    renderWithProviders(<ChangePasswordPage />);

    await submit('1234567');

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('traduz o código de erro da API em vez de mostrá-lo cru', async () => {
    updatePassword.mockRejectedValue(new Error('auth_error_update_password_same'));
    renderWithProviders(<ChangePasswordPage />);

    await submit('new-password');

    const message = messages.common.errors.auth_error_update_password_same;
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('auth_error_update_password_same')).not.toBeInTheDocument();
  });
});
