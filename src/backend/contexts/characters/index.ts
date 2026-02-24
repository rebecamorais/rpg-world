// src/backend/contexts/characters/index.ts
import { GetCharacterUseCase } from './application';
import { CreateCharacterUseCase } from './application/create-character/create-character.use-case';
import { DeleteCharacterUseCase } from './application/delete-character/delete-character.use-case';
import { GetCharactersByOwnerUseCase } from './application/get-characters/get-characters-by-owner.use-case';
import { UpdateCharacterUseCase } from './application/update-character/update-character.use-case';
import { CharacterRepo } from './domain/repository/character.repo';

export const createCharacterContext = (repository: CharacterRepo) => {
  const getCharacterUseCase = new GetCharacterUseCase(repository);
  const getCharactersByOwnerUseCase = new GetCharactersByOwnerUseCase(
    repository,
  );
  const createCharacterUseCase = new CreateCharacterUseCase(repository);
  const updateCharacterUseCase = new UpdateCharacterUseCase(repository);
  const deleteCharacterUseCase = new DeleteCharacterUseCase(repository);

  return {
    getById: (id: string) => getCharacterUseCase.execute(id),
    getByOwner: (ownerUsername: string) =>
      getCharactersByOwnerUseCase.execute(ownerUsername),
    create: (data: any) =>
      createCharacterUseCase.execute({
        id: data.id || crypto.randomUUID(),
        name: data.name,
        ownerUsername: data.ownerUsername,
        system: data.system || 'DnD_5e',
        characterClass: data.class || data.characterClass,
        race: data.race,
        level: data.level || 1,
      }),
    update: (id: string, ownerUsername: string, updates: any) =>
      updateCharacterUseCase.execute({ id, ownerUsername, updates }),
    delete: (id: string, ownerUsername: string) =>
      deleteCharacterUseCase.execute(id, ownerUsername),
  };
};
