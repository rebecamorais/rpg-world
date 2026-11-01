import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';

/** Copies one of the owner's sheets (e.g. a goblin boss from the goblin). Who may is up to RLS. */
export class DuplicateCharacterUseCase {
  constructor(private readonly repository: CharacterRepo) {}

  async execute(characterId: string, name: string): Promise<{ id: string }> {
    const trimmed = name.trim();
    if (!trimmed) throw new CharacterError(CharacterErrorCodes.CREATE_NAME_REQUIRED);
    return { id: await this.repository.duplicate(characterId, trimmed) };
  }
}
