import { getApi } from '@api';

import {
  changeCoinsSchema,
  setCoinsSchema,
} from '@backend/contexts/characters/interfaces/characters.schemas';
import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

/** Replaces the chest's coins with the five absolute values. */
export const PUT = withAuth(
  async ({ body, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.setPartyChestCoins(params.partyId, body.containerId, body.coins);
    return null; // → 204 No Content
  },
  { params: partyParamsSchema, body: setCoinsSchema },
);

/**
 * Adds `delta` to each coin in the database and answers `{ coins }`: the GM and the players adding
 * at once add up. A repeated key applies once; spending more than there is answers 409.
 */
export const PATCH = withAuth(
  async ({ body, params }) => {
    const { charactersApi } = await getApi();
    return charactersApi.changePartyChestCoins(params.partyId, body.containerId, {
      delta: body.delta,
      key: body.key,
    });
  },
  { params: partyParamsSchema, body: changeCoinsSchema },
);
