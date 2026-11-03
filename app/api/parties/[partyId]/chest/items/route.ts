import { getApi } from '@api';

import {
  addInventoryItemSchema,
  localeQuerySchema,
} from '@backend/contexts/characters/interfaces/characters.schemas';
import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput } from '@shared/http/validation';

/** Adds to the chest; an item already there has its quantity summed. Answers with the entry. */
export const POST = withAuth(
  async ({ req, body, params }) => {
    const { locale } = parseInput(localeQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
    const { charactersApi } = await getApi();
    return charactersApi.addPartyChestItem(params.partyId, body, locale);
  },
  { params: partyParamsSchema, body: addInventoryItemSchema },
);
