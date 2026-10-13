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

  if (!character) {
    throw new CharacterError(codes.notFound);
  }

  if (!character.isOwnedBy(requesterId)) {
    throw new CharacterError(access === 'read' ? codes.notFound : codes.forbidden);
  }

  return character;
}
