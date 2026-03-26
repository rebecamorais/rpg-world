import { SupabaseClient } from '@supabase/supabase-js';

import { DeleteLoreUseCase } from './application/delete-lore/delete-lore.use-case';
import { GetLoreUseCase } from './application/get-lore/get-lore.use-case';
import { UpdateLoreUseCase } from './application/update-lore/update-lore.use-case';
import { Lore } from './domain/Lore';
import { LoreContext } from './domain/LoreContext';
import { LoreRepository } from './domain/repository/lore.repo';
import { SupabaseLoreRepository } from './infrastructure/repositories/supabase-lore.repository';

export { Lore };
export type { LoreRepository, LoreContext };

export function createLoreContext(config: { dbClient: SupabaseClient }): LoreContext {
  const repository = new SupabaseLoreRepository(config.dbClient);

  const getLoreUseCase = new GetLoreUseCase(repository);
  const updateLoreUseCase = new UpdateLoreUseCase(repository);
  const deleteLoreUseCase = new DeleteLoreUseCase(repository);

  return {
    getByCharacterId: (characterId: string) => getLoreUseCase.execute(characterId),
    save: (id: string, lore: Lore) => updateLoreUseCase.execute(id, lore),
    delete: (id: string) => deleteLoreUseCase.execute(id),
  };
}
