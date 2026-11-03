import { getApi } from '@api';

import {
  addInventoryItemSchema,
  localeQuerySchema,
} from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput, uuidParamsSchema } from '@shared/http/validation';

/** Adds to a container; an item already there has its quantity summed. Answers with the entry. */
export const POST = withAuth(
  async ({ req, user, body, params }) => {
    const { locale } = parseInput(localeQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
    const { charactersApi } = await getApi();
    return charactersApi.addItem(params.id, user.id, body, locale);
  },
  { params: uuidParamsSchema, body: addInventoryItemSchema },
);
