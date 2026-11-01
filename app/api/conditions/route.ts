import { getApi } from '@api';

import { listConditionsQuerySchema } from '@backend/contexts/conditions/interfaces/conditions.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput } from '@shared/http/validation';

export const GET = withAuth(async ({ req }) => {
  const { locale } = parseInput(
    listConditionsQuerySchema,
    Object.fromEntries(req.nextUrl.searchParams),
  );
  const { conditionsApi } = await getApi();
  return conditionsApi.list(locale);
});
