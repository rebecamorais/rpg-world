import { getApi } from '@api';

import { localeQuerySchema } from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput, uuidParamsSchema } from '@shared/http/validation';

/** The character's containers and entries, items in the language of `?locale=`. */
export const GET = withAuth(
  async ({ req, user, params }) => {
    const { locale } = parseInput(localeQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
    const { charactersApi } = await getApi();
    return charactersApi.getInventory(params.id, user.id, locale);
  },
  { params: uuidParamsSchema },
);
