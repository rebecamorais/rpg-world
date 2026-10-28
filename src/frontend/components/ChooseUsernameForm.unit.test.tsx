import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { APIError } from '@frontend/lib/api-client';

import ChooseUsernameForm from './ChooseUsernameForm';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), patch: vi.fn() },
}));

const t = messages.chooseUsername;
const v = messages.profileForm.validation;
const patch = vi.mocked(rpgWorldApi.patch);
const assign = vi.fn();

async function choose(name: string) {
  const user = userEvent.setup();
  if (name) await user.type(screen.getByLabelText(t.label), name);
  await user.click(screen.getByRole('button', { name: t.submit }));
}

describe('ChooseUsernameForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', { ...window.location, assign });
    vi.mocked(rpgWorldApi.get).mockResolvedValue({ id: 'u1', username: 'corvo_dourado_4821' });
    patch.mockResolvedValue(undefined);
  });

  it('não mostra o username gerado', () => {
    renderWithProviders(<ChooseUsernameForm />);

    expect(screen.getByLabelText(t.label)).toHaveValue('');
  });

  it('recusa menos de 3 caracteres e caracteres inválidos', async () => {
    renderWithProviders(<ChooseUsernameForm />);

    await choose('ab');
    expect(await screen.findByText(v.usernameMin)).toBeInTheDocument();

    await userEvent.setup().clear(screen.getByLabelText(t.label));
    await choose('Aria Bold');
    expect(await screen.findByText(v.usernamePattern)).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
  });

  it('mostra o erro de username em uso', async () => {
    patch.mockRejectedValue(new APIError('profile_error_username_taken', 409));
    renderWithProviders(<ChooseUsernameForm />);

    await choose('aria_bold');

    expect(
      await screen.findByText(messages.common.errors.profile_error_username_taken),
    ).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it('salvar envia o username e segue para /characters', async () => {
    renderWithProviders(<ChooseUsernameForm />);

    await choose('aria_bold');

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/characters'));
    expect(patch).toHaveBeenCalledWith('/api/profile', { username: 'aria_bold' });
  });
});
