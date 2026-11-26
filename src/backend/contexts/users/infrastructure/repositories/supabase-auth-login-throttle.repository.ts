import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import 'server-only';

import { AuthLoginThrottleRepo, LoginAttemptKeys } from '../../domain/auth-login-throttle.repo';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Only hashes reach the database: the table never holds an e-mail or an IP as text. */
function hashedKeys({ email, ip }: LoginAttemptKeys) {
  return {
    p_email_hash: sha256(email.trim().toLowerCase()),
    p_ip_hash: ip ? sha256(ip.trim().toLowerCase()) : null,
  };
}

/** Service role only: the table and its functions have no grant for anyone else. */
export class SupabaseAuthLoginThrottleRepository implements AuthLoginThrottleRepo {
  constructor(private readonly adminClient: SupabaseClient) {}

  async claim(keys: LoginAttemptKeys): Promise<number> {
    const { data, error } = await this.adminClient.rpc('claim_login_attempt', hashedKeys(keys));

    if (error || typeof data !== 'number') {
      throw new Error(`Failed to claim login attempt: ${error?.message ?? 'no answer'}`);
    }

    return data;
  }

  release(keys: LoginAttemptKeys): Promise<void> {
    return this.finish(keys, false);
  }

  succeed(keys: LoginAttemptKeys): Promise<void> {
    return this.finish(keys, true);
  }

  private async finish(keys: LoginAttemptKeys, success: boolean): Promise<void> {
    const { error } = await this.adminClient.rpc('finish_login_attempt', {
      ...hashedKeys(keys),
      p_success: success,
    });

    if (error) {
      throw new Error(`Failed to finish login attempt: ${error.message}`);
    }
  }
}
