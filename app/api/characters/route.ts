import { getApi } from '@api';

import { createCharacterSchema } from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async ({ user }) => {
  const { charactersApi } = await getApi();
  return charactersApi.getByOwner(user.id);
});

export const POST = withAuth(
  async ({ user, body }) => {
    const { charactersApi } = await getApi();
    return charactersApi.create({ ...body, ownerUsername: user.id });
  },
  { body: createCharacterSchema, status: 201 },
);
