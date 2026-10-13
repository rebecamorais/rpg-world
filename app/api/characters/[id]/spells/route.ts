import { getApi } from '@api';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async (req, user, _body, ctx) => {
  const { id } = await ctx.params;
  const { charactersApi } = await getApi();

  // Get locale from query parameter (set by frontend)
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') || 'en';

  return charactersApi.getSpells(id, user.id, locale);
});

export const POST = withAuth<{
  id: string;
  action: 'learn' | 'forget' | 'prepare' | 'unprepare';
}>(async (req, user, body, ctx) => {
  const { id } = await ctx.params;
  const { charactersApi } = await getApi();
  await charactersApi.toggleSpell(id, user.id, body.id, body.action);
  return { success: true };
});
