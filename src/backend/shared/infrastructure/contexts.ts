// src/backend/shared/infrastructure/contexts.ts
import { createCharacterContext } from '@/backend/contexts/characters';
import { CharacterRepo } from '@/backend/contexts/characters/domain/repository/character.repo';

export class Contexts {
  private _character: ReturnType<typeof createCharacterContext> | null = null;

  constructor(private container: { get: <T>(name: string) => T }) {}

  get character() {
    if (!this._character) {
      const repo = this.container.get<CharacterRepo>('characterRepo');
      this._character = createCharacterContext(repo);
    }
    return this._character;
  }
}
