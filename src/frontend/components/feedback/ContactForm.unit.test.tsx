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

  it('envia a mensagem com o e-mail inicial e o token, e mostra a tela de sucesso', async () => {
    renderWithProviders(<ContactForm initialEmail="hero@example.com" />);

    const user = await fillAndSubmit();

    expect(await screen.findByRole('heading', { level: 1, name: t.success })).toBeInTheDocument();
    expect(submitFeedback).toHaveBeenCalledWith({
      email: 'hero@example.com',
      type: 'feedback',
      message: 'A mimic ate my spellbook.',
      turnstileToken: 'token-1',
    });

    await user.click(screen.getByRole('button', { name: t.sendAnother }));
    expect(screen.getByLabelText(t.messageLabel)).toHaveValue('');
  });

  it('no modo embutido chama onSent em vez de mostrar a tela de sucesso', async () => {
    const onSent = vi.fn();
    renderWithProviders(<ContactForm initialEmail="hero@example.com" embedded onSent={onSent} />);

    await fillAndSubmit();

    await waitFor(() => expect(onSent).toHaveBeenCalledOnce());
    expect(toast.success).toHaveBeenCalledWith(t.success);
    expect(screen.queryByRole('heading', { name: t.success })).not.toBeInTheDocument();
  });

  it('mantém o formulário e pede um novo desafio quando o envio falha', async () => {
    submitFeedback.mockResolvedValue({ success: false, error: UNEXPECTED_ERROR });
    const onSent = vi.fn();
    renderWithProviders(<ContactForm initialEmail="hero@example.com" embedded onSent={onSent} />);

    await fillAndSubmit();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(t.error));
    expect(onSent).not.toHaveBeenCalled();
    expect(screen.getByLabelText(t.messageLabel)).toHaveValue('A mimic ate my spellbook.');
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(2));
  });
});
