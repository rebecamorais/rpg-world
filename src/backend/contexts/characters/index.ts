import { SupabaseClient } from '@supabase/supabase-js';

import { getSpellCatalog } from '@backend/contexts/spells';
import { PartyGmAccess } from '@backend/shared/domain/PartyGmAccess';

import { SupabaseStorageRepository } from '../../shared/infrastructure/repositories/supabase-storage-repository';
import {
  CharacterContext,
  CharacterUpdates,
  CreateCharacterInput,
} from './application/CharacterContext';
import { CreateCharacterUseCase } from './application/create-character/create-character.use-case';
import { DeleteCharacterUseCase } from './application/delete-character/delete-character.use-case';
import { GetCharactersByOwnerUseCase } from './application/get-characters/get-characters-by-owner.use-case';
import { GetCharacterUseCase } from './application/get-characters/get-characters.use-case';
import { GetPartyCharacterSpellsUseCase } from './application/party-gm/get-party-character-spells.use-case';
import { GetPartyCharacterUseCase } from './application/party-gm/get-party-character.use-case';
import { GetCharacterSpellsUseCase } from './application/spells/get-character-spells.use-case';
import { ToggleCharacterSpellUseCase } from './application/spells/toggle-character-spell.use-case';
import { UpdateCharacterUseCase } from './application/update-character/update-character.use-case';
import { UploadCharacterAvatarUseCase } from './application/upload-avatar/upload-character-avatar.use-case';
import { SupabaseCharacterSpellRepository } from './infrastructure/repositories/supabase-character-spell.repository';
import { SupabaseCharacterRepository } from './infrastructure/repositories/supabase-character.repository';

export type { CharacterContext, CharacterUpdates, CreateCharacterInput };

export const createCharacterContext = (
  dbClient: SupabaseClient,
  { partyGmAccess }: { partyGmAccess: PartyGmAccess },
): CharacterContext => {
  const repository = new SupabaseCharacterRepository(dbClient);
  const spellRepository = new SupabaseCharacterSpellRepository(dbClient);
  const storageRepository = new SupabaseStorageRepository(dbClient);

  const getCharacterUseCase = new GetCharacterUseCase(repository);
  const getCharactersByOwnerUseCase = new GetCharactersByOwnerUseCase(repository);
  const createCharacterUseCase = new CreateCharacterUseCase(repository);
  const updateCharacterUseCase = new UpdateCharacterUseCase(repository, storageRepository);
  const deleteCharacterUseCase = new DeleteCharacterUseCase(repository, storageRepository);

  const spellCatalog = getSpellCatalog();
  const getCharacterSpellsUseCase = new GetCharacterSpellsUseCase(
    repository,
    spellRepository,
    spellCatalog,
  );
  const toggleCharacterSpellUseCase = new ToggleCharacterSpellUseCase(
    repository,
    spellRepository,
    spellCatalog,
  );

  const getPartyCharacterUseCase = new GetPartyCharacterUseCase(repository, partyGmAccess);
  const getPartyCharacterSpellsUseCase = new GetPartyCharacterSpellsUseCase(
    spellRepository,
    spellCatalog,
    partyGmAccess,
  );

  return {
    getById: getCharacterUseCase.execute.bind(getCharacterUseCase),
    getByOwner: getCharactersByOwnerUseCase.execute.bind(getCharactersByOwnerUseCase),
    create: createCharacterUseCase.execute.bind(createCharacterUseCase),
    update: updateCharacterUseCase.execute.bind(updateCharacterUseCase),
    delete: deleteCharacterUseCase.execute.bind(deleteCharacterUseCase),
    isOwner: async (id: string, userId: string) =>
      Boolean(userId) && (await repository.findOwnerId(id)) === userId,
    getSpells: getCharacterSpellsUseCase.execute.bind(getCharacterSpellsUseCase),
    toggleSpell: toggleCharacterSpellUseCase.execute.bind(toggleCharacterSpellUseCase),
    getForPartyGm: getPartyCharacterUseCase.execute.bind(getPartyCharacterUseCase),
    getSpellsForPartyGm: getPartyCharacterSpellsUseCase.execute.bind(
      getPartyCharacterSpellsUseCase,
    ),
    uploadAvatar: async (id: string, userId: string, file: Blob) => {
      const useCase = new UploadCharacterAvatarUseCase(storageRepository, repository);
      return useCase.execute(id, userId, file);
    },
  };
};
