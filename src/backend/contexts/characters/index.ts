import { SupabaseClient } from '@supabase/supabase-js';

import { getItemCatalog } from '@backend/contexts/items';
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
import { DuplicateCharacterUseCase } from './application/duplicate-character/duplicate-character.use-case';
import { GetCharactersByOwnerUseCase } from './application/get-characters/get-characters-by-owner.use-case';
import { GetCharacterUseCase } from './application/get-characters/get-characters.use-case';
import {
  AddInventoryItemUseCase,
  GetInventoryUseCase,
  RemoveInventoryItemUseCase,
  SetInventoryCoinsUseCase,
  SetInventoryItemQuantityUseCase,
} from './application/inventory/inventory.use-cases';
import {
  AddPartyChestItemUseCase,
  GetPartyChestUseCase,
  RemovePartyChestItemUseCase,
  SetPartyChestCoinsUseCase,
  SetPartyChestItemQuantityUseCase,
} from './application/inventory/party-chest.use-cases';
import { GetPartyCharacterInventoryUseCase } from './application/party-gm/get-party-character-inventory.use-case';
import { GetPartyCharacterSpellsUseCase } from './application/party-gm/get-party-character-spells.use-case';
import { GetPartyCharacterUseCase } from './application/party-gm/get-party-character.use-case';
import { GetCharacterSpellsUseCase } from './application/spells/get-character-spells.use-case';
import { ToggleCharacterSpellUseCase } from './application/spells/toggle-character-spell.use-case';
import { UpdateCharacterUseCase } from './application/update-character/update-character.use-case';
import { UploadCharacterAvatarUseCase } from './application/upload-avatar/upload-character-avatar.use-case';
import { SupabaseCharacterSpellRepository } from './infrastructure/repositories/supabase-character-spell.repository';
import { SupabaseCharacterRepository } from './infrastructure/repositories/supabase-character.repository';
import { SupabaseInventoryRepository } from './infrastructure/repositories/supabase-inventory.repository';

export type { CharacterContext, CharacterUpdates, CreateCharacterInput };

export const createCharacterContext = (
  dbClient: SupabaseClient,
  { partyGmAccess }: { partyGmAccess: PartyGmAccess },
): CharacterContext => {
  const repository = new SupabaseCharacterRepository(dbClient);
  const spellRepository = new SupabaseCharacterSpellRepository(dbClient);
  const inventoryRepository = new SupabaseInventoryRepository(dbClient);
  const partyChestRepository = new SupabaseInventoryRepository(dbClient, 'party_id');
  const storageRepository = new SupabaseStorageRepository(dbClient);

  const getCharacterUseCase = new GetCharacterUseCase(repository);
  const getCharactersByOwnerUseCase = new GetCharactersByOwnerUseCase(repository);
  const createCharacterUseCase = new CreateCharacterUseCase(repository);
  const updateCharacterUseCase = new UpdateCharacterUseCase(repository, storageRepository);
  const deleteCharacterUseCase = new DeleteCharacterUseCase(repository, storageRepository);
  const duplicateCharacterUseCase = new DuplicateCharacterUseCase(repository);

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

  const itemCatalog = getItemCatalog();
  const getInventoryUseCase = new GetInventoryUseCase(repository, inventoryRepository, itemCatalog);
  const addInventoryItemUseCase = new AddInventoryItemUseCase(
    repository,
    inventoryRepository,
    itemCatalog,
  );
  const setInventoryItemQuantityUseCase = new SetInventoryItemQuantityUseCase(
    repository,
    inventoryRepository,
  );
  const removeInventoryItemUseCase = new RemoveInventoryItemUseCase(
    repository,
    inventoryRepository,
  );
  const setInventoryCoinsUseCase = new SetInventoryCoinsUseCase(repository, inventoryRepository);

  const getPartyChestUseCase = new GetPartyChestUseCase(partyChestRepository, itemCatalog);
  const addPartyChestItemUseCase = new AddPartyChestItemUseCase(partyChestRepository, itemCatalog);
  const setPartyChestItemQuantityUseCase = new SetPartyChestItemQuantityUseCase(
    partyChestRepository,
  );
  const removePartyChestItemUseCase = new RemovePartyChestItemUseCase(partyChestRepository);
  const setPartyChestCoinsUseCase = new SetPartyChestCoinsUseCase(partyChestRepository);

  const getPartyCharacterUseCase = new GetPartyCharacterUseCase(repository, partyGmAccess);
  const getPartyCharacterSpellsUseCase = new GetPartyCharacterSpellsUseCase(
    spellRepository,
    spellCatalog,
    partyGmAccess,
  );

  const getPartyCharacterInventoryUseCase = new GetPartyCharacterInventoryUseCase(
    inventoryRepository,
    itemCatalog,
    partyGmAccess,
  );

  return {
    getById: getCharacterUseCase.execute.bind(getCharacterUseCase),
    getByOwner: getCharactersByOwnerUseCase.execute.bind(getCharactersByOwnerUseCase),
    create: createCharacterUseCase.execute.bind(createCharacterUseCase),
    update: updateCharacterUseCase.execute.bind(updateCharacterUseCase),
    delete: deleteCharacterUseCase.execute.bind(deleteCharacterUseCase),
    duplicate: duplicateCharacterUseCase.execute.bind(duplicateCharacterUseCase),
    isOwner: async (id: string, userId: string) =>
      Boolean(userId) && (await repository.findOwnerId(id)) === userId,
    getSpells: getCharacterSpellsUseCase.execute.bind(getCharacterSpellsUseCase),
    toggleSpell: toggleCharacterSpellUseCase.execute.bind(toggleCharacterSpellUseCase),
    getInventory: getInventoryUseCase.execute.bind(getInventoryUseCase),
    addItem: addInventoryItemUseCase.execute.bind(addInventoryItemUseCase),
    setItemQuantity: setInventoryItemQuantityUseCase.execute.bind(setInventoryItemQuantityUseCase),
    removeItem: removeInventoryItemUseCase.execute.bind(removeInventoryItemUseCase),
    setCoins: setInventoryCoinsUseCase.execute.bind(setInventoryCoinsUseCase),
    getPartyChest: getPartyChestUseCase.execute.bind(getPartyChestUseCase),
    addPartyChestItem: addPartyChestItemUseCase.execute.bind(addPartyChestItemUseCase),
    setPartyChestItemQuantity: setPartyChestItemQuantityUseCase.execute.bind(
      setPartyChestItemQuantityUseCase,
    ),
    removePartyChestItem: removePartyChestItemUseCase.execute.bind(removePartyChestItemUseCase),
    setPartyChestCoins: setPartyChestCoinsUseCase.execute.bind(setPartyChestCoinsUseCase),
    getInventoryForPartyGm: getPartyCharacterInventoryUseCase.execute.bind(
      getPartyCharacterInventoryUseCase,
    ),
    getForPartyGm: getPartyCharacterUseCase.execute.bind(getPartyCharacterUseCase),
    getSpellsForPartyGm: getPartyCharacterSpellsUseCase.execute.bind(
      getPartyCharacterSpellsUseCase,
    ),
    uploadAvatar: async (id: string, userId: string, file: Blob, full?: Blob) => {
      const useCase = new UploadCharacterAvatarUseCase(storageRepository, repository);
      return useCase.execute(id, userId, file, full);
    },
  };
};
