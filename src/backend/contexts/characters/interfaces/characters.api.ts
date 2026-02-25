import {
  CharacterUpdates,
  CreateCharacterInput,
  ICharacterService,
} from '../index';

export const makeCharactersApi = (characterService: ICharacterService) => ({
  getById: async (id: string) => {
    const character = await characterService.getById(id);
    if (!character) throw new Error('Não encontrado.');
    return character.toJSON();
  },

  getByOwner: async (ownerUsername: string) => {
    const characters = await characterService.getByOwner(ownerUsername);
    return characters.map((c) => c.toJSON());
  },

  create: async (data: CreateCharacterInput) => {
    const character = await characterService.create(data);
    return { id: character.id };
  },

  update: async (
    id: string,
    ownerUsername: string,
    updates: CharacterUpdates,
  ) => {
    const character = await characterService.update(id, ownerUsername, updates);
    return { id: character.id };
  },

  delete: async (id: string, ownerUsername: string) => {
    await characterService.delete(id, ownerUsername);
    return { deleted: true };
  },
});
