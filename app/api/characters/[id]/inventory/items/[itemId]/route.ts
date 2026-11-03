import { getApi } from '@api';

import {
  inventoryItemParamsSchema,
  setItemQuantitySchema,
} from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';

/** Sets the absolute quantity of an entry. */
export const PATCH = withAuth(
  async ({ user, body, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.setItemQuantity(params.id, user.id, params.itemId, body.quantity);
    return null; // → 204 No Content
  },
  { params: inventoryItemParamsSchema, body: setItemQuantitySchema },
);

export const DELETE = withAuth(
  async ({ user, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.removeItem(params.id, user.id, params.itemId);
    return null; // → 204 No Content
  },
  { params: inventoryItemParamsSchema },
);
