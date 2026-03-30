import { SpellsContext } from '../index';

export const makeSpellsApi = (spellsContext: SpellsContext) => ({
  getAllSpells: async (locale?: string) => {
    return spellsContext.getAllSpells(locale);
  },
});
