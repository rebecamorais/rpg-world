import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TurnstileService } from './turnstile-service';

vi.mock('server-only', () => ({}));
describe('TurnstileService', () => {
  beforeEach(() => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'mock-secret');
    vi.clearAllMocks();
  });

  it('should return success true when Cloudflare returns success', async () => {
    const mockResponse = { success: true };
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await TurnstileService.verify('valid-token');

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('should return error when token is missing', async () => {
    const result = await TurnstileService.verify('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('security_token_missing');
  });

  it('should return error when Cloudflare returns failure', async () => {
    const mockResponse = { success: false, 'error-codes': ['invalid-input-response'] };
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await TurnstileService.verify('invalid-token');

    expect(result.success).toBe(false);
    expect(result.error).toContain('security_verification_failed');
    expect(result.error).toContain('invalid-input-response');
  });

  it('should handle network errors gracefully', async () => {
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await TurnstileService.verify('token');

    expect(result.success).toBe(false);
    expect(result.error).toBe('network_error_security_verification');
  });
});
