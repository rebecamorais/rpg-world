import 'server-only';

import { TurnstileService } from './turnstile-service';

/**
 * Checks the Turnstile token sent by a form. Returns the error code to send back to the client,
 * or `null` when the request comes from a human and the action may proceed.
 */
export async function verifyHuman(turnstileToken: string): Promise<string | null> {
  const result = await TurnstileService.verify(turnstileToken);
  return result.success ? null : result.error || 'security_verification_failed';
}
