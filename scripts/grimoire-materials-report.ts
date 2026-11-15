/**
 * Summarizes grimoire-materials-bench.ts output as Markdown tables.
 *   npx tsx scripts/grimoire-materials-report.ts bench.json
 *
 * For each device, theme, phase and metric: the median and the [min–max] range of the samples,
 * and the median's change against the card as it is today ("none"). A difference is marked
 * consistent only when the ranges don't overlap (every material sample above, or below, every
 * baseline one). Lab variants (`crypt-stone+webp`) are also compared against their original.
 * Files from the first round (no theme, no open phase) still work: they read as dark.
 */
import { readFileSync } from 'node:fs';

type Row = Record<string, number>;
interface Result {
  device: string;
  theme?: string;
  scenario: string;
  initial: Row;
  scroll: Row;
  open?: Row;
}

const { env, results } = JSON.parse(readFileSync(process.argv[2], 'utf8')) as {
  env: Record<string, unknown>;
  results: Result[];
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1));

const PHASES = {
  initial: ['style', 'layout', 'paint', 'raster', 'composite', 'decode', 'lcp'],
  open: ['style', 'layout', 'paint', 'raster', 'composite', 'frameP95', 'framesOver33ms'],
  scroll: [
    'style',
    'layout',
    'paint',
    'raster',
    'composite',
    'decode',
    'frameP50',
    'frameP95',
    'framesOver33ms',
    'longFrames',
  ],
} as const;

const scenarios = [...new Set(results.map((r) => r.scenario))];
const devices = [...new Set(results.map((r) => r.device))];
const themes = [...new Set(results.map((r) => r.theme ?? 'dark'))];
const LABEL = { initial: 'renderização inicial', scroll: 'rolagem', open: 'abrir o card' };

const values = (device: string, theme: string, scenario: string, phase: string, metric: string) =>
  results
    .filter((r) => r.device === device && (r.theme ?? 'dark') === theme && r.scenario === scenario)
    .map((r) => (r as unknown as Record<string, Row | undefined>)[phase]?.[metric] ?? 0);

const compare = (v: number[], base: number[]) => {
  const delta = median(base) ? ((median(v) - median(base)) / median(base)) * 100 : 0;
  const consistent = Math.min(...v) > Math.max(...base) || Math.max(...v) < Math.min(...base);
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%${consistent ? ' **●**' : ''}`;
};

console.log(`Environment: ${JSON.stringify(env)}\n`);
for (const device of devices) {
  for (const theme of themes) {
    for (const [phase, metrics] of Object.entries(PHASES) as [
      keyof typeof PHASES,
      readonly string[],
    ][]) {
      if (!results.some((r) => (r as unknown as Record<string, unknown>)[phase])) continue;
      console.log(`\n### ${device} · ${theme} · ${LABEL[phase]} (ms, mediana [mín–máx])\n`);
      console.log(`| Métrica | ${scenarios.join(' | ')} |`);
      console.log(`|---|${scenarios.map(() => '---').join('|')}|`);
      for (const metric of metrics) {
        const base = values(device, theme, 'none', phase, metric);
        const cells = scenarios.map((s) => {
          const v = values(device, theme, s, phase, metric);
          const cell = `${fmt(median(v))} [${fmt(Math.min(...v))}–${fmt(Math.max(...v))}]`;
          return s === 'none' ? cell : `${cell} ${compare(v, base)}`;
        });
        console.log(`| ${metric} | ${cells.join(' | ')} |`);
      }
    }
  }
}

// Each lab variant against its own original, on the metrics that moved in round 1
const variants = scenarios.filter((s) => s.includes('+'));
if (variants.length) {
  console.log(
    '\n### Variante × original (mediana da variante; variação contra o material original)\n',
  );
  console.log(
    '| Variante | Aparelho | Tema | raster rolagem | composite rolagem | frames > 33 ms rolagem | raster abrir |',
  );
  console.log('|---|---|---|---|---|---|---|');
  for (const variant of variants) {
    const original = variant.split('+')[0];
    for (const device of devices) {
      for (const theme of themes) {
        const cell = (phase: string, metric: string) => {
          const v = values(device, theme, variant, phase, metric);
          return `${fmt(median(v))} ${compare(v, values(device, theme, original, phase, metric))}`;
        };
        console.log(
          `| ${variant} | ${device} | ${theme} | ${cell('scroll', 'raster')} | ${cell('scroll', 'composite')} | ${cell('scroll', 'framesOver33ms')} | ${cell('open', 'raster')} |`,
        );
      }
    }
  }
}
console.log('\n**●** = diferença consistente: as faixas de amostras não se sobrepõem.');
