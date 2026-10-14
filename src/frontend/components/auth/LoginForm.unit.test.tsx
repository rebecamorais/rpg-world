import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginForm from './LoginForm';

const signInWithPassword = vi.fn();
const sendMagicLink = vi.fn();

vi.mock('@frontend/hooks/useAuth', () => ({
  useAuth: () => ({ signInWithPassword, sendMagicLink }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const t = messages.login;

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText(t.emailLabel), email);
  if (password) await user.type(screen.getByLabelText(t.passwordLabel), password);
  await user.click(screen.getByRole('button', { name: t.submit }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithPassword.mockResolvedValue(undefined);
  });

  it('entra com e-mail e senha', async () => {
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('hero@example.com', 'secret');

    expect(signInWithPassword).toHaveBeenCalledWith('hero@example.com', 'secret');
  });

  it('mostra erro de e-mail inválido sem chamar a API', async () => {
    renderWithProviders(<LoginForm />);

    // Passes the browser's type="email" check but not the form schema (no TLD)
    await fillAndSubmit('hero@example', 'secret');

    expect(await screen.findByText(t.invalidEmailError)).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('exige a senha', async () => {
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('hero@example.com', '');

    expect(await screen.findByText(t.passwordRequiredError)).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('mostra a mensagem traduzida quando as credenciais são inválidas', async () => {
    signInWithPassword.mockRejectedValue(new Error('auth_error_signin_invalid_credentials'));
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('hero@example.com', 'wrong');

    const message = messages.common.errors.auth_error_signin_invalid_credentials;
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(t.passwordLabel)).toHaveAttribute('aria-invalid', 'true');
  });

  it('não mostra mensagens de erro desconhecidas, só a genérica', async () => {
    signInWithPassword.mockRejectedValue(new Error('relation "profiles" does not exist'));
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('hero@example.com', 'secret');

    expect(await screen.findByText(messages.common.errors.unknown)).toBeInTheDocument();
    expect(screen.queryByText(/relation/)).not.toBeInTheDocument();
  });

  it('desabilita o envio no modo magic link e avisa que está fora do ar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: t.magicLinkTab }));

    expect(screen.getByText(t.magicLinkDisabledWarning)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.magicLinkDisabledButton })).toBeDisabled();
    expect(screen.queryByLabelText(t.passwordLabel)).not.toBeInTheDocument();
  });
});
