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
      this._character = createCharacterContext();
    }
    return this._character;
  }
}
