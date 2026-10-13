import { z } from 'zod';

import { optional } from '@shared/http/validation';

const short = optional(z.string().max(200));
const long = optional(z.string().max(20_000));

export const loreSchema = z.object({
  age: short,
  height: short,
  weight: short,
  eyes: short,
  skin: short,
  hair: short,
  backstory: long,
  personalityTraits: long,
  ideals: long,
  bonds: long,
  flaws: long,
  alliesAndEnemies: long,
  organizations: long,
  treasure: long,
});
