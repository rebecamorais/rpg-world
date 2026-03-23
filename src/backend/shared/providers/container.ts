import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { EmailService } from '../domain/EmailService';
import { createEmailService } from '../infrastructure/email/email-service-factory';
import { Contexts } from './contexts';

export interface ContainerRegistry {
  dbClient: SupabaseClient;
  authClient: SupabaseClient;
  emailService: EmailService;
}

export class Container {
  private dependencies: Map<keyof ContainerRegistry, unknown> = new Map();
  private _contexts: Contexts;

  constructor(authClient: SupabaseClient, dbClient: SupabaseClient) {
    this.register('dbClient', dbClient);
    this.register('authClient', authClient);
    this.register('emailService', createEmailService(authClient, dbClient));

    this._contexts = new Contexts(this);
  }

  get contexts() {
    return this._contexts;
  }

  register<K extends keyof ContainerRegistry>(name: K, dependency: ContainerRegistry[K]) {
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
