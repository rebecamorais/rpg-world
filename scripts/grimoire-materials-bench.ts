/**
 * Benchmark for the Grimoire material surfaces (/dev/grimoire/materials).
 *
 * Run against a production build, never `next dev`:
 *   npx next build && GRIMOIRE_LAB=1 npx next start -p 3006
 *   npx tsx scripts/grimoire-materials-bench.ts http://localhost:3006 out.json
 *
 * For each scenario (the card as it is today, then each material), device (desktop; phone with
 * a 4x slower CPU) and sample, it opens a fresh page with 100 SpellCards and records two phases
 * separately: the initial render, and scrolling the whole list with the mouse wheel. Chrome's
 * trace gives style, layout, paint, raster and compositing time; the page itself records frame
 * intervals and long animation frames. Samples are interleaved across scenarios so drift in the
 * machine hits all of them alike.
 */
import { type Browser, type CDPSession, type Page, chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import os from 'node:os';

const BASE = process.argv[2] ?? 'http://localhost:3006';
const OUT = process.argv[3] ?? 'grimoire-bench.json';
const SAMPLES = Number(process.env.SAMPLES ?? 5);
const COUNT = 100;

const SCENARIOS = [
  'none',
  'glacial-glass',
  'alchemical-corrosion',
  'crypt-stone',
  'divine-parchment',
] as const;
const DEVICES = {
  desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, cpu: 1, mobile: false },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, cpu: 4, mobile: true },
} as const;

// Trace events grouped by pipeline stage (Chrome's devtools.timeline names)
const GROUPS: Record<string, string[]> = {
  style: ['UpdateLayoutTree', 'RecalculateStyles'],
  layout: ['Layout'],
  paint: ['PrePaint', 'Paint', 'PaintImage'],
  raster: ['RasterTask'],
  composite: ['Layerize', 'Commit', 'UpdateLayer', 'CompositeLayers'],
  decode: ['Decode Image', 'ImageDecodeTask'],
};

type Sums = Record<keyof typeof GROUPS, number>;

interface TraceEvent {
  name: string;
  ph: string;
  dur?: number;
}

async function trace(cdp: CDPSession, run: () => Promise<void>): Promise<Sums> {
  const events: TraceEvent[] = [];
  const collect = ({ value }: { value: object[] }) =>
    events.push(...(value as unknown as TraceEvent[]));
  cdp.on('Tracing.dataCollected', collect);
  const done = new Promise<void>((resolve) => cdp.once('Tracing.tracingComplete', () => resolve()));
  await cdp.send('Tracing.start', {
    categories: 'devtools.timeline,disabled-by-default-devtools.timeline',
    transferMode: 'ReportEvents',
  });
  await run();
  await cdp.send('Tracing.end');
  await done;
  cdp.off('Tracing.dataCollected', collect);
  const sums = Object.fromEntries(Object.keys(GROUPS).map((g) => [g, 0])) as Sums;
  for (const e of events) {
    if (e.ph !== 'X' || !e.dur) continue;
    for (const [group, names] of Object.entries(GROUPS)) {
      if (names.includes(e.name)) sums[group as keyof Sums] += e.dur / 1000; // µs -> ms
    }
  }
  return sums;
}

async function scrollPhase(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[]; __loaf: number[] };
    w.__frames = [];
    w.__loaf = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__loaf.push(e.duration);
    }).observe({ type: 'long-animation-frame', buffered: false });
    const tick = (t: number) => {
      w.__frames.push(t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.mouse.move(400, 400);
  for (let i = 0; i < 110; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const w = window as unknown as { __frames: number[]; __loaf: number[] };
    const gaps = w.__frames.slice(1).map((t, i) => t - w.__frames[i]);
    const sorted = [...gaps].sort((a, b) => a - b);
    const pct = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
    return {
      frames: gaps.length,
      frameP50: pct(0.5),
      frameP95: pct(0.95),
      framesOver33ms: gaps.filter((g) => g > 33.4).length,
      longFrames: w.__loaf.length,
      longFramesMs: w.__loaf.reduce((a, b) => a + b, 0),
      scrolledTo: window.scrollY,
    };
  });
}

async function sample(browser: Browser, device: keyof typeof DEVICES, scenario: string) {
  const d = DEVICES[device];
  const context = await browser.newContext({
    viewport: d.viewport,
    deviceScaleFactor: d.deviceScaleFactor,
    isMobile: d.mobile,
    hasTouch: d.mobile,
  });
  // tsx (esbuild keepNames) wraps named functions in __name(); define it inside the page too
  await context.addInitScript({ content: 'window.__name = (fn) => fn;' });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: d.cpu });
  const query = scenario === 'none' ? `count=${COUNT}` : `material=${scenario}&count=${COUNT}`;

  let lcp = 0;
  const initial = await trace(cdp, async () => {
    await page.goto(`${BASE}/dev/grimoire/materials?${query}`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    lcp = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            resolve(entries[entries.length - 1]?.startTime ?? 0);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => resolve(0), 500);
        }),
    );
  });
  // Scroll to the list, then measure scrolling through all 100 cards
  await page.locator('[data-lab-list]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  let frames: Awaited<ReturnType<typeof scrollPhase>> | undefined;
  const scroll = await trace(cdp, async () => {
    frames = await scrollPhase(page);
  });
  await context.close();
  return { device, scenario, initial: { ...initial, lcp }, scroll: { ...scroll, ...frames! } };
}

function environment(version: string) {
  const run = (file: string, args: string[]) => {
    try {
      return execFileSync(file, args, { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  };
  return {
    date: new Date().toISOString(),
    commit: run('git', ['rev-parse', '--short', 'HEAD']),
    os: `${os.type()} ${os.release()}`,
    cpu: os.cpus()[0]?.model,
    cores: os.cpus().length,
    memoryGb: Math.round(os.totalmem() / 1e9),
    node: process.version,
    chromium: version,
    headless: true,
    samples: SAMPLES,
    cards: COUNT,
    devices: DEVICES,
  };
}

const browser = await chromium.launch();
const results: Awaited<ReturnType<typeof sample>>[] = [];
// Warm-up (server caches, fonts), not recorded
await sample(browser, 'desktop', 'none');
for (let s = 0; s < SAMPLES; s++) {
  for (const device of Object.keys(DEVICES) as (keyof typeof DEVICES)[]) {
    for (const scenario of SCENARIOS) {
      results.push(await sample(browser, device, scenario));
      process.stdout.write('.');
    }
  }
}
const env = environment(browser.version());
await browser.close();
writeFileSync(OUT, JSON.stringify({ env, results }, null, 2));
console.log(`\n${results.length} samples -> ${OUT}`);
