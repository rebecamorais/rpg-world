import { z } from 'zod';

import { optionalQuery } from '@shared/http/validation';
import { EDITIONS } from '@shared/systems/dnd5e/content/editions';

export const classResourcesQuerySchema = z.object({
  edition: z.enum(EDITIONS),
  class: z.string().regex(/^[a-z0-9-]+$/),
  locale: optionalQuery(z.string().max(100)).transform((locale) => locale ?? 'en'),
});
