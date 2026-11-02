import { createCharacterContext } from '@backend/contexts/characters';
import { createCombatContext } from '@backend/contexts/combat';
import { createConditionsContext } from '@backend/contexts/conditions';
import { createFeedbackContext } from '@backend/contexts/feedback';
import { createItemsContext } from '@backend/contexts/items';
import { createLoreContext } from '@backend/contexts/lore';
import { createPartyContext } from '@backend/contexts/parties';
import { createSpellsContext } from '@backend/contexts/spells';
import { createAuthContext, createUserProfileContext } from '@backend/contexts/users';

import type { ContainerRegistry } from './container';

export class Contexts {
  private _character: ReturnType<typeof createCharacterContext> | null = null;
  private _auth: ReturnType<typeof createAuthContext> | null = null;
  private _userProfile: ReturnType<typeof createUserProfileContext> | null = null;
  private _lore: ReturnType<typeof createLoreContext> | null = null;
  private _conditions: ReturnType<typeof createConditionsContext> | null = null;
  private _items: ReturnType<typeof createItemsContext> | null = null;
  private _spells: ReturnType<typeof createSpellsContext> | null = null;
  private _feedback: ReturnType<typeof createFeedbackContext> | null = null;
  private _party: ReturnType<typeof createPartyContext> | null = null;
  private _combat: ReturnType<typeof createCombatContext> | null = null;

  constructor(
    private container: {
      get: <K extends keyof ContainerRegistry>(name: K) => ContainerRegistry[K];
    },
  ) {}

  get character() {
    if (!this._character) {
      this._character = createCharacterContext(this.container.get('userClient'), {
        partyGmAccess: this.party,
      });
    }
    return this._character;
  }

  get auth() {
    if (!this._auth) {
      this._auth = createAuthContext({
        userClient: this.container.get('userClient'),
        adminClient: this.container.get('adminClient'),
        emailService: this.container.get('emailService'),
      });
    }
    return this._auth;
  }

  get userProfile() {
    if (!this._userProfile) {
      this._userProfile = createUserProfileContext({
        userClient: this.container.get('userClient'),
      });
    }
    return this._userProfile;
  }

  get lore() {
    if (!this._lore) {
      this._lore = createLoreContext({
        dbClient: this.container.get('userClient'),
        characterOwnership: this.character,
        partyGmAccess: this.party,
      });
    }
    return this._lore;
  }

  get conditions() {
    this._conditions ??= createConditionsContext();
    return this._conditions;
  }

  get items() {
    this._items ??= createItemsContext();
    return this._items;
  }

  get spells() {
    if (!this._spells) {
      this._spells = createSpellsContext();
    }
    return this._spells;
  }

  get party() {
    if (!this._party) {
      this._party = createPartyContext(this.container.get('userClient'));
    }
    return this._party;
  }

  get combat() {
    if (!this._combat) {
      this._combat = createCombatContext(this.container.get('userClient'), this.conditions.catalog);
    }
    return this._combat;
  }

  get feedback() {
    if (!this._feedback) {
      // Feedback can be sent anonymously and the table has no RLS policies, so it uses the service role.
      this._feedback = createFeedbackContext(this.container.get('adminClient'));
    }
    return this._feedback;
  }
}
