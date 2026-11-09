import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TurnstileService } from './turnstile-service';

vi.mock('server-only', () => ({}));
describe('TurnstileService', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
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
    expect(result.error).toBe('security_verification_failed');
  });

  it('should handle network errors gracefully', async () => {
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await TurnstileService.verify('token');

    expect(result.success).toBe(false);
    expect(result.error).toBe('network_error_security_verification');
  });

  it('desiste depois de 5 s em vez de prender o formulário', async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ success: true }) });

    await TurnstileService.verify('token');

    const { signal } = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit;
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  // Cloudflare answers success to its always-pass test secret whatever the token: asking it over
  // the network only adds a way to fail (the e2e suite runs the production build with this secret)
  it('o segredo de teste "sempre passa" da Cloudflare passa sem ir à rede, também em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA');
    global.fetch = vi.fn();

    const result = await TurnstileService.verify('token');

    expect(result).toEqual({ success: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // Not one of Cloudflare's: Cloudflare refuses it, so in production it must not pass
  it('o segredo falso local só passa fora de produção', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '1x00000000000000000000000000000000');
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, 'error-codes': ['invalid-input-secret'] }),
    });
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});

    const result = await TurnstileService.verify('token');

    expect(result.success).toBe(false);
    expect(global.fetch).toHaveBeenCalled();
  });

  // A test secret on the real production deploy lets everyone through: refuse it loudly instead
  it.each(['1x0000000000000000000000000000000AA', '1x00000000000000000000000000000000'])(
    'no deploy de produção, um segredo de teste (%s) é recusado',
    async (secret) => {
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('TURNSTILE_SECRET_KEY', secret);
      global.fetch = vi.fn();
      const logged = vi.spyOn(console, 'error').mockImplementationOnce(() => {});

      const result = await TurnstileService.verify('token');

      expect(result).toEqual({ success: false, error: 'internal_configuration_error' });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(logged).toHaveBeenCalled();
    },
  );

  it('em preview, o segredo de teste continua passando', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA');

    expect(await TurnstileService.verify('token')).toEqual({ success: true });
  });
});
