import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { StorageRepository } from '../../domain/StorageRepository';

export class SupabaseStorageRepository implements StorageRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  async upload(bucket: string, path: string, file: Blob): Promise<string> {
    const { error } = await this.adminClient.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data } = this.adminClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
