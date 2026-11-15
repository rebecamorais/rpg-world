import { getApi } from '@api';

import { itemQuantityBodySchema } from '@backend/contexts/characters/interfaces/characters.schemas';
import { partyChestItemParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

/**
 * Changes the quantity of an entry in the chest: `{ delta, key }` adds in the database (the GM and
 * the players taking one each take two) and answers the new quantity; `{ quantity }` sets it.
 */
export const PATCH = withAuth(
  async ({ body, params }) => {
    const { charactersApi } = await getApi();
    if ('delta' in body) {
      return charactersApi.changePartyChestItemQuantity(params.partyId, params.itemId, body);
    }
    await charactersApi.setPartyChestItemQuantity(params.partyId, params.itemId, body.quantity);
    return null; // → 204 No Content
  },
  { params: partyChestItemParamsSchema, body: itemQuantityBodySchema },
);

export const DELETE = withAuth(
  async ({ params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.removePartyChestItem(params.partyId, params.itemId);
    return null; // → 204 No Content
  },
  { params: partyChestItemParamsSchema },
);
