import { createCharacterContext } from '@/backend/contexts/characters';
import { createUserContext } from '@/backend/contexts/users';

import type { ContainerRegistry } from './container';

export class Contexts {
  private _character: ReturnType<typeof createCharacterContext> | null = null;
  private _user: ReturnType<typeof createUserContext> | null = null;

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

  get user() {
    if (!this._user) {
      this._user = createUserContext({
        authClient: this.container.get('authClient'),
      });
    }
    return this._user;
  }
}
