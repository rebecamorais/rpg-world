import { CharacterContext, CharacterUpdates, CreateCharacterInput } from '../index';

export const makeCharactersApi = (characterContext: CharacterContext) => ({
  getById: async (id: string, requesterId: string) => {
    const character = await characterContext.getById(id, requesterId);
    return character.toJSON();
  },

  getByOwner: async (ownerUsername: string) => {
    const characters = await characterContext.getByOwner(ownerUsername);
    return characters.map((c) => c.toJSON());
  },

  create: async (data: CreateCharacterInput) => {
    const character = await characterContext.create(data);
    return { id: character.id };
  },

  update: async ({
    id,
    ownerUsername,
    updates,
  }: {
    id: string;
    ownerUsername: string;
    updates: CharacterUpdates;
  }) => {
    const character = await characterContext.update({
      id,
      ownerUsername,
      updates,
    });
    return { id: character.id };
  },

  delete: async (id: string, ownerUsername: string) => {
    await characterContext.delete(id, ownerUsername);
    return { deleted: true };
  },
  uploadAvatar: async (id: string, userId: string, file: Blob) => {
    return characterContext.uploadAvatar(id, userId, file);
  },
  getSpells: async (id: string, requesterId: string, locale?: string) => {
    return characterContext.getSpells(id, requesterId, locale);
  },
  toggleSpell: async (
    id: string,
    requesterId: string,
    spellId: string,
    action: 'learn' | 'forget' | 'prepare' | 'unprepare',
    locale?: string,
  ) => {
    return characterContext.toggleSpell(id, requesterId, spellId, action, locale);
  },
});
