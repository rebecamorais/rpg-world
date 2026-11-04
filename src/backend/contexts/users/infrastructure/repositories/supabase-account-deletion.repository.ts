import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { AccountDeletionRepo } from '../../domain/AccountDeletionRepo';

/** Service role only: the table has no grant for anyone else, and the link works without a session. */
export class SupabaseAccountDeletionRepository implements AccountDeletionRepo {
  constructor(private readonly adminClient: SupabaseClient) {}

  async save(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const { error } = await this.adminClient
      .from('account_deletion_requests')
      .upsert(
        { user_id: userId, token_hash: tokenHash, expires_at: expiresAt.toISOString() },
        { onConflict: 'user_id' },
      );

    if (error) {
      throw new Error(`Failed to save account deletion request: ${error.message}`);
    }
  }

  async findValidUserId(tokenHash: string): Promise<string | null> {
    const { data, error } = await this.adminClient
      .from('account_deletion_requests')
      .select('user_id')
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find account deletion request: ${error.message}`);
    }

    return data?.user_id ?? null;
  }

  async getUsername(userId: string): Promise<string | null> {
    const { data, error } = await this.adminClient
      .from('profile')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to read username: ${error.message}`);
    }

    return data?.username ?? null;
  }
}
