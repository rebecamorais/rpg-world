import { getApi } from '@api';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async (req, user, _body, ctx) => {
  const { id } = await ctx.params;
  const { loreApi, charactersApi } = await getApi();

  // First verify character existence and ownership
  const character = await charactersApi.getById(id);
  if (!character || character.ownerUsername !== user.id) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }

  const lore = await loreApi.getByCharacterId(id);
  return lore || {};
});

export const PUT = withAuth<Record<string, unknown>>(async (req, user, body, ctx) => {
  const { id } = await ctx.params;
  const { loreApi, charactersApi } = await getApi();

  // Verify ownership before update
  const character = await charactersApi.getById(id);
  if (!character || character.ownerUsername !== user.id) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }

  await loreApi.update(id, body);
  return { characterId: id };
});
