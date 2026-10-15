import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { SKILL_KEYS } from '@shared/systems/dnd5e/constants';

/*
 * Fixed ids in the dev seeds end up in URLs and API params, which are validated with z.uuid().
 * Postgres accepts any 32 hex digits as a UUID, so a made-up id like 'bbbbbbbb-bbbb-bbbb-…' seeds
 * fine and then every request for that record answers 400.
 */
const SEEDS_DIR = 'database/db-dev/seeds';
const UUID_LITERAL =
  /'([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})'/g;

describe('dev seeds', () => {
  const files = readdirSync(SEEDS_DIR).filter((name) => name.endsWith('.sql'));

  it.each(files)('%s only uses ids the API accepts', (name) => {
    const sql = readFileSync(path.join(SEEDS_DIR, name), 'utf8');
    const invalid = [...sql.matchAll(UUID_LITERAL)]
      .map(([, id]) => id)
      .filter((id) => !z.uuid().safeParse(id).success);

    expect(invalid).toEqual([]);
  });

  /*
   * The sheet saves the whole character, so one key the API rejects (like 'arcana' instead of
   * 'ARCANA') makes every save of that character fail with "Invalid data".
   */
  it.each(files)('%s only uses skill keys the API accepts', (name) => {
    const sql = readFileSync(path.join(SEEDS_DIR, name), 'utf8');
    const skillsBlocks = [...sql.matchAll(/'skills',\s*jsonb_build_object\(([\s\S]*?)\n\s*\),/g)];
    const keys = skillsBlocks.flatMap(([, body]) =>
      [...body.matchAll(/'(\w+)',\s*jsonb_build_object/g)].map(([, key]) => key),
    );

    expect(keys.filter((key) => !(SKILL_KEYS as string[]).includes(key))).toEqual([]);
  });
});
