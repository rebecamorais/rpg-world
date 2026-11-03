import { StorageRepository } from '@backend/shared/domain/StorageRepository';
import { AssetVersionGenerator, newAssetVersion } from '@backend/shared/domain/asset-version';
import {
  ALLOWED_AVATAR_TYPES,
  AVATAR_BUCKET,
  MAX_AVATAR_SIZE_BYTES,
} from '@backend/shared/domain/avatar';

import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

async function assertGm(repository: PartyRepo, partyId: string, userId: string) {
  const party = await repository.findParty(partyId);
  if (party?.gmId !== userId) throw new PartyError(PartyErrorCodes.NOT_FOUND);
}

/**
 * The GM's picture for the party, also the preview of its invite link. Uploaded and saved in one
 * step: the URL never comes from the browser, so the preview only ever shows a file of ours.
 */
export class UploadPartyImageUseCase {
  constructor(
    private readonly repository: PartyRepo,
    private readonly storage: StorageRepository,
    private readonly newVersion: AssetVersionGenerator = newAssetVersion,
  ) {}

  async execute(partyId: string, userId: string, file: Blob): Promise<string> {
    await assertGm(this.repository, partyId, userId);
    if (file.size > MAX_AVATAR_SIZE_BYTES) throw new PartyError(PartyErrorCodes.IMAGE_TOO_LARGE);
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      throw new PartyError(PartyErrorCodes.IMAGE_INVALID_TYPE);
    }

    const extension = file.type.split('/')[1];
    // In the GM's folder (the bucket's RLS); versioned because the image proxy caches each URL.
    // The previous file is left to the daily orphan cleanup.
    const path = `${userId}/parties/${partyId}-${this.newVersion()}.${extension}`;
    const url = await this.storage.upload(AVATAR_BUCKET, path, file);

    if (!(await this.repository.setImage(partyId, url))) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }
    return url;
  }
}

export class RemovePartyImageUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, userId: string): Promise<void> {
    await assertGm(this.repository, partyId, userId);
    if (!(await this.repository.setImage(partyId, null))) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }
  }
}

/** Name and picture of the party behind an invite code; null when the code doesn't exist. */
export class GetInviteCardUseCase {
  constructor(private readonly repository: PartyRepo) {}

  execute(code: string) {
    return this.repository.inviteCard(code);
  }
}
