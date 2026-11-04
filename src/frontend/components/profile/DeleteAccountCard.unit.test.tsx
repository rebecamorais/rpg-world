import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError, rpgWorldApi } from '@client';

import type { MyParties, PartySummary } from '@backend/contexts/parties/domain/Party';

import { DeleteAccountCard } from './DeleteAccountCard';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn(), post: vi.fn() },
}));

const api = vi.mocked(rpgWorldApi);
const t = messages.accountDeletion.dangerZone;

const party = (name: string, overrides: Partial<PartySummary> = {}): PartySummary => ({
  id: name,
  name,
  system: 'dnd_5e',
  role: 'gm',
  status: 'gm',
  gmUsername: null,
  pendingRequests: 0,
  activePlayers: 0,
  hasGm: true,
  ...overrides,
});

const parties = (overrides: Partial<MyParties> = {}): MyParties => ({
  asGm: [],
  asPlayer: [],
  invites: [],
  requests: [],
  ...overrides,
});

function renderCard({ hasPassword = true, mine = parties() } = {}) {
  api.get.mockImplementation(async (url: string) =>
    url === '/api/parties' ? mine : { id: 'u1', username: 'thorin' },
  );
  return renderWithProviders(<DeleteAccountCard hasPassword={hasPassword} />);
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: t.open }));
  return screen.findByRole('dialog');
}

