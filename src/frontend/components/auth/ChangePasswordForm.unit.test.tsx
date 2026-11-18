import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChangePasswordForm from './ChangePasswordForm';

const updatePassword = vi.fn();

vi.mock('@frontend/hooks/useAuth', () => ({ useAuth: () => ({ updatePassword }) }));

const t = messages.changePassword;

async function submit(password: string, { confirm = password, current = 'old-password' } = {}) {
  const user = userEvent.setup();
  const currentField = screen.queryByLabelText(t.currentPasswordLabel);
  if (currentField && current) await user.type(currentField, current);
  await user.type(screen.getByLabelText(t.newPasswordLabel), password);
  await user.type(screen.getByLabelText(t.confirmPasswordLabel), confirm);
  await user.click(screen.getByRole('button', { name: t.submit }));
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatePassword.mockResolvedValue(undefined);
  });

  it('troca a senha confirmando a atual', async () => {
    renderWithProviders(<ChangePasswordForm hasPassword />);

    await submit('new-password');

    expect(updatePassword).toHaveBeenCalledWith('new-password', 'old-password');
  });

  it('sem a senha atual, não chama a API', async () => {
    renderWithProviders(<ChangePasswordForm hasPassword />);

    await submit('new-password', { current: '' });

    expect(await screen.findByText(t.currentPasswordRequired)).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('conta sem senha (só Google) não vê o campo da senha atual', async () => {
    renderWithProviders(<ChangePasswordForm hasPassword={false} />);

    expect(screen.queryByLabelText(t.currentPasswordLabel)).not.toBeInTheDocument();
    await submit('new-password');

    expect(updatePassword).toHaveBeenCalledWith('new-password', undefined);
  });

  it('senha atual errada aparece no campo dela', async () => {
    updatePassword.mockRejectedValue(new Error('auth_error_update_password_current_invalid'));
    renderWithProviders(<ChangePasswordForm hasPassword />);

    await submit('new-password');

    const message = messages.common.errors.auth_error_update_password_current_invalid;
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(t.currentPasswordLabel)).toHaveAttribute('aria-invalid', 'true');
  });

  it('exige 8 caracteres, como o cadastro', async () => {
    renderWithProviders(<ChangePasswordForm hasPassword />);

    await submit('1234567');

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('traduz o código de erro da API em vez de mostrá-lo cru', async () => {
    updatePassword.mockRejectedValue(new Error('auth_error_update_password_same'));
    renderWithProviders(<ChangePasswordForm hasPassword />);

    await submit('new-password');

    const message = messages.common.errors.auth_error_update_password_same;
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('auth_error_update_password_same')).not.toBeInTheDocument();
  });

  it('volta para o perfil, não para o login', () => {
    renderWithProviders(<ChangePasswordForm hasPassword />);

    expect(screen.getByRole('link', { name: t.backToProfile })).toHaveAttribute(
      'href',
      '/settings/profile',
    );
  });

  it('não fala em senha temporária', () => {
    renderWithProviders(<ChangePasswordForm hasPassword />);

    expect(screen.queryByText(/tempor/i)).not.toBeInTheDocument();
  });

  it('pede ao navegador a senha salva na atual e uma nova nos outros dois campos', () => {
    renderWithProviders(<ChangePasswordForm hasPassword />);

    expect(screen.getByLabelText(t.currentPasswordLabel)).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    expect(screen.getByLabelText(t.newPasswordLabel)).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(screen.getByLabelText(t.confirmPasswordLabel)).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
  });
});
