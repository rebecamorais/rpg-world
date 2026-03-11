import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Profile } from '../../domain/Profile';
import { ProfileRepository } from '../../domain/ProfileRepository';

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly dbClient: SupabaseClient) {}

  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await this.dbClient.from('profile').select('*').eq('id', id).single();

    if (error || !data) {
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

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }
}
