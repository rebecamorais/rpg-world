/**
 * Summarizes grimoire-materials-bench.ts output as Markdown tables.
 *   npx tsx scripts/grimoire-materials-report.ts bench.json
 *
 * For each device, phase and metric: the median and the [min–max] range of the samples, and the
 * median's change against the card as it is today ("none"). A difference is marked consistent
 * only when the ranges don't overlap (every material sample above, or below, every baseline one).
 */
import { readFileSync } from 'node:fs';

type Row = Record<string, number>;
interface Result {
  device: string;
  scenario: string;
  initial: Row;
  scroll: Row;
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

console.log(`Environment: ${JSON.stringify(env)}\n`);
for (const device of devices) {
  for (const [phase, metrics] of Object.entries(PHASES) as [
    keyof typeof PHASES,
    readonly string[],
  ][]) {
    console.log(
      `\n### ${device} · ${phase === 'initial' ? 'renderização inicial' : 'rolagem'} (ms, mediana [mín–máx])\n`,
    );
    console.log(`| Métrica | ${scenarios.join(' | ')} |`);
    console.log(`|---|${scenarios.map(() => '---').join('|')}|`);
    for (const metric of metrics) {
      const values = (s: string) =>
        results
          .filter((r) => r.device === device && r.scenario === s)
          .map((r) => r[phase][metric] ?? 0);
      const base = values('none');
      const cells = scenarios.map((s) => {
        const v = values(s);
        const cell = `${fmt(median(v))} [${fmt(Math.min(...v))}–${fmt(Math.max(...v))}]`;
        if (s === 'none') return cell;
        const delta = median(base) ? ((median(v) - median(base)) / median(base)) * 100 : 0;
        const consistent = Math.min(...v) > Math.max(...base) || Math.max(...v) < Math.min(...base);
        return `${cell} ${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%${consistent ? ' **●**' : ''}`;
      });
      console.log(`| ${metric} | ${cells.join(' | ')} |`);
    }
  }
}
console.log('\n**●** = diferença consistente: as faixas de amostras não se sobrepõem.');
