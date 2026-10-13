import { getApi } from '@api';

import {
  localeQuerySchema,
  toggleSpellSchema,
} from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput, uuidParamsSchema } from '@shared/http/validation';

export const GET = withAuth(
  async ({ req, user, params }) => {
    const { locale } = parseInput(localeQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
    const { charactersApi } = await getApi();
    return charactersApi.getSpells(params.id, user.id, locale);
  },
  { params: uuidParamsSchema },
);

export const POST = withAuth(
  async ({ user, body, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.toggleSpell(params.id, user.id, body.id, body.action);
    return { success: true };
  },
  { params: uuidParamsSchema, body: toggleSpellSchema },
);
