import { getApi } from '@api';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async (req, user, _body, ctx) => {
  const { id } = await ctx.params;
  const { loreApi } = await getApi();
  const lore = await loreApi.getByCharacterId(id, user.id);
  return lore || {};
});

export const PUT = withAuth<Record<string, unknown>>(async (req, user, body, ctx) => {
  const { id } = await ctx.params;
  const { loreApi } = await getApi();
  await loreApi.update(id, user.id, body);
  return { characterId: id };
});
