import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestMagicLinkAction } from '@frontend/actions/auth/request-magic-link-action';

import LoginForm from './LoginForm';

const signInWithPassword = vi.fn();

vi.mock('@frontend/hooks/useAuth', () => ({
  useAuth: () => ({ signInWithPassword }),
}));

vi.mock('@frontend/actions/auth/request-magic-link-action', () => ({
  requestMagicLinkAction: vi.fn(),
}));

const requestMagicLink = vi.mocked(requestMagicLinkAction);

/** Fake Cloudflare Turnstile that solves the challenge as soon as it renders. */
const turnstile = {
  render: vi.fn((_container: string | HTMLElement, options: Record<string, unknown>) => {
    (options.callback as (token: string) => void)('turnstile-token');
    return 'widget-id';
  }),
  reset: vi.fn(),
  remove: vi.fn(),
  getResponse: vi.fn(),
};

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

  describe('magic link', () => {
    beforeEach(() => {
      window.turnstile = turnstile;
      requestMagicLink.mockResolvedValue({ success: true });
    });

    afterEach(() => {
      delete window.turnstile;
    });

    async function sendMagicLink(email = 'hero@example.com') {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);
      await user.click(screen.getByRole('button', { name: t.magicLinkTab }));
      await user.type(screen.getByLabelText(t.emailLabel), email);
      await user.click(screen.getByRole('button', { name: t.magicLinkSubmit }));
    }

    it('manda o e-mail com o token do Turnstile e mostra o aviso para olhar a caixa', async () => {
      await sendMagicLink();

      expect(await screen.findByText(t.verifyEmailTitle)).toBeInTheDocument();
      expect(requestMagicLink).toHaveBeenCalledWith('hero@example.com', 'turnstile-token');
      expect(screen.queryByLabelText(t.passwordLabel)).not.toBeInTheDocument();
    });

    it('mostra o erro e pede um novo desafio quando o envio é recusado', async () => {
      requestMagicLink.mockResolvedValue({ success: false, error: 'auth_error_rate_limited' });

      await sendMagicLink();

      expect(
        await screen.findByText(messages.common.errors.auth_error_rate_limited),
      ).toBeInTheDocument();
      expect(screen.queryByText(t.verifyEmailTitle)).not.toBeInTheDocument();
    });

    it('não envia sem o Turnstile resolvido', async () => {
      delete window.turnstile;
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      await user.click(screen.getByRole('button', { name: t.magicLinkTab }));

      expect(screen.getByRole('button', { name: t.magicLinkSubmit })).toBeDisabled();
      expect(requestMagicLink).not.toHaveBeenCalled();
    });
  });
});
