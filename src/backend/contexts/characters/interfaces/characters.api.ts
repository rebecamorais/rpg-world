// src/backend/contexts/characters/interfaces/characters.api.ts
import { isServer } from '@api';

export const charactersApi = {
  getById: async (id: string) => {
    if (isServer) {
      const { container } =
        await import('@/backend/shared/infrastructure/container');
      const character = await container.contexts.character.getById(id);
      return character.toJSON();
    }
    return fetch(`/api/characters/${id}`).then((r) => r.json());
  },

  getByOwner: async (ownerUsername: string) => {
    if (isServer) {
      const { container } =
        await import('@/backend/shared/infrastructure/container');
      const characters =
        await container.contexts.character.getByOwner(ownerUsername);
      return characters.map((c: any) => c.toJSON());
    }
    return fetch(`/api/characters?ownerUsername=${ownerUsername}`).then((r) =>
      r.json(),
    );
  },

  create: async (data: any) => {
    if (isServer) {
      const { container } =
        await import('@/backend/shared/infrastructure/container');
      const character = await container.contexts.character.create(data);
      return { id: character.id };
    }
    return fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json());
  },

  update: async (id: string, ownerUsername: string, updates: any) => {
    if (isServer) {
      const { container } =
        await import('@/backend/shared/infrastructure/container');
      const character = await container.contexts.character.update(
        id,
        ownerUsername,
        updates,
      );
      return { id: character.id };
    }
    return fetch(`/api/characters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerUsername, updates }),
    }).then((r) => r.json());
  },

  delete: async (id: string, ownerUsername: string) => {
    if (isServer) {
      const { container } =
        await import('@/backend/shared/infrastructure/container');
      await container.contexts.character.delete(id, ownerUsername);
      return { deleted: true };
    }
    return fetch(`/api/characters/${id}?ownerUsername=${ownerUsername}`, {
      method: 'DELETE',
    }).then((r) => r.json());
  },
};
