import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { submitFeedbackAction } from '@frontend/actions/feedback/submit-feedback-action';
import { useSession } from '@frontend/hooks/useSession';

import ContactCard from './ContactCard';

vi.mock('@frontend/actions/feedback/submit-feedback-action', () => ({
  submitFeedbackAction: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@frontend/hooks/useSession', () => ({ useSession: vi.fn() }));

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

describe('ContactCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    challenges = 0;
    window.turnstile = turnstile;
    submitFeedback.mockResolvedValue({ success: true });
    vi.mocked(useSession).mockReturnValue({ user: null, status: 'signed-out' });
  });

  afterEach(() => {
    delete window.turnstile;
  });

  it('mostra a tela de sucesso depois do envio e volta a um formulário limpo', async () => {
    renderWithProviders(<ContactCard initialEmail="hero@example.com" />);

    const user = await fillAndSubmit();

    expect(await screen.findByRole('heading', { level: 1, name: t.success })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: t.sendAnother }));
    expect(screen.getByRole('heading', { level: 1, name: t.title })).toBeInTheDocument();
    expect(screen.getByLabelText(t.messageLabel)).toHaveValue('');
    expect(screen.getByLabelText(t.emailLabel)).toHaveValue('hero@example.com');
  });

  it('sem e-mail do servidor, preenche com o da sessão quando ela chega', () => {
    const session = vi.mocked(useSession);
    session.mockReturnValue({ user: null, status: 'loading' });
    const { rerender } = renderWithProviders(<ContactCard />);
    expect(screen.getByLabelText(t.emailLabel)).toHaveValue('');

    session.mockReturnValue({ user: { id: 'u1', email: 'hero@example.com' }, status: 'signed-in' });
    rerender(<ContactCard />);

    expect(screen.getByLabelText(t.emailLabel)).toHaveValue('hero@example.com');
  });
});
