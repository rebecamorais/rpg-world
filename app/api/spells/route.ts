import { getApi } from '@api';

import { findSpellsQuerySchema } from '@backend/contexts/spells/interfaces/spells.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput } from '@shared/http/validation';

export const GET = withAuth(async ({ req }) => {
  const query = parseInput(findSpellsQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
  const { spellsApi } = await getApi();
  return spellsApi.getAllSpells(query);
});
