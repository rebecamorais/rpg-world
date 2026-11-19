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
const errors = messages.common.errors;
/** The hint's link text (the part inside `<magic>`). */
const magicLinkHintAction = t.unconfirmedHint.replace(/.*<magic>(.*)<\/magic>.*/, '$1');
const passwordField = () => screen.getByLabelText(t.passwordLabel, { selector: 'input' });

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText(t.emailLabel), email);
  if (password) await user.type(passwordField(), password);
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

    const message = errors.auth_error_signin_invalid_credentials;
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(passwordField()).toHaveAttribute('aria-invalid', 'true');
  });

  it('com a senha recusada, aponta o link mágico, que confirma a conta', async () => {
    signInWithPassword.mockRejectedValue(new Error('auth_error_signin_invalid_credentials'));
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('hero@example.com', 'wrong');
    await user.click(await screen.findByRole('button', { name: magicLinkHintAction }));

    // Same e-mail, now in the magic link mode, with the focus on it
    expect(screen.getByRole('tab', { name: t.magicLinkTab })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByLabelText(t.emailLabel)).toHaveValue('hero@example.com');
    expect(screen.getByLabelText(t.emailLabel)).toHaveFocus();
    expect(
      screen.queryByText(errors.auth_error_signin_invalid_credentials),
    ).not.toBeInTheDocument();
  });

  it('não aponta o link mágico para outros erros', async () => {
    signInWithPassword.mockRejectedValue(new Error('auth_error_rate_limited'));
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('hero@example.com', 'secret');

    expect(await screen.findByText(errors.auth_error_rate_limited)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: magicLinkHintAction })).not.toBeInTheDocument();
  });

  it('sem rede, diz para conferir a conexão', async () => {
    signInWithPassword.mockRejectedValue(new TypeError('Failed to fetch'));
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('hero@example.com', 'secret');

    expect(await screen.findByText(errors.common_error_offline)).toBeInTheDocument();
  });

  it('não mostra mensagens de erro desconhecidas, só a genérica', async () => {
    signInWithPassword.mockRejectedValue(new Error('relation "profiles" does not exist'));
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('hero@example.com', 'secret');

    expect(await screen.findByText(errors.unknown)).toBeInTheDocument();
    expect(screen.queryByText(/relation/)).not.toBeInTheDocument();
  });

  it('abre na senha, com o modo escolhido em abas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('tab', { name: t.passwordTab })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('tab', { name: t.magicLinkTab }));
    expect(screen.getByRole('tab', { name: t.magicLinkTab })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: t.passwordTab })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('"Esqueceu a senha?" vem depois do campo de senha, na ordem do Tab', () => {
    renderWithProviders(<LoginForm />);

    const forgot = screen.getByRole('link', { name: t.forgotPassword });
    expect(passwordField().compareDocumentPosition(forgot)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('entrar com o Google é um link para a rota de login', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('link', { name: t.googleLogin })).toHaveAttribute(
      'href',
      '/api/auth/google',
    );
  });

  it('criar conta é um link para o cadastro', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('link', { name: t.register })).toHaveAttribute('href', '/register');
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
      await user.click(screen.getByRole('tab', { name: t.magicLinkTab }));
      await user.type(screen.getByLabelText(t.emailLabel), email);
      await user.click(screen.getByRole('button', { name: t.magicLinkSubmit }));
      return user;
    }

    it('manda o e-mail com o token do Turnstile e leva o foco ao aviso', async () => {
      await sendMagicLink();

      const heading = await screen.findByRole('heading', { name: t.verifyEmailTitle });
      expect(heading).toHaveFocus();
      expect(screen.getByText('hero@example.com')).toBeInTheDocument();
      expect(requestMagicLink).toHaveBeenCalledWith('hero@example.com', 'turnstile-token');
      expect(screen.queryByLabelText(t.passwordLabel)).not.toBeInTheDocument();
    });

    it('"Usar outro e-mail" volta ao formulário, com um novo desafio', async () => {
      const user = await sendMagicLink();

      await user.click(
        await screen.findByRole('button', { name: messages.common.useAnotherEmail }),
      );

      expect(screen.getByLabelText(t.emailLabel)).toHaveValue('hero@example.com');
      expect(screen.getByLabelText(t.emailLabel)).toHaveFocus();
      expect(turnstile.render).toHaveBeenCalledTimes(2);
      await user.click(screen.getByRole('button', { name: t.magicLinkSubmit }));
      expect(requestMagicLink).toHaveBeenCalledTimes(2);
    });

    it('mostra o erro e pede um novo desafio quando o envio é recusado', async () => {
      requestMagicLink.mockResolvedValue({ success: false, error: 'auth_error_rate_limited' });

      await sendMagicLink();

      expect(await screen.findByText(errors.auth_error_rate_limited)).toBeInTheDocument();
      expect(screen.queryByText(t.verifyEmailTitle)).not.toBeInTheDocument();
    });

    it('sem rede, diz para conferir a conexão', async () => {
      requestMagicLink.mockRejectedValue(new TypeError('Failed to fetch'));

      await sendMagicLink();

      expect(await screen.findByText(errors.common_error_offline)).toBeInTheDocument();
    });

    it('não envia sem o Turnstile resolvido', async () => {
      delete window.turnstile;
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      await user.click(screen.getByRole('tab', { name: t.magicLinkTab }));

      expect(screen.getByRole('button', { name: t.magicLinkSubmit })).toBeDisabled();
      expect(requestMagicLink).not.toHaveBeenCalled();
    });
  });

  it('os títulos não têm emoji', () => {
    for (const title of [
      t.verifyEmailTitle,
      messages.register.successTitle,
      messages.forgotPassword.successTitle,
    ]) {
      expect(title).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
