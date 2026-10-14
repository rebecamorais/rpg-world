import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@backend/shared/domain/AppError';
import { TurnstileService } from '@backend/shared/infrastructure/services/turnstile-service';

import { signUpAction } from './sign-up-action';

const signUp = vi.fn();

vi.mock('@api', () => ({
  getApi: async () => ({ authApi: { signUp } }),
}));

vi.mock('@backend/shared/infrastructure/services/turnstile-service', () => ({
  TurnstileService: { verify: vi.fn() },
}));

const verify = vi.mocked(TurnstileService.verify);

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = { email: 'user@example.com', password: 'longpassword', 'turnstile-token': 'tok' };

describe('signUpAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rpg.test');
    signUp.mockResolvedValue({ success: true });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('creates the account with a confirmation link back to the site', async () => {
    verify.mockResolvedValue({ success: true });

    const result = await signUpAction(form(VALID));

    expect(result).toEqual({ success: true });
    expect(verify).toHaveBeenCalledWith('tok');
    expect(signUp).toHaveBeenCalledWith(
      'user@example.com',
      'longpassword',
      'https://rpg.test/auth/confirm',
    );
  });

  it('rejects a short password before checking Turnstile', async () => {
    const result = await signUpAction(form({ ...VALID, password: 'short' }));

    expect(result).toEqual({ success: false, error: 'common_error_invalid_request' });
    expect(verify).not.toHaveBeenCalled();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('creates no account when the Turnstile token is invalid', async () => {
    verify.mockResolvedValue({ success: false, error: 'security_verification_failed' });

    const result = await signUpAction(form(VALID));

    expect(result).toEqual({ success: false, error: 'security_verification_failed' });
    expect(signUp).not.toHaveBeenCalled();
  });

  it('treats a missing Turnstile field as an empty token', async () => {
    verify.mockResolvedValue({ success: false, error: 'security_token_missing' });
    const { 'turnstile-token': _token, ...withoutToken } = VALID;

    const result = await signUpAction(form(withoutToken));

    expect(result.success).toBe(false);
    expect(signUp).not.toHaveBeenCalled();
  });

  it('returns the domain error code, e.g. duplicate e-mail', async () => {
    verify.mockResolvedValue({ success: true });
    signUp.mockRejectedValue(new AppError('auth_error_signup_duplicate_email'));

    const result = await signUpAction(form(VALID));

    expect(result).toEqual({ success: false, error: 'auth_error_signup_duplicate_email' });
  });

  it('hides unexpected error details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    verify.mockResolvedValue({ success: true });
    signUp.mockRejectedValue(new Error('smtp: connection refused'));

    const result = await signUpAction(form(VALID));

    expect(result).toEqual({ success: false, error: 'common_error_unexpected' });
  });
});
