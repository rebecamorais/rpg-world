import { getApi } from '@api';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async (req) => {
  const { spellsApi } = await getApi();

  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') || 'en';

  return spellsApi.getAllSpells(locale);
});
