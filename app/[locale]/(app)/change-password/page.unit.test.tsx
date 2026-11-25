import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChangePasswordPage from './page';

const getSessionUser = vi.fn();
const hasPassword = vi.fn();
const getLocale = vi.fn();

vi.mock('@api', () => ({ getApi: async () => ({ authApi: { getSessionUser, hasPassword } }) }));
vi.mock('next-intl/server', () => ({ getLocale: () => getLocale() }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getLocale.mockResolvedValue('en');
  });

  it('sem sessão, manda para o login e volta para cá depois', async () => {
    getSessionUser.mockResolvedValue(null);

    await expect(ChangePasswordPage()).rejects.toThrow('redirect:/login?next=%2Fchange-password');
    expect(hasPassword).not.toHaveBeenCalled();
  });

  it('sem sessão em português, vai direto para o login em português', async () => {
    getSessionUser.mockResolvedValue(null);
    getLocale.mockResolvedValue('pt');

    await expect(ChangePasswordPage()).rejects.toThrow(
      'redirect:/pt/login?next=%2Fchange-password',
    );
  });

  it('com senha, mostra o form que pede a senha atual', async () => {
    getSessionUser.mockResolvedValue({ id: 'user-1', email: 'hero@example.com' });
    hasPassword.mockResolvedValue(true);

    const page = await ChangePasswordPage();

    expect(page.props.hasPassword).toBe(true);
  });

  it('sem senha (só Google), cria a senha pelo e-mail: vai para o esqueci a senha', async () => {
    getSessionUser.mockResolvedValue({ id: 'user-1', email: 'hero@example.com' });
    hasPassword.mockResolvedValue(false);

    await expect(ChangePasswordPage()).rejects.toThrow('redirect:/forgot-password');
  });
});
