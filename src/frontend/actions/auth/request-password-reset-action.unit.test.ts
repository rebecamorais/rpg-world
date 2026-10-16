import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TurnstileService } from '@backend/shared/infrastructure/services/turnstile-service';

import { requestPasswordResetAction } from './request-password-reset-action';

const requestPasswordReset = vi.fn();

vi.mock('server-only', () => ({}));

vi.mock('@api', () => ({
  getApi: async () => ({ authApi: { requestPasswordReset } }),
}));

vi.mock('@backend/shared/infrastructure/services/turnstile-service', () => ({
  TurnstileService: { verify: vi.fn() },
}));

const verify = vi.mocked(TurnstileService.verify);

describe('requestPasswordResetAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestPasswordReset.mockResolvedValue({ success: true });
  });

  it('rejects the request and sends no e-mail when the Turnstile token is invalid', async () => {
    verify.mockResolvedValue({ success: false, error: 'security_verification_failed' });

    const result = await requestPasswordResetAction('user@example.com', 'bad-token');

    expect(result).toEqual({ success: false, error: 'security_verification_failed' });
    expect(verify).toHaveBeenCalledWith('bad-token');
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects the request when the Turnstile token is missing', async () => {
    verify.mockResolvedValue({ success: false, error: 'security_token_missing' });

    const result = await requestPasswordResetAction('user@example.com', '');

    expect(result.success).toBe(false);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('sends the reset e-mail when the Turnstile token is valid', async () => {
    verify.mockResolvedValue({ success: true });

    const result = await requestPasswordResetAction('user@example.com', 'good-token');

    expect(result).toEqual({ success: true });
    expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com', expect.any(String));
  });

  it('does not verify Turnstile when the e-mail is invalid', async () => {
    const result = await requestPasswordResetAction('not-an-email', 'good-token');

    expect(result).toEqual({ success: false, error: 'common_error_invalid_request' });
    expect(verify).not.toHaveBeenCalled();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});
