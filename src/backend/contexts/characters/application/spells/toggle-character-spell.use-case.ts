import { CharacterSpellRepo } from '../../domain/repository/character-spell.repo';

export type ToggleSpellAction = 'learn' | 'forget' | 'prepare' | 'unprepare';

export class ToggleCharacterSpellUseCase {
  constructor(private readonly repository: CharacterSpellRepo) {}

  async execute(characterId: string, spellId: string, action: ToggleSpellAction): Promise<void> {
    switch (action) {
      case 'learn':
        await this.repository.learn(characterId, spellId);
        break;
      case 'forget':
        await this.repository.forget(characterId, spellId);
        break;
      case 'prepare':
        await this.repository.togglePrepared(characterId, spellId, true);
        break;
      case 'unprepare':
        await this.repository.togglePrepared(characterId, spellId, false);
        break;
      default:
        throw new Error(`Action ${action} not implemented`);
    }
  }
}
