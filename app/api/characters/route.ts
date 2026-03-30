import { getApi } from '@api';

import { withAuth } from '@shared/http/route-handler';

type CreateBody = {
  name: string;
  system: string;
};

export const GET = withAuth(async (req, user) => {
  const { charactersApi } = await getApi();
  return charactersApi.getByOwner(user.id);
});

export const POST = withAuth<CreateBody>(async (req, user, body) => {
  const { charactersApi } = await getApi();
  const character = await charactersApi.create({
    ...body,
    ownerUsername: user.id,
  });
  return { id: character.id };
}, 201);
