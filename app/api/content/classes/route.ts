import { getApi } from '@api';

import { classResourcesQuerySchema } from '@backend/contexts/classes/interfaces/classes.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput } from '@shared/http/validation';

export const GET = withAuth(async ({ req }) => {
  const query = parseInput(classResourcesQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
  const { classesApi } = await getApi();
  return classesApi.resources(query.edition, query.class, query.locale);
});
