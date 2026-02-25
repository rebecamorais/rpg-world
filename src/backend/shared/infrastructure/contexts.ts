// src/backend/shared/infrastructure/contexts.ts
import { createCharacterContext } from '@/backend/contexts/characters';

import type { ContainerRegistry } from './container';

export class Contexts {
  private _character: ReturnType<typeof createCharacterContext> | null = null;

  constructor(
    private container: {
      get: <K extends keyof ContainerRegistry>(name: K) => ContainerRegistry[K];
    },
  ) {}

  get character() {
    if (!this._character) {
      const repo = this.container.get('characterRepo');
      this._character = createCharacterContext(repo);
    }
    return this._character;
  }
}