describe('DeleteAccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({});
  });

  it('lista o que será apagado', async () => {
    renderCard();

    const zone = await screen.findByRole('region', { name: t.title });
    expect(within(zone).getByText(t.erasesLogin)).toBeInTheDocument();
    expect(within(zone).getByText(t.erasesCharacters)).toBeInTheDocument();
    expect(within(zone).getByText(t.erasesImages)).toBeInTheDocument();
  });

  it('separa as mesas que ficam sem mestre, as apagadas e aquelas em que é a última jogadora', async () => {
    renderCard({
      mine: parties({
        asGm: [party('Com jogadores', { activePlayers: 2 }), party('Vazia', { activePlayers: 0 })],
        asPlayer: [
          party('Sozinha', { role: 'player', status: 'active', hasGm: false, activePlayers: 1 }),
          party('Sem mestre, com gente', {
            role: 'player',
            status: 'active',
            hasGm: false,
            activePlayers: 2,
          }),
          party('Com mestre', { role: 'player', status: 'active', activePlayers: 1 }),
        ],
      }),
    });

    const kept = await screen.findByRole('group', { name: t.keptTitle });
    expect(within(kept).getByText('Com jogadores')).toBeInTheDocument();
    expect(within(kept).queryByText('Vazia')).not.toBeInTheDocument();

    const deleted = screen.getByRole('group', { name: t.deletedTitle });
    expect(within(deleted).getByText('Vazia')).toBeInTheDocument();

    const last = screen.getByRole('group', { name: t.lastPlayerTitle });
    expect(within(last).getByText('Sozinha')).toBeInTheDocument();
    expect(within(last).queryByText('Sem mestre, com gente')).not.toBeInTheDocument();
    expect(screen.queryByText('Com mestre')).not.toBeInTheDocument();
  });

  it('sem mesas afetadas, não mostra os grupos de mesas', async () => {
    renderCard();

    await screen.findByRole('button', { name: t.open });
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('o botão de enviar fica desativado até o username bater (e a senha vir, se houver)', async () => {
    const user = userEvent.setup();
    renderCard();
    const dialog = await openDialog(user);
    const send = within(dialog).getByRole('button', { name: t.submit });

    expect(send).toBeDisabled();
    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'thori');
    expect(send).toBeDisabled();
    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'n');
    expect(send).toBeDisabled();
    await user.type(within(dialog).getByLabelText(t.passwordLabel), 'segredo123');
    expect(send).toBeEnabled();
  });

  it('enquanto as mesas carregam, avisa e não deixa enviar', async () => {
    api.get.mockImplementation((url: string) =>
      url === '/api/parties'
        ? new Promise(() => {})
        : Promise.resolve({ id: 'u1', username: 'thorin' }),
    );
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountCard hasPassword={false} />);
    expect(await screen.findByText(t.partiesLoading)).toBeInTheDocument();
    const dialog = await openDialog(user);

    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'thorin');

    expect(within(dialog).getByRole('button', { name: t.submit })).toBeDisabled();
  });

  it('se as mesas falham, mostra o erro com "tentar de novo" e o envio continua desativado', async () => {
    api.get.mockImplementation(async (url: string) => {
      if (url === '/api/parties') throw new APIError('internal_error', 500);
      return { id: 'u1', username: 'thorin' };
    });
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountCard hasPassword={false} />);

    expect(await screen.findByText(t.partiesError)).toBeInTheDocument();
    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'thorin');
    expect(within(dialog).getByRole('button', { name: t.submit })).toBeDisabled();
    await user.keyboard('{Escape}');

    api.get.mockImplementation(async (url: string) =>
      url === '/api/parties'
        ? parties({ asGm: [party('Com jogadores', { activePlayers: 2 })] })
        : { id: 'u1', username: 'thorin' },
    );
    await user.click(screen.getByRole('button', { name: t.partiesRetry }));

    expect(await screen.findByRole('group', { name: t.keptTitle })).toBeInTheDocument();
    expect(screen.queryByText(t.partiesError)).not.toBeInTheDocument();
  });

  it('sem o username do perfil (ainda carregando), o envio fica desativado', async () => {
    api.get.mockImplementation(async (url: string) =>
      url === '/api/parties' ? parties() : new Promise(() => {}),
    );
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountCard hasPassword={false} />);
    await screen.findByRole('button', { name: t.open });
    await waitFor(() => expect(screen.queryByText(t.partiesLoading)).not.toBeInTheDocument());
    const dialog = await openDialog(user);

    expect(within(dialog).getByRole('button', { name: t.submit })).toBeDisabled();
  });

  it('o campo de senha só aparece para quem tem senha', async () => {
    const user = userEvent.setup();
    const { unmount } = renderCard({ hasPassword: false });
    let dialog = await openDialog(user);

    expect(within(dialog).queryByLabelText(t.passwordLabel)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: t.forgotPassword })).not.toBeInTheDocument();
    unmount();

    renderCard({ hasPassword: true });
    dialog = await openDialog(user);
    expect(within(dialog).getByLabelText(t.passwordLabel)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: t.forgotPassword })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('envia o username e a senha, e mostra "confira seu e-mail"', async () => {
    const user = userEvent.setup();
    renderCard();
    const dialog = await openDialog(user);

    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'thorin');
    await user.type(within(dialog).getByLabelText(t.passwordLabel), 'segredo123');
    await user.click(within(dialog).getByRole('button', { name: t.submit }));

    expect(api.post).toHaveBeenCalledWith('/api/profile/deletion-request', {
      username: 'thorin',
      password: 'segredo123',
    });
    expect(await within(dialog).findByText(t.sentTitle)).toBeInTheDocument();
  });

  it('sem senha, envia só o username', async () => {
    const user = userEvent.setup();
    renderCard({ hasPassword: false });
    const dialog = await openDialog(user);

    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'thorin');
    await user.click(within(dialog).getByRole('button', { name: t.submit }));

    expect(api.post).toHaveBeenCalledWith('/api/profile/deletion-request', {
      username: 'thorin',
    });
  });

  it('permite pedir de novo depois de enviar', async () => {
    const user = userEvent.setup();
    renderCard({ hasPassword: false });
    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'thorin');
    await user.click(within(dialog).getByRole('button', { name: t.submit }));

    await user.click(await within(dialog).findByRole('button', { name: t.sendAgain }));
    await user.click(within(dialog).getByRole('button', { name: t.submit }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
  });

  it('senha errada aparece no campo, com o caminho para "esqueci minha senha"', async () => {
    api.post.mockRejectedValue(new APIError('account_deletion_error_password_invalid', 400));
    const user = userEvent.setup();
    renderCard();
    const dialog = await openDialog(user);

    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'thorin');
    await user.type(within(dialog).getByLabelText(t.passwordLabel), 'errada');
    await user.click(within(dialog).getByRole('button', { name: t.submit }));

    expect(
      await within(dialog).findByText(
        messages.common.errors.account_deletion_error_password_invalid,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(t.passwordLabel)).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialog).getByRole('link', { name: t.forgotPassword })).toBeInTheDocument();
    expect(within(dialog).queryByText(t.sentTitle)).not.toBeInTheDocument();
  });

  it.each([
    ['account_deletion_error_username_mismatch', 400],
    ['account_deletion_error_too_soon', 429],
    ['account_deletion_error_too_many_attempts', 429],
  ])('mostra o erro %s traduzido', async (code, status) => {
    api.post.mockRejectedValue(new APIError(code, status));
    const user = userEvent.setup();
    renderCard();
    const dialog = await openDialog(user);

    await user.type(within(dialog).getByLabelText(t.usernameLabel), 'thorin');
    await user.type(within(dialog).getByLabelText(t.passwordLabel), 'segredo123');
    await user.click(within(dialog).getByRole('button', { name: t.submit }));

    expect(
      await within(dialog).findByText(
        messages.common.errors[code as keyof typeof messages.common.errors],
      ),
    ).toBeInTheDocument();
  });
});
