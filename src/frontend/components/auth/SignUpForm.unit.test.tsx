import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signUpAction } from '@frontend/actions/auth/sign-up-action';

import SignUpForm from './SignUpForm';

vi.mock('@frontend/actions/auth/sign-up-action', () => ({ signUpAction: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const t = messages.register;
const signUp = vi.mocked(signUpAction);

/** Fake Cloudflare Turnstile that solves the challenge as soon as it renders. */
let challenges = 0;
const turnstile = {
  render: vi.fn((_container: string | HTMLElement, options: Record<string, unknown>) => {
    challenges += 1;
    (options.callback as (token: string) => void)(`token-${challenges}`);
    return 'widget-id';
  }),
  reset: vi.fn(),
  remove: vi.fn(),
  getResponse: vi.fn(),
};

async function fillAndSubmit({
  password = 'longpassword',
  confirm = password,
}: { password?: string; confirm?: string } = {}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(t.emailLabel), 'hero@example.com');
  await user.type(screen.getByLabelText(t.passwordLabel), password);
  await user.type(screen.getByLabelText(t.confirmPasswordLabel), confirm);
  await user.click(screen.getByRole('button', { name: t.submit }));
}

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    challenges = 0;
    window.turnstile = turnstile;
    signUp.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    delete window.turnstile;
  });

  it('envia e-mail, senha e o token do Turnstile e mostra a confirmação', async () => {
    renderWithProviders(<SignUpForm />);

    await fillAndSubmit();

    expect(await screen.findByText(t.successDescription)).toBeInTheDocument();
    const formData = signUp.mock.calls[0][0];
    expect(Object.fromEntries(formData)).toEqual({
      email: 'hero@example.com',
      password: 'longpassword',
      'turnstile-token': 'token-1',
    });
  });

  it('mantém o envio bloqueado enquanto o Turnstile não é resolvido', () => {
    delete window.turnstile;
    renderWithProviders(<SignUpForm />);

    expect(screen.getByRole('button', { name: t.submit })).toBeDisabled();
  });

  it('valida senha curta e senhas diferentes antes de enviar', async () => {
    renderWithProviders(<SignUpForm />);

    await fillAndSubmit({ password: 'short', confirm: 'other' });

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(screen.getByText(messages.common.passwordsDoNotMatch)).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('mostra o erro traduzido e gera um novo desafio quando o cadastro falha', async () => {
    signUp.mockResolvedValue({ success: false, error: 'auth_error_signup_duplicate_email' });
    renderWithProviders(<SignUpForm />);

    await fillAndSubmit();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        messages.common.errors.auth_error_signup_duplicate_email,
      ),
    );
    // The token is single-use: the widget is remounted with a new challenge
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(t.successDescription)).not.toBeInTheDocument();
  });

  it('avisa quando o script do Turnstile não carrega', async () => {
    delete window.turnstile;
    renderWithProviders(<SignUpForm />);

    document.getElementById('cloudflare-turnstile-script')!.dispatchEvent(new Event('error'));

    expect(
      await screen.findByText(messages.common.errors.security_widget_unavailable),
    ).toBeInTheDocument();
  });
});
