import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import { CharacterSpellRepo } from '../../domain/repository/character-spell.repo';
import { findOwnedCharacter } from '../find-owned-character';

export type ToggleSpellAction = 'learn' | 'forget' | 'prepare' | 'unprepare';

export class ToggleCharacterSpellUseCase {
  constructor(
    private readonly characterRepository: CharacterRepo,
    private readonly spellRepository: CharacterSpellRepo,
  ) {}

  async execute(
    characterId: string,
    requesterId: string,
    spellId: string,
    action: ToggleSpellAction,
  ): Promise<void> {
    await findOwnedCharacter(this.characterRepository, characterId, requesterId, 'write');

    switch (action) {
      case 'learn':
        await this.spellRepository.learn(characterId, spellId);
        break;
      case 'forget':
        await this.spellRepository.forget(characterId, spellId);
        break;
      case 'prepare':
        await this.spellRepository.togglePrepared(characterId, spellId, true);
        break;
      case 'unprepare':
        await this.spellRepository.togglePrepared(characterId, spellId, false);
        break;
      default:
        throw new CharacterError(CharacterErrorCodes.SPELL_ACTION_INVALID);
    }
  }
}
