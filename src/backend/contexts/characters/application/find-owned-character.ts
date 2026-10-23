import { CharacterError, CharacterErrorCode, CharacterErrorCodes } from '../domain/CharacterError';
import { Character } from '../domain/entity/Character';
import { CharacterRepo } from '../domain/repository';

export type CharacterAccess = 'read' | 'write';

export interface OwnershipErrorCodes {
  notFound: CharacterErrorCode;
  forbidden: CharacterErrorCode;
}

const DEFAULT_CODES: OwnershipErrorCodes = {
  notFound: CharacterErrorCodes.ACCESS_NOT_FOUND,
  forbidden: CharacterErrorCodes.ACCESS_FORBIDDEN,
};

function checkOwner(
  ownerId: string | null | undefined,
  requesterId: string,
  access: CharacterAccess,
  codes: OwnershipErrorCodes,
): void {
  if (!ownerId) {
    throw new CharacterError(codes.notFound);
  }

  if (!requesterId || ownerId !== requesterId) {
    throw new CharacterError(access === 'read' ? codes.notFound : codes.forbidden);
  }
}

/**
 * Loads a character and enforces that `requesterId` owns it. Every use case that touches a
 * character's data goes through here, so the ownership rule lives in one place.
 * Reads of someone else's character fail as "not found" to avoid revealing that it exists.
 */
export async function findOwnedCharacter(
  repository: CharacterRepo,
  id: string,
  requesterId: string,
  access: CharacterAccess,
  codes: OwnershipErrorCodes = DEFAULT_CODES,
): Promise<Character> {
  const character = await repository.findById(id);
  checkOwner(character?.ownerUsername, requesterId, access, codes);
  return character!;
}

/**
 * Same rule as findOwnedCharacter, for use cases that only need the check: reads just the owner,
 * not the whole character.
 */
export async function assertOwnsCharacter(
  repository: CharacterRepo,
  id: string,
  requesterId: string,
  access: CharacterAccess,
  codes: OwnershipErrorCodes = DEFAULT_CODES,
): Promise<void> {
  checkOwner(await repository.findOwnerId(id), requesterId, access, codes);
}
