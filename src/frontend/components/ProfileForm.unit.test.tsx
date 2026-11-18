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

const PROFILE = { id: 'u1', username: 'thorin', fullName: 'Thorin' };

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

  it('salva nome e username', async () => {
    const user = userEvent.setup();
    const { username, fullName } = await renderForm();

    await user.clear(username);
    await user.type(username, 'dark_elf');
    await user.clear(fullName);
    await user.type(fullName, 'Drizzt');
    await user.click(screen.getByRole('button', { name: t.save }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/api/profile', {
        username: 'dark_elf',
        fullName: 'Drizzt',
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(t.saveSuccess);
  });

  it('apagar o nome manda o nome vazio, que apaga no servidor', async () => {
    const user = userEvent.setup();
    const { fullName } = await renderForm();

    await user.clear(fullName);
    await user.click(screen.getByRole('button', { name: t.save }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/api/profile', { username: 'thorin', fullName: '' }),
    );
  });

  it('a cor do tema saiu do perfil', async () => {
    await renderForm();

    expect(screen.queryByRole('button', { name: t.colors.default })).not.toBeInTheDocument();
  });

  it('sem conexão, diz que é a conexão e mantém o que foi digitado', async () => {
    api.patch.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    const { fullName } = await renderForm();

    await user.clear(fullName);
    await user.type(fullName, 'Drizzt');
    await user.click(screen.getByRole('button', { name: t.save }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.common.errors.common_error_network,
    );
    expect(fullName).toHaveValue('Drizzt');
  });

  it('com o nome alterado e não salvo, sair da página pede confirmação', async () => {
    const user = userEvent.setup();
    const { fullName } = await renderForm();
    const event = () => {
      const e = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(e);
      return e;
    };

    expect(event().defaultPrevented).toBe(false);
    await user.type(fullName, '!');
    expect(event().defaultPrevented).toBe(true);

    await user.click(screen.getByRole('button', { name: t.save }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    // Saved: nothing left to lose
    await waitFor(() => expect(event().defaultPrevented).toBe(false));
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

    // Under the username field, which gets the focus to be fixed
    expect(
      await screen.findByText(messages.common.errors.profile_error_username_taken),
    ).toBeInTheDocument();
    const username = screen.getByLabelText(t.usernameLabel);
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(username).toHaveFocus();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('outros erros ao salvar aparecem no formulário', async () => {
    api.patch.mockRejectedValue(new APIError('common_error_unexpected', 500));
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: t.save }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.common.errors.common_error_unexpected,
    );
  });
});
