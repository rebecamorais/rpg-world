import { container } from '@/backend/shared/infrastructure/container';

export const charactersApi = {
  getById: async (id: string) => {
    const character = await container.contexts.character.getById(id);
    return character.toJSON();
  },

  getByOwner: async (ownerUsername: string) => {
    const characters =
      await container.contexts.character.getByOwner(ownerUsername);
    return characters.map((c: { toJSON: () => unknown }) => c.toJSON());
  },

  create: async (data: {
    id?: string;
    name: string;
    ownerUsername: string;
    system?: string;
    class?: string;
    characterClass?: string;
    race: string;
    level?: number;
  }) => {
    const character = await container.contexts.character.create(data);
    return { id: character.id };
  },

  update: async (
    id: string,
    ownerUsername: string,
    updates: Record<string, unknown>,
  ) => {
    const character = await container.contexts.character.update(
      id,
      ownerUsername,
      updates,
    );
    return { id: character.id };
  },

  delete: async (id: string, ownerUsername: string) => {
    await container.contexts.character.delete(id, ownerUsername);
    return { deleted: true };
  },
};
