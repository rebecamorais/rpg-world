import { screen } from '@testing-library/react';
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
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const { onRemove } = renderRequests();
    const decline = screen.getByRole('button', { name: named(t.declineFrom, '@bia') });

    await userEvent.click(decline);
    expect(confirm).toHaveBeenCalledWith(named(t.declineConfirm, '@bia'));
    expect(onRemove).not.toHaveBeenCalled();

    await userEvent.click(decline);
    expect(onRemove).toHaveBeenCalledWith('bia');
  });

  it('cancelar um convite pede confirmação antes', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { onRemove } = renderRequests();

    await userEvent.click(screen.getByRole('button', { name: named(t.cancelFor, '@caio') }));

    expect(confirm).toHaveBeenCalledWith(named(t.cancelConfirm, '@caio'));
    expect(onRemove).toHaveBeenCalledWith('caio');
  });

  it('aprovar não pede confirmação', async () => {
    const confirm = vi.spyOn(window, 'confirm');
    const { onApprove } = renderRequests();

    await userEvent.click(screen.getByRole('button', { name: named(t.approveFrom, '@ana') }));

    expect(confirm).not.toHaveBeenCalled();
    expect(onApprove).toHaveBeenCalledWith('ana');
  });
});
