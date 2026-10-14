import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError, rpgWorldApi } from '@client';

import { FileUploaderProvider } from '@frontend/context/FileUploaderContext';

import ProfileForm from './ProfileForm';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), patch: vi.fn() },
}));

const api = vi.mocked(rpgWorldApi);
const t = messages.profileForm;

const PROFILE = { id: 'u1', username: 'thorin', fullName: 'Thorin', primaryColor: '#663399' };

async function renderForm() {
  renderWithProviders(
    <FileUploaderProvider>
      <ProfileForm />
    </FileUploaderProvider>,
  );
  const username = await screen.findByLabelText(t.usernameLabel);
  await waitFor(() => expect(username).toHaveValue('thorin'));
  return { username, fullName: screen.getByLabelText(t.fullNameLabel, { exact: true }) };
}

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(PROFILE);
    api.patch.mockResolvedValue(undefined);
  });

  it('carrega o perfil nos campos', async () => {
    const { fullName } = await renderForm();

    expect(fullName).toHaveValue('Thorin');
  });

  it('salva nome, username e cor (todas as cores são hex aceitos pela API)', async () => {
    const user = userEvent.setup();
    const { username, fullName } = await renderForm();

    await user.clear(username);
    await user.type(username, 'dark_elf');
    await user.clear(fullName);
    await user.type(fullName, 'Drizzt');
    await user.click(screen.getByRole('button', { name: t.colors.yellow }));
    await user.click(screen.getByRole('button', { name: t.save }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/api/profile', {
        username: 'dark_elf',
        fullName: 'Drizzt',
        avatarUrl: undefined,
        primaryColor: '#eab308',
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(t.saveSuccess);
  });

  it('recusa username com caracteres inválidos sem chamar a API', async () => {
    const user = userEvent.setup();
    const { username } = await renderForm();

    await user.clear(username);
    await user.type(username, 'Dark Elf');
    await user.click(screen.getByRole('button', { name: t.save }));

    expect(await screen.findByText(t.validation.usernamePattern)).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('mostra a mensagem traduzida quando o username já está em uso', async () => {
    api.patch.mockRejectedValue(new APIError('profile_error_username_taken', 400));
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: t.save }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(messages.common.errors.profile_error_username_taken),
    );
  });

  it('marca a cor escolhida', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: t.colors.blue }));

    expect(screen.getByRole('button', { name: t.colors.blue })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
