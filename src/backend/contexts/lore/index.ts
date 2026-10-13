import { SupabaseClient } from '@supabase/supabase-js';

import { DeleteLoreUseCase } from './application/delete-lore/delete-lore.use-case';
import { GetLoreUseCase } from './application/get-lore/get-lore.use-case';
import { UpdateLoreUseCase } from './application/update-lore/update-lore.use-case';
import { CharacterOwnership } from './domain/CharacterOwnership';
import { Lore } from './domain/Lore';
import { LoreContext } from './domain/LoreContext';
import { LoreRepository } from './domain/repository/lore.repo';
import { SupabaseLoreRepository } from './infrastructure/repositories/supabase-lore.repository';

export { Lore };
export type { CharacterOwnership, LoreRepository, LoreContext };

export function createLoreContext(config: {
  dbClient: SupabaseClient;
  characterOwnership: CharacterOwnership;
}): LoreContext {
  const repository = new SupabaseLoreRepository(config.dbClient);

  const { characterOwnership } = config;

  const getLoreUseCase = new GetLoreUseCase(repository, characterOwnership);
  const updateLoreUseCase = new UpdateLoreUseCase(repository, characterOwnership);
  const deleteLoreUseCase = new DeleteLoreUseCase(repository, characterOwnership);

  return {
    getByCharacterId: (characterId: string, requesterId: string) =>
      getLoreUseCase.execute(characterId, requesterId),
    save: (characterId: string, requesterId: string, lore: Lore) =>
      updateLoreUseCase.execute(characterId, requesterId, lore),
    delete: (characterId: string, requesterId: string) =>
      deleteLoreUseCase.execute(characterId, requesterId),
  };
}
