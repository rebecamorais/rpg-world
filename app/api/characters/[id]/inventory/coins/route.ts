import { getApi } from '@api';

import {
  changeCoinsSchema,
  setCoinsSchema,
} from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';
import { uuidParamsSchema } from '@shared/http/validation';

/** Replaces the coins of a container with the five absolute values. */
export const PUT = withAuth(
  async ({ user, body, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.setCoins(params.id, user.id, body.containerId, body.coins);
    return null; // → 204 No Content
  },
  { params: uuidParamsSchema, body: setCoinsSchema },
);

/** Adds `delta` to each coin in the database and answers `{ coins }`; a repeated key applies once. */
export const PATCH = withAuth(
  async ({ user, body, params }) => {
    const { charactersApi } = await getApi();
    return charactersApi.changeCoins(params.id, user.id, body.containerId, {
      delta: body.delta,
      key: body.key,
    });
  },
  { params: uuidParamsSchema, body: changeCoinsSchema },
);
