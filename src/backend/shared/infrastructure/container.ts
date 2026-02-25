// src/backend/shared/infrastructure/container.ts
import { CharacterRepo } from '@/backend/contexts/characters/domain/repository/character.repo';
import { InMemoryCharacterRepository } from '@/backend/contexts/characters/infrastructure/in-memory-character.repository';

import { Contexts } from './contexts';

export interface ContainerRegistry {
  characterRepo: CharacterRepo;
}

class Container {
  private static instance: Container;
  private dependencies: Map<keyof ContainerRegistry, unknown> = new Map();
  private _contexts: Contexts;

  private constructor() {
    // Eagerly initialize core dependencies
    const characterRepo = new InMemoryCharacterRepository();
    this.register('characterRepo', characterRepo);

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
