import { avatarPathOf, isFullImageCandidate } from '@shared/avatar-files';

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
    const found = await this.finder.findOrphans();
    const listed = new Set(found);
    // Nothing in the database names a whole image, so it is always listed. It goes only with its
    // avatar: an avatar that isn't listed is in use. When in doubt, the file stays.
    const orphans = found.filter(
      (path) => !isFullImageCandidate(path) || listed.has(avatarPathOf(path)),
    );

    for (let start = 0; start < orphans.length; start += BATCH_SIZE) {
      await this.storage.remove(AVATAR_BUCKET, orphans.slice(start, start + BATCH_SIZE));
    }

    return { removed: orphans.length };
  }
}
