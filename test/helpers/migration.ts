import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The test database's container, the same name locally and in CI (`project_id` of db-test). */
const CONTAINER = 'supabase_db_rpg-world-test';

/**
 * Runs a data migration for real over the sheets of one owner, twice, inside a transaction that
 * is rolled back: the other tests' sheets are never changed. Returns `column` of those sheets
 * (a SQL expression over `public.characters`) with the revision, before, after one run and after
 * a second one, ordered by name.
 */
export function runMigrationRolledBack<T>(file: string, ownerId: string, column: string) {
  type Row = { name: string; value: T; revision: number };
  const migration = readFileSync(join(process.cwd(), 'database/migrations', file), 'utf8');
  const snapshot = (label: string) => `
    SELECT '${label}=' || coalesce(json_agg(json_build_object(
      'name', name, 'value', ${column}, 'revision', revision
    ) ORDER BY name), '[]')
    FROM public.characters WHERE owner_id = '${ownerId}';`;
  const output = execFileSync(
    'docker',
    ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-At'].concat([
      '-v',
      'ON_ERROR_STOP=1',
    ]),
    {
      input: `BEGIN;\n${snapshot('before')}\n${migration}\n${snapshot('once')}\n${migration}\n${snapshot('twice')}\nROLLBACK;`,
      encoding: 'utf8',
    },
  );
  const read = (label: string): Row[] => {
    const line = output.split('\n').find((text) => text.startsWith(`${label}=`));
    if (!line) throw new Error(`migration output has no "${label}" line:\n${output}`);
    return JSON.parse(line.slice(label.length + 1));
  };
  const [before, once, twice] = [read('before'), read('once'), read('twice')];
  return {
    once,
    twice,
    /** Each sheet's value after the first run, by name. */
    values: Object.fromEntries(once.map((row) => [row.name, row.value])),
    /** How much each sheet's revision went up in the first run, by name. */
    revisionBumps: Object.fromEntries(
      once.map((row, i) => [row.name, row.revision - before[i].revision]),
    ),
  };
}
