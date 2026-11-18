import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { useAuth } from './useAuth';

vi.mock('@client', () => ({ rpgWorldApi: { post: vi.fn() } }));

describe('useAuth.updatePassword', () => {
  const location = { href: '' };

  beforeEach(() => {
    vi.mocked(rpgWorldApi.post).mockResolvedValue(undefined);
    vi.stubGlobal('window', { location });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('manda a senha atual e volta ao perfil levando o aviso pela URL', async () => {
    await useAuth().updatePassword('new-secret', 'old-secret');

    expect(rpgWorldApi.post).toHaveBeenCalledWith('/api/auth/update-password', {
      newPassword: 'new-secret',
      currentPassword: 'old-secret',
    });
    // The reload drops any toast: the profile reads the flag and says it changed
    expect(location.href).toBe('/settings/profile?passwordChanged=1');
  });
});
