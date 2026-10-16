import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { HeaderSupportLink } from './HeaderSupportLink';

vi.mock('@frontend/actions/feedback/submit-feedback-action', () => ({
  submitFeedbackAction: vi.fn(),
}));

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
});
