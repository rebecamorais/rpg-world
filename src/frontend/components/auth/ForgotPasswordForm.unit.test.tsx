import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestPasswordResetAction } from '@frontend/actions/auth/request-password-reset-action';

import ForgotPasswordForm from './ForgotPasswordForm';

vi.mock('@frontend/actions/auth/request-password-reset-action', () => ({
  requestPasswordResetAction: vi.fn(),
}));

const t = messages.forgotPassword;
const requestReset = vi.mocked(requestPasswordResetAction);

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

async function fillAndSubmit(email = 'hero@example.com') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(t.emailLabel), email);
  await user.click(screen.getByRole('button', { name: t.submit }));
  return user;
}

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.turnstile = turnstile;
    requestReset.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    delete window.turnstile;
  });

  it('pede o link com o token e leva o foco ao aviso, que mostra o e-mail', async () => {
    renderWithProviders(<ForgotPasswordForm />);

    await fillAndSubmit();

    const heading = await screen.findByRole('heading', { name: t.successTitle });
    expect(heading).toHaveFocus();
    expect(screen.getByText('hero@example.com')).toBeInTheDocument();
    expect(requestReset).toHaveBeenCalledWith('hero@example.com', 'turnstile-token');
    expect(screen.getByRole('link', { name: t.backToLogin })).toHaveAttribute('href', '/login');
  });

  it('"Usar outro e-mail" volta ao formulário, com um novo desafio', async () => {
    renderWithProviders(<ForgotPasswordForm />);

    const user = await fillAndSubmit();
    await user.click(await screen.findByRole('button', { name: messages.common.useAnotherEmail }));

    expect(screen.getByLabelText(t.emailLabel)).toHaveValue('hero@example.com');
    expect(screen.getByLabelText(t.emailLabel)).toHaveFocus();
    expect(turnstile.render).toHaveBeenCalledTimes(2);
  });

  it('diz que o e-mail é inválido, não só "E-mail"', async () => {
    renderWithProviders(<ForgotPasswordForm />);

    // Passes the browser's type="email" check but not the form schema (no TLD)
    await fillAndSubmit('hero@example');

    expect(await screen.findByText(messages.register.errors.invalidEmail)).toBeInTheDocument();
    expect(requestReset).not.toHaveBeenCalled();
  });

  it('sem rede, diz para conferir a conexão', async () => {
    requestReset.mockRejectedValue(new TypeError('Failed to fetch'));
    renderWithProviders(<ForgotPasswordForm />);

    await fillAndSubmit();

    expect(
      await screen.findByText(messages.common.errors.common_error_offline),
    ).toBeInTheDocument();
  });

  it('mostra o erro traduzido quando o pedido é recusado', async () => {
    requestReset.mockResolvedValue({ success: false, error: 'auth_error_rate_limited' });
    renderWithProviders(<ForgotPasswordForm />);

    await fillAndSubmit();

    expect(
      await screen.findByText(messages.common.errors.auth_error_rate_limited),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: t.successTitle })).not.toBeInTheDocument();
  });
});
