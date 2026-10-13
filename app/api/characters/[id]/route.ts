import { getApi } from '@api';

import { updateCharacterSchema } from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';
import { uuidParamsSchema } from '@shared/http/validation';

export const GET = withAuth(
  async ({ user, params }) => {
    const { charactersApi } = await getApi();
    return charactersApi.getById(params.id, user.id);
  },
  { params: uuidParamsSchema },
);

export const PUT = withAuth(
  async ({ user, body, params }) => {
    const { charactersApi } = await getApi();
    return charactersApi.update({ id: params.id, ownerUsername: user.id, updates: body.updates });
  },
  { params: uuidParamsSchema, body: updateCharacterSchema },
);

export const DELETE = withAuth(
  async ({ user, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.delete(params.id, user.id);
    return null; // → 204 No Content
  },
  { params: uuidParamsSchema },
);
