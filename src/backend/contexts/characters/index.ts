import { GetCharacterUseCase } from './application';
import {
  CreateCharacterInput,
  CreateCharacterUseCase,
} from './application/create-character/create-character.use-case';
import { DeleteCharacterUseCase } from './application/delete-character/delete-character.use-case';
import { GetCharactersByOwnerUseCase } from './application/get-characters/get-characters-by-owner.use-case';
import {
  CharacterUpdates,
  UpdateCharacterUseCase,
} from './application/update-character/update-character.use-case';
import { CharacterService } from './domain/CharacterService';
import { CharacterRepo } from './domain/repository/character.repo';
import { InMemoryCharacterRepository } from './infrastructure/in-memory-character.repository';

export type { CharacterUpdates, CreateCharacterInput, CharacterService };

export const createCharacterContext = (): CharacterService => {
  const repository: CharacterRepo = new InMemoryCharacterRepository();

  const getCharacterUseCase = new GetCharacterUseCase(repository);
  const getCharactersByOwnerUseCase = new GetCharactersByOwnerUseCase(
    repository,
  );
  const createCharacterUseCase = new CreateCharacterUseCase(repository);
  const updateCharacterUseCase = new UpdateCharacterUseCase(repository);
  const deleteCharacterUseCase = new DeleteCharacterUseCase(repository);

  return {
    getById: getCharacterUseCase.execute.bind(getCharacterUseCase),
    getByOwner: getCharactersByOwnerUseCase.execute.bind(
      getCharactersByOwnerUseCase,
    ),
    create: createCharacterUseCase.execute.bind(createCharacterUseCase),
    update: updateCharacterUseCase.execute.bind(updateCharacterUseCase),
    delete: deleteCharacterUseCase.execute.bind(deleteCharacterUseCase),
  };
};
