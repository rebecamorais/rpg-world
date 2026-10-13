import { CharacterOwnership } from '../domain/CharacterOwnership';
import { LoreError, LoreErrorCodes } from '../domain/LoreError';

// Missing and foreign characters fail the same way, so lore never reveals that a character exists.
export async function assertCharacterOwner(
  ownership: CharacterOwnership,
  characterId: string,
  requesterId: string,
): Promise<void> {
  if (!(await ownership.isOwner(characterId, requesterId))) {
    throw new LoreError(LoreErrorCodes.CHARACTER_NOT_FOUND);
  }
}
