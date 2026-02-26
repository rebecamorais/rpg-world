import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { CharacterRepo } from '@/backend/contexts/characters/domain/repository/character.repo';
import { InMemoryCharacterRepository } from '@/backend/contexts/characters/infrastructure/in-memory-character.repository';

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
    const characterRepo = new InMemoryCharacterRepository();
    this.register('characterRepo', characterRepo);
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
