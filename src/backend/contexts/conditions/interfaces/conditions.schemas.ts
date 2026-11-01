import { z } from 'zod';

import { optionalQuery } from '@shared/http/validation';

export const listConditionsQuerySchema = z.object({
  locale: optionalQuery(z.string().max(100)).transform((locale) => locale ?? 'en'),
});
