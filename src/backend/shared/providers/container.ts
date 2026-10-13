import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { EmailService } from '../domain/EmailService';
import { createEmailService } from '../infrastructure/email/email-service-factory';
import { Contexts } from './contexts';

export interface ContainerRegistry {
  // Acts as the signed-in user (cookie session): data access goes through RLS.
  userClient: SupabaseClient;
  // Service role, bypasses RLS: only for operations no user may perform (auth admin, feedback).
  adminClient: SupabaseClient;
  emailService: EmailService;
}

export class Container {
  private dependencies: Map<keyof ContainerRegistry, unknown> = new Map();
  private _contexts: Contexts;

  constructor(userClient: SupabaseClient, adminClient: SupabaseClient) {
    this.register('userClient', userClient);
    this.register('adminClient', adminClient);
    this.register('emailService', createEmailService());

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
