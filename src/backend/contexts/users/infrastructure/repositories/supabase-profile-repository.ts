import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Profile } from '../../domain/Profile';
import { ProfileRepository } from '../../domain/ProfileRepository';
import { UserError, UserErrorCodes } from '../../domain/UserError';

// Postgres unique_violation; on update it can only come from profile.username
const UNIQUE_VIOLATION = '23505';

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly dbClient: SupabaseClient) {}

  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await this.dbClient
      .from('profile')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find profile: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      username: data.username ?? undefined,
      fullName: data.full_name ?? undefined,
      avatarUrl: data.avatar_url ?? undefined,
      primaryColor: data.primary_color ?? undefined,
      updatedAt: data.updated_at ?? undefined,
    };
  }

  async create(profile: Profile): Promise<void> {
    // ON CONFLICT DO NOTHING: created in the meantime (two tabs finishing the first login at
    // once) means it exists, as asked
    const { error } = await this.dbClient.from('profile').upsert(
      {
        id: profile.id,
        username: profile.username,
        full_name: profile.fullName,
        avatar_url: profile.avatarUrl,
        primary_color: profile.primaryColor,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }
  }

  async update(profile: Profile): Promise<void> {
    const { error } = await this.dbClient
      .from('profile')
      .update({
        username: profile.username,
        full_name: profile.fullName,
        avatar_url: profile.avatarUrl,
        primary_color: profile.primaryColor,
      })
      .eq('id', profile.id);

    if (error?.code === UNIQUE_VIOLATION) {
      throw new UserError(UserErrorCodes.PROFILE_USERNAME_TAKEN);
    }
    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }
}
