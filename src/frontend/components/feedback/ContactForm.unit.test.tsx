import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { submitFeedbackAction } from '@frontend/actions/feedback/submit-feedback-action';

import { UNEXPECTED_ERROR } from '@shared/http/error-response';

import ContactForm from './ContactForm';

vi.mock('@frontend/actions/feedback/submit-feedback-action', () => ({
  submitFeedbackAction: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const t = messages.feedback;
const submitFeedback = vi.mocked(submitFeedbackAction);

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

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(t.messageLabel), 'A mimic ate my spellbook.');
  await user.click(screen.getByRole('button', { name: t.submit }));
  return user;
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    challenges = 0;
    window.turnstile = turnstile;
    submitFeedback.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    delete window.turnstile;
  });

  it('envia a mensagem com o e-mail inicial e o token, avisa e chama onSent', async () => {
    const onSent = vi.fn();
    renderWithProviders(<ContactForm initialEmail="hero@example.com" onSent={onSent} />);

    await fillAndSubmit();

    await waitFor(() => expect(onSent).toHaveBeenCalledOnce());
    expect(submitFeedback).toHaveBeenCalledWith({
      email: 'hero@example.com',
      type: 'feedback',
      message: 'A mimic ate my spellbook.',
      turnstileToken: 'token-1',
    });
    expect(toast.success).toHaveBeenCalledWith(t.success);
  });

  it('mantém o formulário e pede um novo desafio quando o envio falha', async () => {
    submitFeedback.mockResolvedValue({ success: false, error: UNEXPECTED_ERROR });
    const onSent = vi.fn();
    renderWithProviders(<ContactForm initialEmail="hero@example.com" onSent={onSent} />);

    await fillAndSubmit();

    // On the form, not only in a toast that disappears
    expect(await screen.findByRole('alert')).toHaveTextContent(t.error);
    expect(onSent).not.toHaveBeenCalled();
    expect(screen.getByLabelText(t.messageLabel)).toHaveValue('A mimic ate my spellbook.');
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(2));
  });

  it('com o ID de uma mesa, abre como Conta / Acesso com o ID na mensagem, pronta para editar', async () => {
    const partyId = '3f2b8c1e-5d4a-4b7e-9a10-2c6d8e0f1a23';
    renderWithProviders(<ContactForm initialEmail="hero@example.com" partyId={partyId} />);

    expect(screen.getByRole('combobox')).toHaveTextContent(t.types.account);
    const message = screen.getByLabelText(t.messageLabel);
    expect(message).toHaveValue(t.partyMessage.replace('{partyId}', partyId));

    await userEvent.setup().type(message, ' Obrigada!');
    await userEvent.setup().click(screen.getByRole('button', { name: t.submit }));
    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'account',
          message: expect.stringContaining(partyId),
        }),
      ),
    );
  });

  it('ignora um party que não é UUID', () => {
    renderWithProviders(<ContactForm partyId="não-é-uuid" />);

    expect(screen.getByRole('combobox')).toHaveTextContent(t.types.feedback);
    expect(screen.getByLabelText(t.messageLabel)).toHaveValue('');
  });

  it('sem o Turnstile resolvido não envia e explica o que falta no formulário', async () => {
    delete window.turnstile;
    renderWithProviders(<ContactForm initialEmail="hero@example.com" />);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.common.errors.security_token_missing,
    );
    expect(submitFeedback).not.toHaveBeenCalled();
  });

  it('mostra as validações traduzidas antes de enviar', async () => {
    const user = userEvent.setup();
    // Passes the browser's type="email" check but not the form schema (no TLD)
    renderWithProviders(<ContactForm initialEmail="hero@example" />);

    await user.type(screen.getByLabelText(t.messageLabel), 'curta');
    await user.click(screen.getByRole('button', { name: t.submit }));

    expect(await screen.findByText(messages.register.errors.invalidEmail)).toBeInTheDocument();
    expect(screen.getByText(t.messageMin.replace('{min}', '10'))).toBeInTheDocument();
    expect(submitFeedback).not.toHaveBeenCalled();
  });
});
