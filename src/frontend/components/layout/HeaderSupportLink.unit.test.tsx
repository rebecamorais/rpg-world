import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitFeedbackAction } from '@frontend/actions/feedback/submit-feedback-action';

import { HeaderSupportLink } from './HeaderSupportLink';

vi.mock('@frontend/actions/feedback/submit-feedback-action', () => ({
  submitFeedbackAction: vi.fn(),
}));

/** Whether closing or reloading the tab would ask first. */
function leavingAsks() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('HeaderSupportLink', () => {
  it('abre o formulário num diálogo com o e-mail da conta e devolve o foco ao fechar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderSupportLink email="hero@example.com" />);

    const trigger = screen.getByRole('button', { name: messages.common.contactTooltip });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: messages.feedback.title });
    expect(dialog).toBeInTheDocument();
    // The form is loaded on demand, so it shows up after the dialog
    expect(await screen.findByLabelText(messages.feedback.emailLabel)).toHaveValue(
      'hero@example.com',
    );

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('"Fale conosco" no botão e no título: o mesmo nome do começo ao fim', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderSupportLink />);

    await user.click(screen.getByRole('button', { name: messages.common.contactTooltip }));

    expect(messages.feedback.title).toBe(messages.common.contactTooltip);
    expect(
      await screen.findByRole('dialog', { name: messages.common.contactTooltip }),
    ).toBeInTheDocument();
  });

  it('fechar sem querer não perde o que foi escrito', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderSupportLink email="hero@example.com" />);
    const trigger = screen.getByRole('button', { name: messages.common.contactTooltip });

    await user.click(trigger);
    await user.type(
      await screen.findByLabelText(messages.feedback.messageLabel),
      'A mimic ate my spellbook.',
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(trigger);
    expect(await screen.findByLabelText(messages.feedback.messageLabel)).toHaveValue(
      'A mimic ate my spellbook.',
    );
  });

  describe('fechar a aba com uma mensagem escrita', () => {
    afterEach(() => {
      delete window.turnstile;
    });

    it('pede confirmação, com o diálogo aberto ou fechado (o rascunho continua guardado)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<HeaderSupportLink />);

      expect(leavingAsks()).toBe(false);
      await user.click(screen.getByRole('button', { name: messages.common.contactTooltip }));
      const message = await screen.findByLabelText(messages.feedback.messageLabel);
      expect(leavingAsks()).toBe(false);

      await user.type(message, 'A mimic ate my spellbook.');
      expect(leavingAsks()).toBe(true);

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(leavingAsks()).toBe(true);
    });

    it('não pede mais nada depois de enviar', async () => {
      vi.mocked(submitFeedbackAction).mockResolvedValue({ success: true });
      // Fake Turnstile that solves the challenge as soon as it renders
      window.turnstile = {
        render: vi.fn((_container: string | HTMLElement, options: Record<string, unknown>) => {
          (options.callback as (token: string) => void)('token');
          return 'widget-id';
        }),
        reset: vi.fn(),
        remove: vi.fn(),
        getResponse: vi.fn(),
      };
      const user = userEvent.setup();
      renderWithProviders(<HeaderSupportLink email="hero@example.com" />);

      await user.click(screen.getByRole('button', { name: messages.common.contactTooltip }));
      await user.type(
        await screen.findByLabelText(messages.feedback.messageLabel),
        'A mimic ate my spellbook.',
      );
      expect(leavingAsks()).toBe(true);
      await user.click(screen.getByRole('button', { name: messages.feedback.submit }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(leavingAsks()).toBe(false);
    });
  });
});
