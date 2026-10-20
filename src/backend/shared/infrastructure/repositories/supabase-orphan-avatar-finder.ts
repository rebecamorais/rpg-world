import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Database } from '@lib/types/database';

import { OrphanAvatarFinder } from '../../application/cleanup-orphan-avatars.use-case';

/** Needs the service role: `orphan_avatar_objects` lists files of every user. */
export class SupabaseOrphanAvatarFinder implements OrphanAvatarFinder {
  constructor(
    private readonly adminClient: SupabaseClient<Database>,
    // Uploads younger than this may still be waiting for their form to be saved
    private readonly minAge = '1 day',
  ) {}

  async findOrphans(): Promise<string[]> {
    const { data, error } = await this.adminClient.rpc('orphan_avatar_objects', {
      min_age: this.minAge,
    });

    if (error) {
      throw new Error(`Failed to list orphan avatars: ${error.message}`);
    }

    return data ?? [];
  }
}
