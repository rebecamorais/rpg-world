import { FindSpellsParams } from '../domain/repository/spells.repo';
import { SpellsContext } from '../index';

export const makeSpellsApi = (spellsContext: SpellsContext) => ({
  getAllSpells: async (params?: FindSpellsParams) => {
    return spellsContext.getAllSpells(params);
  },
});
