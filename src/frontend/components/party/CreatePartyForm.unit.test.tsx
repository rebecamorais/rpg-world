import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { CreatePartyForm } from './CreatePartyForm';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const t = messages.parties.create;

describe('CreatePartyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rpgWorldApi.get).mockResolvedValue({
      asGm: [],
      asPlayer: [],
      invites: [],
      requests: [],
    });
  });

  it('Enter repetido cria uma mesa só, e o form fica travado até a troca de página', async () => {
    vi.mocked(rpgWorldApi.post).mockResolvedValue({ id: 'nova' });
    renderWithProviders(<CreatePartyForm gmCount={0} />);
    const user = userEvent.setup();
    const field = screen.getByLabelText(t.label);

    await user.type(field, 'Mesa de quinta{Enter}{Enter}');
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith('/parties/nova'));
    // The page hasn't changed yet: the name is gone and the button still waits
    expect(field).toHaveValue('');
    expect(screen.getByRole('button', { name: t.submit })).toHaveAttribute('aria-busy', 'true');
    await user.type(field, 'De novo{Enter}');

    expect(rpgWorldApi.post).toHaveBeenCalledTimes(1);
    expect(rpgWorldApi.post).toHaveBeenCalledWith('/api/parties', { name: 'Mesa de quinta' });
  });

  it('se criar falha, o nome fica para tentar de novo', async () => {
    vi.mocked(rpgWorldApi.post).mockRejectedValueOnce(new Error('boom'));
    renderWithProviders(<CreatePartyForm gmCount={0} />);
    const user = userEvent.setup();
    const field = screen.getByLabelText(t.label);

    await user.type(field, 'Mesa de quinta{Enter}');
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: t.submit })).not.toHaveAttribute('aria-busy'),
    );
    expect(field).toHaveValue('Mesa de quinta');

    vi.mocked(rpgWorldApi.post).mockResolvedValueOnce({ id: 'nova' });
    await user.click(screen.getByRole('button', { name: t.submit }));
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith('/parties/nova'));
    expect(rpgWorldApi.post).toHaveBeenCalledTimes(2);
  });

  it('no limite, o aviso é a descrição do campo, em caixa normal', () => {
    renderWithProviders(<CreatePartyForm gmCount={5} />);

    const limit = t.limit.replace('{max}', '5');
    expect(screen.getByLabelText(t.label)).toHaveAccessibleDescription(limit);
    expect(screen.getByText(limit)).toHaveClass('text-caption');
  });
});
