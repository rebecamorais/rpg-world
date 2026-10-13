import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TurnstileService } from './turnstile-service';
import { verifyHuman } from './verify-human';

vi.mock('server-only', () => ({}));

vi.mock('./turnstile-service', () => ({
  TurnstileService: { verify: vi.fn() },
}));

const verify = vi.mocked(TurnstileService.verify);

describe('verifyHuman', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when the token is valid', async () => {
    verify.mockResolvedValue({ success: true });
    await expect(verifyHuman('good')).resolves.toBeNull();
    expect(verify).toHaveBeenCalledWith('good');
  });

  it('returns the error code from Turnstile', async () => {
    verify.mockResolvedValue({ success: false, error: 'security_token_missing' });
    await expect(verifyHuman('')).resolves.toBe('security_token_missing');
  });

  it('falls back to security_verification_failed', async () => {
    verify.mockResolvedValue({ success: false });
    await expect(verifyHuman('bad')).resolves.toBe('security_verification_failed');
  });
});
