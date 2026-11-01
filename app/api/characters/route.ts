import { getApi } from '@api';

import {
  charactersQuerySchema,
  createCharacterSchema,
} from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput } from '@shared/http/validation';

export const GET = withAuth(async ({ req, user }) => {
  const { kind } = parseInput(charactersQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
  const { charactersApi } = await getApi();
  return charactersApi.getByOwner(user.id, kind);
});

export const POST = withAuth(
  async ({ user, body }) => {
    const { charactersApi } = await getApi();
    return charactersApi.create({ ...body, ownerUsername: user.id });
  },
  { body: createCharacterSchema, status: 201 },
);
