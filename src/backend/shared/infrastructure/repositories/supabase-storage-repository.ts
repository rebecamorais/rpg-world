import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { StorageRepository } from '../../domain/StorageRepository';
import { formatAssetUrl } from '../helpers/format-asset-url';

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

    // Return proxy URL: includes bucket as first segment so the proxy knows which bucket to download from
    // e.g. "avatars/userId/avatar" → https://images.rpgworldapp.com/avatars/userId/avatar
    return formatAssetUrl(`${bucket}/${path}`);
  }

  async download(bucket: string, path: string): Promise<{ data: Blob; contentType: string }> {
    const { data, error } = await this.adminClient.storage.from(bucket).download(path);

    if (error || !data) {
      throw new Error(`Storage download failed: ${error?.message ?? 'File not found'}`);
    }

    return { data, contentType: data.type || 'application/octet-stream' };
  }
}
