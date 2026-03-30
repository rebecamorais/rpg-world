import { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseStorageRepository } from '../../shared/infrastructure/repositories/supabase-storage-repository';
import { CreateCharacterUseCase } from './application/create-character/create-character.use-case';
import { DeleteCharacterUseCase } from './application/delete-character/delete-character.use-case';
import { GetCharactersByOwnerUseCase } from './application/get-characters/get-characters-by-owner.use-case';
import { GetCharacterUseCase } from './application/get-characters/get-characters.use-case';
import { GetCharacterSpellsUseCase } from './application/spells/get-character-spells.use-case';
import { ToggleCharacterSpellUseCase } from './application/spells/toggle-character-spell.use-case';
import { UpdateCharacterUseCase } from './application/update-character/update-character.use-case';
import { UploadCharacterAvatarUseCase } from './application/use-cases/UploadCharacterAvatarUseCase';
import {
  CharacterContext,
  CharacterUpdates,
  CreateCharacterInput,
} from './domain/CharacterContext';
import { SupabaseCharacterSpellRepository } from './infrastructure/repositories/supabase-character-spell.repository';
import { SupabaseCharacterRepository } from './infrastructure/repositories/supabase-character.repository';

export type { CharacterContext, CharacterUpdates, CreateCharacterInput };

export const createCharacterContext = (dbClient: SupabaseClient): CharacterContext => {
  const repository = new SupabaseCharacterRepository(dbClient);
  const spellRepository = new SupabaseCharacterSpellRepository(dbClient);

  const getCharacterUseCase = new GetCharacterUseCase(repository);
  const getCharactersByOwnerUseCase = new GetCharactersByOwnerUseCase(repository);
  const createCharacterUseCase = new CreateCharacterUseCase(repository);
  const updateCharacterUseCase = new UpdateCharacterUseCase(repository);
  const deleteCharacterUseCase = new DeleteCharacterUseCase(repository);

  const getCharacterSpellsUseCase = new GetCharacterSpellsUseCase(spellRepository);
  const toggleCharacterSpellUseCase = new ToggleCharacterSpellUseCase(spellRepository);

  return {
    getById: getCharacterUseCase.execute.bind(getCharacterUseCase),
    getByOwner: getCharactersByOwnerUseCase.execute.bind(getCharactersByOwnerUseCase),
    create: createCharacterUseCase.execute.bind(createCharacterUseCase),
    update: updateCharacterUseCase.execute.bind(updateCharacterUseCase),
    delete: deleteCharacterUseCase.execute.bind(deleteCharacterUseCase),
    getSpells: getCharacterSpellsUseCase.execute.bind(getCharacterSpellsUseCase),
    toggleSpell: toggleCharacterSpellUseCase.execute.bind(toggleCharacterSpellUseCase),
    uploadAvatar: async (id: string, userId: string, file: Blob) => {
      const storageRepository = new SupabaseStorageRepository(dbClient);
      const useCase = new UploadCharacterAvatarUseCase(storageRepository, repository);
      return useCase.execute(id, userId, file);
    },
  };
};
