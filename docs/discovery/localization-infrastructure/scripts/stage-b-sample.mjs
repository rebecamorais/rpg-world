// PoC 2, stage B: draws the three evaluation samples (B0, B1, B2) and persists them as a manifest.
// Deterministic (fixed seed). Population: SRD 5.2 prose fields with no Portuguese yet.
// Segments seen during prompt and pipeline tuning are excluded: the PoC 1 sample (when its output file is
// available) is passed with --exclude; stage A used SRD 5.1 only, so it cannot leak into this set.
//
//   node docs/discovery/localization-infrastructure/scripts/stage-b-sample.mjs --exclude ~/l10n-poc/work/run-p4.json
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce(
      (acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc),
      [],
    ),
);
const ROOT = path.resolve(import.meta.dirname, '../../../..');
const OUT = path.resolve(import.meta.dirname, '../stage-b/manifest.json');
const SEED = 20261128;
const MAX_WORDS_EARLY = 400; // B0 and B1 keep sessions bounded; B2 has no cap

const prng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const random = prng(SEED);
const shuffle = (list) => {
  const pool = [...list];
  const out = [];
  while (pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
};
const flatten = (value, prefix = '', out = {}) => {
  if (typeof value === 'string') out[prefix] = value;
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
};
const json = (file) => JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'));

// category → [B0, B1, B2]
const QUOTA = {
  'spells.description': [12, 28, 83],
  'spells.higherLevel': [2, 5, 14],
  'spells.other': [1, 2, 6], // material, trigger
  'classes.description': [9, 22, 62],
  'items.description': [4, 9, 26],
  'conditions.description': [2, 4, 9],
};
const categoryOf = (file, field) =>
  file === 'spells' && (field === 'material' || field === 'trigger')
    ? 'spells.other'
    : `${file}.${field}`;

const excluded = new Set();
const excludeFile = args.exclude?.replace(/^~/, process.env.HOME);
if (excludeFile && existsSync(excludeFile))
  for (const row of JSON.parse(readFileSync(excludeFile, 'utf8')).results ?? [])
    excluded.add(row.key ?? row.id);

const population = [];
for (const file of ['spells', 'items', 'conditions', 'classes']) {
  const en = flatten(json(`content/dnd5e/srd-5.2/i18n/en/${file}.json`));
  const pt = flatten(json(`content/dnd5e/srd-5.2/i18n/pt/${file}.json`));
  for (const [leaf, source] of Object.entries(en)) {
    const field = leaf.split('.').pop();
    const category = categoryOf(file, field);
    if (!QUOTA[category] || !source.trim() || pt[leaf]?.trim()) continue;
    const key = `srd-5.2/${file}/${leaf}`;
    population.push({
      key,
      category,
      words: source.trim().split(/\s+/).length,
      tags: (source.match(/\{@/g) ?? []).length,
      units: /\b(feet|foot|miles?|pounds?|inch|inches|gallons?|lb\.)\b/i.test(source),
      dice: /\{@(dice|damage|scaledamage|scaledice|dc|hit)\b|\b\d*d\d+\b/.test(source),
      seenInTuning: excluded.has(key),
      sha256: createHash('sha256').update(source).digest('hex').slice(0, 16),
    });
  }
}

const stages = { b0: [], b1: [], b2: [] };
for (const [category, quota] of Object.entries(QUOTA)) {
  const pool = shuffle(
    population
      .filter((s) => s.category === category && !s.seenInTuning)
      .sort((a, b) => a.key.localeCompare(b.key)),
  );
  const median = [...pool].map((s) => s.words).sort((a, b) => a - b)[pool.length >> 1];
  // Three kinds, taken in turn so each stage gets all of them: with unit conversion, tag-heavy or long, simple.
  const kind = (s) => (s.units ? 0 : s.tags >= 3 || s.words > median ? 1 : 2);
  const take = (count, cap) => {
    const picked = [];
    for (let turn = 0; picked.length < count; turn++) {
      const index = pool.findIndex((s) => kind(s) === turn % 3 && s.words <= cap);
      const fallback = index >= 0 ? index : pool.findIndex((s) => s.words <= cap);
      if (fallback < 0) break;
      picked.push({ ...pool.splice(fallback, 1)[0], complex: undefined });
    }
    return picked;
  };
  stages.b0.push(...take(quota[0], MAX_WORDS_EARLY));
  stages.b1.push(...take(quota[1], MAX_WORDS_EARLY));
  stages.b2.push(...take(quota[2], Infinity));
}
for (const stage of Object.values(stages))
  for (const s of stage) (delete s.complex, delete s.seenInTuning);

const describe = (list) => ({
  segments: list.length,
  words: list.reduce((a, s) => a + s.words, 0),
  withTags: list.filter((s) => s.tags).length,
  withUnits: list.filter((s) => s.units).length,
  withDice: list.filter((s) => s.dice).length,
  byCategory: Object.fromEntries(
    Object.keys(QUOTA).map((c) => [c, list.filter((s) => s.category === c).length]),
  ),
});
const manifest = {
  seed: SEED,
  population: {
    segments: population.length,
    words: population.reduce((a, s) => a + s.words, 0),
    excludedAsSeen: population.filter((s) => s.seenInTuning).length,
  },
  summary: { b0: describe(stages.b0), b1: describe(stages.b1), b2: describe(stages.b2) },
  stages: Object.fromEntries(Object.entries(stages).map(([name, list]) => [name, shuffle(list)])),
};
writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  JSON.stringify({ population: manifest.population, summary: manifest.summary }, null, 2),
);
