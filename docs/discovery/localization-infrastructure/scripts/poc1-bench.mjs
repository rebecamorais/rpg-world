// PoC 1: does a local model fit and how fast does it translate? Measures throughput only, not quality.
// Needs an OpenAI-compatible server (llama.cpp `llama-server`) already running.
//
//   node docs/discovery/localization-infrastructure/scripts/poc1-bench.mjs \
//     --url http://127.0.0.1:8080 --parallel 4 --out ~/l10n-poc/work/run-p4.json
//
// The sample is deterministic (fixed seed): 50 UI strings and 150 SRD 5.2 rules strings.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const URL_BASE = args.url ?? 'http://127.0.0.1:8080';
const PARALLEL = Number(args.parallel ?? 1);
const OUT = (args.out ?? 'poc1-run.json').replace(/^~/, process.env.HOME);
const LIMIT = Number(args.limit ?? 0);
const ROOT = path.resolve(import.meta.dirname, '../../../..');

const flatten = (obj, prefix = '', out = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[full] = value;
    else if (value && typeof value === 'object') flatten(value, full, out);
  }
  return out;
};
const load = (file) => flatten(JSON.parse(readFileSync(path.join(ROOT, file), 'utf8')));

// mulberry32: small seeded PRNG so the sample is the same on every run.
const prng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (entries, count, random) => {
  const pool = [...entries];
  const chosen = [];
  while (chosen.length < count && pool.length) chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return chosen;
};

const random = prng(20261127);
const ui = Object.entries(load('messages/en.json')).filter(([, v]) => v.trim());
const rules = ['spells', 'classes', 'items', 'conditions'].flatMap((kind) =>
  Object.entries(load(`content/dnd5e/srd-5.2/i18n/en/${kind}.json`))
    .filter(([, v]) => v.trim())
    .map(([k, v]) => [`srd-5.2/${kind}/${k}`, v]),
);
let sample = [
  ...pick(ui, 50, random).map(([key, source]) => ({ key: `ui/${key}`, source, group: 'ui' })),
  ...pick(rules, 150, random).map(([key, source]) => ({ key, source, group: 'rules' })),
];
if (LIMIT) sample = sample.slice(0, LIMIT);

const SYSTEM = `You translate tabletop RPG (D&D 5e SRD) text from English to Brazilian Portuguese.
Rules:
- Output only the translation, nothing else.
- Keep placeholders ({count}, {name}), ICU syntax, tags (<b>…</b>) and {@tag identifier} identifiers exactly as they are.
- Keep dice expressions (2d6, 1d8 + 3) and numbers unchanged.
- Glossary: saving throw = salvaguarda; spell slot = espaço de magia; advantage = vantagem; disadvantage = desvantagem; bonus action = ação bônus; hit points = pontos de vida; cantrip = truque; long rest = descanso longo; short rest = descanso curto.`;

async function translate(item) {
  const started = performance.now();
  const response = await fetch(`${URL_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: item.source },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      chat_template_kwargs: { enable_thinking: false },
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  const json = await response.json();
  const message = json.choices[0].message;
  return {
    ...item,
    target: message.content,
    reasoningChars: (message.reasoning_content ?? '').length,
    promptTokens: json.usage.prompt_tokens,
    completionTokens: json.usage.completion_tokens,
    seconds: (performance.now() - started) / 1000,
    finish: json.choices[0].finish_reason,
  };
}

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const queue = [...sample];
const results = [];
const failures = [];
const started = performance.now();
await Promise.all(
  Array.from({ length: PARALLEL }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        results.push(await translate(item));
      } catch (error) {
        failures.push({ key: item.key, error: String(error) });
      }
    }
  }),
);
const wall = (performance.now() - started) / 1000;
const sum = (f) => results.reduce((total, r) => total + f(r), 0);
const sourceWords = sum((r) => words(r.source));
const summary = {
  parallel: PARALLEL,
  strings: results.length,
  failures: failures.length,
  wallSeconds: +wall.toFixed(1),
  sourceWords,
  targetWords: sum((r) => words(r.target)),
  promptTokens: sum((r) => r.promptTokens),
  completionTokens: sum((r) => r.completionTokens),
  completionTokensPerSecond: +(sum((r) => r.completionTokens) / wall).toFixed(1),
  sourceWordsPerSecond: +(sourceWords / wall).toFixed(1),
  stringsWithReasoning: results.filter((r) => r.reasoningChars > 0).length,
  truncated: results.filter((r) => r.finish !== 'stop').length,
  emptyTargets: results.filter((r) => !r.target?.trim()).length,
  // Arithmetic projection from this sample to the whole product corpus (160,246 source words).
  projectedHoursFor160kWords: +(160246 / (sourceWords / wall) / 3600).toFixed(2),
};
writeFileSync(OUT, JSON.stringify({ summary, failures, results }, null, 2));
console.log(JSON.stringify(summary, null, 2));
