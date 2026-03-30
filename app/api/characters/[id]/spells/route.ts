import { getApi } from '@api';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async (req, user, _body, ctx) => {
  const { id } = await ctx.params;
  const { charactersApi } = await getApi();

  // Verify ownership first
  const character = await charactersApi.getById(id);
  if (!character || character.ownerUsername !== user.id) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }

  // Get locale from query parameter (set by frontend)
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') || 'en';

  const spells = await charactersApi.getSpells(id, locale);
  return spells;
});

export const POST = withAuth<{
  spellId: string;
  action: 'learn' | 'forget' | 'prepare' | 'unprepare';
}>(async (req, user, body, ctx) => {
  const { id } = await ctx.params;
  const { charactersApi } = await getApi();

  // Verify ownership
  const character = await charactersApi.getById(id);
  if (!character || character.ownerUsername !== user.id) {
    throw Object.assign(new Error('Unauthorized'), { status: 403 });
  }

  await charactersApi.toggleSpell(id, body.spellId, body.action);
  return { success: true };
});
