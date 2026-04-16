import { createCharacterContext } from '@backend/contexts/characters';
import { createFeedbackContext } from '@backend/contexts/feedback';
import { createLoreContext } from '@backend/contexts/lore';
import { createSpellsContext } from '@backend/contexts/spells';
import { createAuthContext, createUserProfileContext } from '@backend/contexts/users';

import type { ContainerRegistry } from './container';

export class Contexts {
  private _character: ReturnType<typeof createCharacterContext> | null = null;
  private _auth: ReturnType<typeof createAuthContext> | null = null;
  private _userProfile: ReturnType<typeof createUserProfileContext> | null = null;
  private _lore: ReturnType<typeof createLoreContext> | null = null;
  private _spells: ReturnType<typeof createSpellsContext> | null = null;
  private _feedback: ReturnType<typeof createFeedbackContext> | null = null;

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

  get auth() {
    if (!this._auth) {
      this._auth = createAuthContext({
        authClient: this.container.get('authClient'),
        dbClient: this.container.get('dbClient'),
        emailService: this.container.get('emailService'),
      });
    }
    return this._auth;
  }

  get userProfile() {
    if (!this._userProfile) {
      this._userProfile = createUserProfileContext({
        authClient: this.container.get('authClient'),
        dbClient: this.container.get('dbClient'),
        emailService: this.container.get('emailService'),
      });
    }
    return this._userProfile;
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

  get feedback() {
    if (!this._feedback) {
      this._feedback = createFeedbackContext(this.container.get('dbClient'));
    }
    return this._feedback;
  }
}
