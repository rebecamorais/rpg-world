import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TurnstileService } from '@backend/shared/infrastructure/services/turnstile-service';

import { requestMagicLinkAction } from './request-magic-link-action';

const signInWithMagicLink = vi.fn();

vi.mock('server-only', () => ({}));

vi.mock('@api', () => ({
  getApi: async () => ({ authApi: { signInWithMagicLink } }),
}));

vi.mock('@backend/shared/infrastructure/services/turnstile-service', () => ({
  TurnstileService: { verify: vi.fn() },
}));

const verify = vi.mocked(TurnstileService.verify);

describe('requestMagicLinkAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rpg.test');
    signInWithMagicLink.mockResolvedValue(undefined);
  });

  it('não envia nada quando o token do Turnstile é inválido', async () => {
    verify.mockResolvedValue({ success: false, error: 'security_verification_failed' });

    const result = await requestMagicLinkAction('user@example.com', 'bad-token');

    expect(result).toEqual({ success: false, error: 'security_verification_failed' });
    expect(signInWithMagicLink).not.toHaveBeenCalled();
  });

  it('envia o link apontando para a rota de confirmação quando o token é válido', async () => {
    verify.mockResolvedValue({ success: true });

    const result = await requestMagicLinkAction('user@example.com', 'good-token');

    expect(result).toEqual({ success: true });
    expect(signInWithMagicLink).toHaveBeenCalledWith(
      'user@example.com',
      'https://rpg.test/api/auth/confirm',
    );
  });

  it('não verifica o Turnstile quando o e-mail é inválido', async () => {
    const result = await requestMagicLinkAction('not-an-email', 'good-token');

    expect(result).toEqual({ success: false, error: 'common_error_invalid_request' });
    expect(verify).not.toHaveBeenCalled();
    expect(signInWithMagicLink).not.toHaveBeenCalled();
  });
});
