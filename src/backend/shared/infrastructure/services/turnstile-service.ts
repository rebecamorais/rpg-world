import 'server-only';

export interface TurnstileVerificationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export class TurnstileService {
  static async verify(token: string): Promise<{ success: boolean; error?: string }> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY is not defined');
      return { success: false, error: 'Internal configuration error' };
    }

    if (!token) {
      return { success: false, error: 'Security token is missing' };
    }

    try {
      const formData = new FormData();
      formData.append('secret', secretKey);
      formData.append('response', token);

      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        body: formData,
        method: 'POST',
      });

      const outcome: TurnstileVerificationResponse = await result.json();

      if (outcome.success) {
        return { success: true };
      }

      return {
        success: false,
        error: `Security verification failed: ${outcome['error-codes']?.join(', ') || 'Unknown error'}`,
      };
    } catch (error) {
      console.error('Turnstile verification error:', error);
      return { success: false, error: 'Network error during security verification' };
    }
  }
}
