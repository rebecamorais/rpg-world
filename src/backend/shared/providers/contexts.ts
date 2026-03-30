import { createCharacterContext } from '@backend/contexts/characters';
import { createLoreContext } from '@backend/contexts/lore';
import { createSpellsContext } from '@backend/contexts/spells';
import { createUserContext } from '@backend/contexts/users';

import type { ContainerRegistry } from './container';

export class Contexts {
  private _character: ReturnType<typeof createCharacterContext> | null = null;
  private _user: ReturnType<typeof createUserContext> | null = null;
  private _lore: ReturnType<typeof createLoreContext> | null = null;
  private _spells: ReturnType<typeof createSpellsContext> | null = null;

  constructor(
    private container: {
      get: <K extends keyof ContainerRegistry>(name: K) => ContainerRegistry[K];
    },
  ) {}

  get character() {
    if (!this._character) {
      this._character = createCharacterContext(this.container.get('dbClient'));
    }
    return this._character;
  }

  get user() {
    if (!this._user) {
      this._user = createUserContext({
        authClient: this.container.get('authClient'),
        dbClient: this.container.get('dbClient'),
        emailService: this.container.get('emailService'),
      });
    }
    return this._user;
  }

  get lore() {
    if (!this._lore) {
      this._lore = createLoreContext({
        dbClient: this.container.get('dbClient'),
      });
    }
    return this._lore;
  }

  get spells() {
    if (!this._spells) {
      this._spells = createSpellsContext(this.container.get('dbClient'));
    }
    return this._spells;
  }
}
