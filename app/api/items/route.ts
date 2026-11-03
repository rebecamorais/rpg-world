import { getApi } from '@api';

import { listItemsQuerySchema } from '@backend/contexts/items/interfaces/items.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput } from '@shared/http/validation';

export const GET = withAuth(async ({ req }) => {
  const { locale } = parseInput(listItemsQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
  const { itemsApi } = await getApi();
  return itemsApi.list(locale);
});
