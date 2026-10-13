import { getApi } from '@api';

import { loreSchema } from '@backend/contexts/lore/interfaces/lore.schemas';

import { withAuth } from '@shared/http/route-handler';
import { uuidParamsSchema } from '@shared/http/validation';

export const GET = withAuth(
  async ({ user, params }) => {
    const { loreApi } = await getApi();
    const lore = await loreApi.getByCharacterId(params.id, user.id);
    return lore || {};
  },
  { params: uuidParamsSchema },
);

export const PUT = withAuth(
  async ({ user, body, params }) => {
    const { loreApi } = await getApi();
    return loreApi.update(params.id, user.id, body);
  },
  { params: uuidParamsSchema, body: loreSchema },
);
