import { getApi } from '@api';

import { withAuth } from '@shared/http/route-handler';

type UpdateBody = {
  updates: Record<string, unknown>;
};

export const GET = withAuth(async (req, user, _body, ctx) => {
  const { id } = await ctx.params;
  const { charactersApi } = await getApi();
  const character = await charactersApi.getById(id);

  if (!character || character.ownerUsername !== user.id) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }

  return character;
});

export const PUT = withAuth<UpdateBody>(async (req, user, body, ctx) => {
  const { id } = await ctx.params;
  const { charactersApi } = await getApi();
  const character = await charactersApi.update({
    id,
    ownerUsername: user.id,
    updates: body.updates,
  });
  return { id: character.id };
});

export const DELETE = withAuth(async (req, user, _body, ctx) => {
  const { id } = await ctx.params;
  const { charactersApi } = await getApi();
  await charactersApi.delete(id, user.id);
  return null; // → 204 No Content
});
