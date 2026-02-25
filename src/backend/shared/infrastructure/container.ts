// src/backend/shared/infrastructure/container.ts
import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { CharacterRepo } from '@/backend/contexts/characters/domain/repository/character.repo';
import { InMemoryCharacterRepository } from '@/backend/contexts/characters/infrastructure/in-memory-character.repository';

import { Contexts } from './contexts';

export interface ContainerRegistry {
  characterRepo: CharacterRepo;
  dbClient: SupabaseClient;
  authClient: SupabaseClient;
}

class Container {
  private static instance: Container;
  private dependencies: Map<keyof ContainerRegistry, unknown> = new Map();
  private _contexts: Contexts;

  private constructor() {
    const characterRepo = new InMemoryCharacterRepository();
    this.register('characterRepo', characterRepo);

    const dbClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    this.register('dbClient', dbClient);

    const authClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Mesmo client porem somente para validar usuários
    );

    this.register('authClient', authClient);

    this._contexts = new Contexts(this);
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
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

export const container = Container.getInstance();
