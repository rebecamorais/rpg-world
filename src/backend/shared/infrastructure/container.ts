// src/backend/shared/infrastructure/container.ts
import { InMemoryCharacterRepository } from '@/backend/contexts/characters/infrastructure/in-memory-character.repository';

import { Contexts } from './contexts';

class Container {
  private static instance: Container;
  private dependencies: Map<string, any> = new Map();
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

  register(name: string, dependency: any) {
    this.dependencies.set(name, dependency);
  }

  get<T>(name: string): T {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Dependency "${name}" not found in container.`);
    }
    return dependency as T;
  }
}

export const container = Container.getInstance();
