import { CharacterSpellRepo } from '../../domain/repository/character-spell.repo';

export type ToggleSpellAction = 'learn' | 'forget' | 'prepare' | 'unprepare';

export class ToggleCharacterSpellUseCase {
  constructor(private readonly repository: CharacterSpellRepo) {}

  async execute(characterId: string, id: string, action: ToggleSpellAction): Promise<void> {
    switch (action) {
      case 'learn':
        await this.repository.learn(characterId, id);
        break;
      case 'forget':
        await this.repository.forget(characterId, id);
        break;
      case 'prepare':
        await this.repository.togglePrepared(characterId, id, true);
        break;
      case 'unprepare':
        await this.repository.togglePrepared(characterId, id, false);
        break;
      default:
        throw new Error(`Action ${action} not implemented`);
    }
  }
}
