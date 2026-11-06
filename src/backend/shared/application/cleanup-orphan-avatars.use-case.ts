import { StorageRepository } from '../domain/StorageRepository';
import { AVATAR_BUCKET } from '../domain/avatar';

// Storage removes up to 1000 files per call; smaller batches keep each request quick
const BATCH_SIZE = 100;

/** Avatar files no profile or character uses, older than the grace period. */
export interface OrphanAvatarFinder {
  findOrphans(): Promise<string[]>;
}

/**
 * Deletes uploaded avatars that were never saved (the form was cancelled or the tab closed).
 * Replaced avatars are already deleted when the new one is saved; this catches the rest.
 */
export class CleanupOrphanAvatarsUseCase {
  constructor(
    private readonly finder: OrphanAvatarFinder,
    private readonly storage: StorageRepository,
  ) {}

  async execute(): Promise<{ removed: number }> {
    const orphans = await this.finder.findOrphans();

    for (let start = 0; start < orphans.length; start += BATCH_SIZE) {
      await this.storage.remove(AVATAR_BUCKET, orphans.slice(start, start + BATCH_SIZE));
    }

    return { removed: orphans.length };
  }
}
