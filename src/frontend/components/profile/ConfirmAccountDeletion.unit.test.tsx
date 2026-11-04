import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError, rpgWorldApi } from '@client';

import { ConfirmAccountDeletion } from './ConfirmAccountDeletion';

const assign = vi.fn();
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { post: vi.fn() },
}));

const api = vi.mocked(rpgWorldApi);
const t = messages.accountDeletion.confirm;

describe('ConfirmAccountDeletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', { ...window.location, assign });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('mostra o username e o botão', () => {
    renderWithProviders(<ConfirmAccountDeletion account={{ username: 'thorin' }} token="tok" />);

    expect(screen.getByRole('heading', { name: t.title })).toBeInTheDocument();
    expect(screen.getByText('thorin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.button })).toBeInTheDocument();
  });

  it('sem username escolhido, mostra o texto sem nome', () => {
    renderWithProviders(<ConfirmAccountDeletion account={{ username: null }} token="tok" />);

    expect(screen.getByText(t.descriptionNoName)).toBeInTheDocument();
  });

  it('link inválido ou vencido (null) mostra o aviso e o caminho para pedir outro', () => {
    renderWithProviders(<ConfirmAccountDeletion account={null} token="tok" />);

    expect(screen.getByRole('heading', { name: t.invalidTitle })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.button })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.backToSettings })).toHaveAttribute(
      'href',
      '/settings/profile',
    );
  });

  it('o clique chama a rota e carrega a página inicial por inteiro com o aviso accountDeleted', async () => {
    api.post.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<ConfirmAccountDeletion account={{ username: 'thorin' }} token="tok" />);

    await user.click(screen.getByRole('button', { name: t.button }));

    expect(api.post).toHaveBeenCalledWith('/api/account/delete', { token: 'tok' });
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith('/?accountDeleted=1'));
  });

  it('link que valeu até abrir a página mas não vale mais: mostra o erro e não sai da página', async () => {
    api.post.mockRejectedValue(new APIError('account_deletion_error_link_invalid', 400));
    const user = userEvent.setup();
    renderWithProviders(<ConfirmAccountDeletion account={{ username: 'thorin' }} token="tok" />);

    await user.click(screen.getByRole('button', { name: t.button }));

    expect(
      await screen.findByText(messages.common.errors.account_deletion_error_link_invalid),
    ).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });
});
