import { z } from 'zod';

import { optionalQuery } from '@shared/http/validation';
import { EDITIONS } from '@shared/systems/dnd5e/content/editions';

const queryText = optionalQuery(z.string().max(100));

export const findSpellsQuerySchema = z.object({
  locale: queryText.transform((locale) => locale ?? 'en'),
  page: optionalQuery(z.coerce.number().int().min(0)).transform((page) => page ?? 0),
  limit: optionalQuery(z.coerce.number().int().min(1).max(50)).transform((limit) => limit ?? 12),
  search: queryText,
  level: optionalQuery(z.coerce.number().int().min(0).max(9)),
  school: queryText,
  class: queryText,
  damageType: queryText,
  edition: optionalQuery(z.enum(EDITIONS)),
});
