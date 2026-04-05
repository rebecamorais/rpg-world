import { getApi } from '@api';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async (req) => {
  const { spellsApi } = await getApi();

  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') || 'en';
  const page = parseInt(url.searchParams.get('page') || '0', 10);
  const limit = parseInt(url.searchParams.get('limit') || '12', 10);
  const search = url.searchParams.get('search') || undefined;
  const level = url.searchParams.has('level')
    ? parseInt(url.searchParams.get('level')!, 10)
    : undefined;
  const school = url.searchParams.get('school') || undefined;
  const classParam = url.searchParams.get('class') || undefined;
  const damageType = url.searchParams.get('damageType') || undefined;

  return spellsApi.getAllSpells({
    locale,
    page,
    limit,
    search,
    level,
    school,
    class: classParam,
    damageType,
  });
});
