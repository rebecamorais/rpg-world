import 'server-only';

export interface TurnstileVerificationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export class TurnstileService {
  static async verify(token: string): Promise<{ success: boolean; error?: string }> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
    if (!secretKey) {
      return { success: false, error: 'internal_configuration_error' };
    }

    if (!token) {
      return { success: false, error: 'security_token_missing' };
    }

    try {
      // Special handling for Turnstile "Always Pass" keys in Development/Test
      const isTestSecret = secretKey === '1x00000000000000000000000000000000';
      if (isTestSecret && process.env.NODE_ENV !== 'production') {
        return { success: true };
      }

      const params = new URLSearchParams();
      params.append('secret', secretKey);
      params.append('response', token);

      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const outcome: TurnstileVerificationResponse = await result.json();

      if (outcome.success) {
        return { success: true };
      }

      const errorCodes = outcome['error-codes']?.join(', ') || 'Unknown error';

      return {
        success: false,
        error: `security_verification_failed: ${errorCodes}`,
      };
    } catch (error) {
      return { success: false, error: 'network_error_security_verification' };
    }
  }
}
