import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { AuthEmailKind, AuthEmailThrottleRepo } from '../../domain/auth-email-throttle.repo';

/** Service role only: the table and its function have no grant for anyone else. */
export class SupabaseAuthEmailThrottleRepository implements AuthEmailThrottleRepo {
  constructor(private readonly adminClient: SupabaseClient) {}

  async claim(email: string, kind: AuthEmailKind): Promise<boolean> {
    const { data, error } = await this.adminClient.rpc('claim_auth_email', {
      p_email: email,
      p_kind: kind,
    });

    if (error) {
      throw new Error(`Failed to claim auth e-mail slot: ${error.message}`);
    }

    return data === true;
  }
}
