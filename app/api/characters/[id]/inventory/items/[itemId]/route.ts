import { getApi } from '@api';

import {
  inventoryItemParamsSchema,
  itemQuantityBodySchema,
} from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';

/**
 * Changes the quantity of an entry: `{ delta, key }` adds in the database and answers the new
 * quantity (a repeated key applies once); `{ quantity }` sets the absolute value (older clients).
 */
export const PATCH = withAuth(
  async ({ user, body, params }) => {
    const { charactersApi } = await getApi();
    if ('delta' in body) {
      return charactersApi.changeItemQuantity(params.id, user.id, params.itemId, body);
    }
    await charactersApi.setItemQuantity(params.id, user.id, params.itemId, body.quantity);
    return null; // → 204 No Content
  },
  { params: inventoryItemParamsSchema, body: itemQuantityBodySchema },
);

export const DELETE = withAuth(
  async ({ user, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.removeItem(params.id, user.id, params.itemId);
    return null; // → 204 No Content
  },
  { params: inventoryItemParamsSchema },
);
