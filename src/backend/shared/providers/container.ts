import { CharacterRepo } from '@backend/contexts/characters/domain/repository/character.repo';
import { SupabaseCharacterRepository } from '@backend/contexts/characters/infrastructure/repositories/supabase-character.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Contexts } from './contexts';

export interface ContainerRegistry {
  characterRepo: CharacterRepo;
  dbClient: SupabaseClient;
  authClient: SupabaseClient;
}

export class Container {
  private dependencies: Map<keyof ContainerRegistry, unknown> = new Map();
  private _contexts: Contexts;

  constructor(authClient: SupabaseClient, dbClient: SupabaseClient) {
    this.register('dbClient', dbClient);
    this.register('authClient', authClient);

    this._contexts = new Contexts(this);
  }

  get contexts() {
    return this._contexts;
  }

  register<K extends keyof ContainerRegistry>(
    name: K,
    dependency: ContainerRegistry[K],
  ) {
    this.dependencies.set(name, dependency);
  }

  get<K extends keyof ContainerRegistry>(name: K): ContainerRegistry[K] {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Dependency "${name as string}" not found in container.`);
    }
    return dependency as ContainerRegistry[K];
  }
}
