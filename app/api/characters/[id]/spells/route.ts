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

/** Learning answers with the learned spell (`?locale=` as in GET); the other actions with null. */
export const POST = withAuth(
  async ({ req, user, body, params }) => {
    const { locale } = parseInput(localeQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
    const { charactersApi } = await getApi();
    const spell = await charactersApi.toggleSpell(params.id, user.id, body.id, body.action, locale);
    return { spell };
  },
  { params: uuidParamsSchema, body: toggleSpellSchema },
);
