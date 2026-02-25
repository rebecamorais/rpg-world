// src/backend/contexts/characters/interfaces/characters.api.ts

export const charactersApi = {
  getById: async (id: string) => {
    const { container } =
      await import('@/backend/shared/infrastructure/container');
    const character = await container.contexts.character.getById(id);
    return character.toJSON();
  },

  getByOwner: async (ownerUsername: string) => {
    const { container } =
      await import('@/backend/shared/infrastructure/container');
    const characters =
      await container.contexts.character.getByOwner(ownerUsername);
    return characters.map((c: any) => c.toJSON());
  },

  create: async (data: any) => {
    const { container } =
      await import('@/backend/shared/infrastructure/container');
    const character = await container.contexts.character.create(data);
    return { id: character.id };
  },

  update: async (id: string, ownerUsername: string, updates: any) => {
    const { container } =
      await import('@/backend/shared/infrastructure/container');
    const character = await container.contexts.character.update(
      id,
      ownerUsername,
      updates,
    );
    return { id: character.id };
  },

  delete: async (id: string, ownerUsername: string) => {
    const { container } =
      await import('@/backend/shared/infrastructure/container');
    await container.contexts.character.delete(id, ownerUsername);
    return { deleted: true };
  },
};
