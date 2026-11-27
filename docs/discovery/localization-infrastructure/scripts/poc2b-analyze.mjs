// Compares the saved runs of poc2-bench.mjs (baseline) and poc2b-bench.mjs (v2, v3).
//   node docs/discovery/localization-infrastructure/scripts/poc2b-analyze.mjs ~/l10n-poc/work
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const dir = (process.argv[2] ?? '~/l10n-poc/work').replace(/^~/, process.env.HOME);
const load = (name) =>
  existsSync(path.join(dir, name)) ? JSON.parse(readFileSync(path.join(dir, name), 'utf8')) : null;
const engines = ['gemma-4-e4b', 'qwen3.5-9b'];
const runs = {};
for (const engine of engines) {
  runs[`${engine}/base`] = load(`poc2-${engine}.json`);
  runs[`${engine}/v2`] = load(`poc2b-${engine}-v2.json`);
  runs[`${engine}/v3`] = load(`poc2b-${engine}-v3.json`);
}
const mean = (list) => list.reduce((a, b) => a + b, 0) / (list.length || 1);
const rulesOf = (run) => run.results.filter((r) => r.group === 'rules');
const failing = (rows) =>
  rows
    .filter((r) => r.problems.length)
    .map((r) => r.key.split('/').pop().replace('.description', ''));

for (const [name, run] of Object.entries(runs)) {
  if (!run) continue;
  const rules = rulesOf(run);
  const ui = run.results.filter((r) => r.group === 'ui');
  const firstRaw = rules.filter((r) => !r.firstProblems.length).length;
  const firstRepaired = rules.filter(
    (r) => r.history && !r.history[0].repairedProblems.length,
  ).length;
  const terms = rules.reduce((a, r) => a + r.glossaryTerms, 0);
  const missed = rules.reduce((a, r) => a + r.glossaryMissed.length, 0);
  console.log(`\n## ${name}  (${run.summary.wallSeconds}s)`);
  console.log(
    `rules: first try valid ${firstRaw}/100` +
      (rules[0].history ? `, first try valid after repair ${firstRepaired}/100` : '') +
      `, valid after retries ${rules.filter((r) => !r.problems.length).length}/100`,
  );
  console.log(`rules still failing: ${failing(rules).join(', ') || 'none'}`);
  console.log(
    `rules glossary ${((100 * (terms - missed)) / terms).toFixed(1)}%  chrF ${mean(rules.map((r) => r.chrF)).toFixed(1)}  attempts>1: ${rules.filter((r) => r.attempts > 1).length}  repaired: ${rules.filter((r) => r.repaired).length}`,
  );
  console.log(
    `ui: valid ${ui.filter((r) => !r.problems.length).length}/50  failing: ${
      ui
        .filter((r) => r.problems.length)
        .map((r) => `${r.key.replace('ui/', '')}[${r.problems}]`)
        .join(', ') || 'none'
    }  chrF ${mean(ui.map((r) => r.chrF)).toFixed(1)}`,
  );
}

// Cross-model fallback: a segment is delivered if either engine produced a valid output.
for (const variant of ['base', 'v2', 'v3']) {
  const [a, b] = engines.map((e) => runs[`${e}/${variant}`]);
  if (!a || !b) continue;
  const bad = (run) =>
    new Set(
      rulesOf(run)
        .filter((r) => r.problems.length)
        .map((r) => r.key),
    );
  const [fa, fb] = [bad(a), bad(b)];
  const both = [...fa].filter((k) => fb.has(k));
  console.log(
    `\n## fallback ${variant}: gemma fails ${fa.size}, qwen fails ${fb.size}, both fail ${both.length} → delivered with fallback ${100 - both.length}/100 (${both.join(', ')})`,
  );
}

// Paired chrF difference with bootstrap interval.
const paired = (nameA, nameB) => {
  const [a, b] = [runs[nameA], runs[nameB]];
  if (!a || !b) return;
  const byKey = new Map(rulesOf(b).map((r) => [r.key, r]));
  const diffs = rulesOf(a)
    .filter((r) => !r.problems.length && byKey.get(r.key) && !byKey.get(r.key).problems.length)
    .map((r) => r.chrF - byKey.get(r.key).chrF);
  let seed = 7;
  const random = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed / 0x7fffffff);
  const boots = Array.from({ length: 2000 }, () =>
    mean(diffs.map(() => diffs[Math.floor(random() * diffs.length)])),
  ).sort((x, y) => x - y);
  console.log(
    `chrF ${nameA} − ${nameB}: ${mean(diffs).toFixed(2)} (95% ${boots[50].toFixed(2)} to ${boots[1949].toFixed(2)}), n=${diffs.length}`,
  );
};
console.log('');
for (const engine of engines) {
  paired(`${engine}/v2`, `${engine}/base`);
  paired(`${engine}/v3`, `${engine}/v2`);
}
paired('gemma-4-e4b/v2', 'qwen3.5-9b/v2');
