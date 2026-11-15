import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartyPerson } from '@backend/contexts/parties/domain/PartyView';

import { PartyRequests } from './PartyRequests';

const t = messages.parties.requestsSection;
const named = (text: string, name: string) => text.replace('{name}', name);

const person = (userId: string, status: PartyPerson['status']): PartyPerson => ({
  userId,
  username: userId,
  avatarUrl: null,
  status,
});

function renderRequests() {
  const onApprove = vi.fn();
  const onRemove = vi.fn();
  renderWithProviders(
    <PartyRequests
      people={[person('ana', 'requested'), person('bia', 'requested'), person('caio', 'invited')]}
      onApprove={onApprove}
      onRemove={onRemove}
      isBusy={false}
    />,
  );
  return { onApprove, onRemove };
}

describe('PartyRequests', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('cada botão diz de quem é o pedido ou o convite', () => {
    renderRequests();

    for (const name of ['@ana', '@bia']) {
      expect(screen.getByRole('button', { name: named(t.approveFrom, name) })).toHaveTextContent(
        t.approve,
      );
      expect(screen.getByRole('button', { name: named(t.declineFrom, name) })).toHaveTextContent(
        t.decline,
      );
    }
    expect(screen.getByRole('button', { name: named(t.cancelFor, '@caio') })).toHaveTextContent(
      t.cancel,
    );
  });

  it('recusar um pedido pede confirmação antes', async () => {
    const { onRemove } = renderRequests();
    const user = userEvent.setup();
    const decline = screen.getByRole('button', { name: named(t.declineFrom, '@bia') });

    await user.click(decline);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(named(t.declineConfirm, '@bia'));
    await user.click(within(dialog).getByRole('button', { name: messages.common.cancel }));
    expect(onRemove).not.toHaveBeenCalled();

    await user.click(decline);
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: t.decline }),
    );
    expect(onRemove).toHaveBeenCalledWith('bia');
  });

  it('cancelar um convite pede confirmação antes', async () => {
    const { onRemove } = renderRequests();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: named(t.cancelFor, '@caio') }));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(named(t.cancelConfirm, '@caio'));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: t.cancelInvite }));
    expect(onRemove).toHaveBeenCalledWith('caio');
  });

  it('aprovar não pede confirmação', async () => {
    const { onApprove } = renderRequests();

    await userEvent.click(screen.getByRole('button', { name: named(t.approveFrom, '@ana') }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onApprove).toHaveBeenCalledWith('ana');
  });
});
