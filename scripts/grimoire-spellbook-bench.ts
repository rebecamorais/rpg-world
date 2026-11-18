/**
 * Benchmark of the Grimoire in the real spellbook: 100 spells on one character, with and without
 * the Grimoire, on production builds against the local test stack (database/db-test).
 *
 *   # with the Grimoire (the default build), as the e2e suite builds it
 *   NEXT_DIST_DIR=.next-e2e npm run build && NEXT_DIST_DIR=.next-e2e npm run start -- -p 3100
 *   # without it (rollback), another folder and port
 *   NEXT_PUBLIC_GRIMOIRE_SPELLBOOK=off NEXT_DIST_DIR=.next-bench-off npm run build
 *   NEXT_DIST_DIR=.next-bench-off npm run start -- -p 3102
 *   npx tsx scripts/grimoire-spellbook-bench.ts http://localhost:3100 http://localhost:3102 out.json
 *
 * Both builds and servers need the rest of the e2e environment (e2e/support/env.ts appEnv), with
 * the site URL of each port. NEXT_DIST_DIR is read at start too, so pass it to both commands.
 * For each build, theme, device (desktop; phone with a 4x slower CPU) and sample it records the
 * initial load (LCP, CLS), scrolling the whole list with the mouse wheel, hovering a few closed
 * cards (desktop) and opening three cards one after another. Samples are interleaved across the
 * two builds so drift in the machine hits both alike. The criteria: CLS 0, no frame above 50 ms
 * while opening, scrolling no worse than without the Grimoire.
 */
import { type CDPSession, type Page, chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';

import { PASSWORD, createUser } from '../e2e/support/supabase';

const ON = process.argv[2] ?? 'http://localhost:3100';
const OFF = process.argv[3] ?? 'http://localhost:3102';
const OUT = process.argv[4] ?? 'grimoire-spellbook-bench.json';
const SAMPLES = Number(process.env.SAMPLES ?? 3);
const COUNT = 100;
const THEMES = (process.env.THEMES ?? 'dark,light').split(',') as ('dark' | 'light')[];
const DEVICES = {
  desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, cpu: 1, mobile: false },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, cpu: 4, mobile: true },
} as const;
const ONLY_DEVICES = process.env.DEVICES?.split(',');

const GROUPS: Record<string, string[]> = {
  style: ['UpdateLayoutTree', 'RecalculateStyles'],
  layout: ['Layout'],
  paint: ['PrePaint', 'Paint', 'PaintImage'],
  raster: ['RasterTask'],
  composite: ['Layerize', 'Commit', 'UpdateLayer', 'CompositeLayers'],
  decode: ['Decode Image', 'ImageDecodeTask'],
};
type Sums = Record<keyof typeof GROUPS, number>;

async function trace(cdp: CDPSession, run: () => Promise<void>): Promise<Sums> {
  const events: { name: string; ph: string; dur?: number }[] = [];
  const collect = ({ value }: { value: object[] }) => events.push(...(value as typeof events));
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
      if (names.includes(e.name)) sums[group as keyof Sums] += e.dur / 1000;
    }
  }
  return sums;
}

/** Frame intervals and long animation frames (>50 ms) from now on. */
async function recordFrames(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[]; __loaf: number[]; __stop?: boolean };
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
}

function readFrames(page: Page) {
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
      frameMax: sorted[sorted.length - 1] ?? 0,
      framesOver33ms: gaps.filter((g) => g > 33.4).length,
      framesOver50ms: gaps.filter((g) => g > 50).length,
      longFrames: w.__loaf.length,
      longFramesMs: w.__loaf.reduce((a, b) => a + b, 0),
    };
  });
}

/** One user, one character with 100 spells (the same data for both builds). */
async function seed() {
  const user = await createUser('grimoire-bench');
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: ON });
  const login = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: PASSWORD },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const created = await page.request.post('/api/characters', { data: { name: 'Bench Mage' } });
  const { id } = await created.json();
  await page.request.put(`/api/characters/${id}`, {
    data: { updates: { class: 'Wizard', level: 17, spellcastingSystem: 'slots' } },
  });
  const spells = (
    JSON.parse(readFileSync('content/dnd5e/srd-5.1/spells.json', 'utf8')) as {
      id: string;
      damageType?: string;
    }[]
  )
    // Every damage spell first (all 13 types), then the rest up to 100
    .sort((a, b) => Number(!!b.damageType) - Number(!!a.damageType))
    .slice(0, COUNT);
  for (const spell of spells) {
    const res = await page.request.post(`/api/characters/${id}/spells`, {
      data: { id: `dnd5e:srd-5.1:spell:${spell.id}`, action: 'learn' },
    });
    if (!res.ok()) throw new Error(`learn ${spell.id}: ${res.status()}`);
  }
  await browser.close();
  return { user, id };
}

const { user, id } = await seed();
const browser = await chromium.launch();

async function sample(base: string, device: keyof typeof DEVICES, theme: 'dark' | 'light') {
  const d = DEVICES[device];
  const context = await browser.newContext({
    baseURL: base,
    viewport: d.viewport,
    deviceScaleFactor: d.deviceScaleFactor,
    isMobile: d.mobile,
    hasTouch: d.mobile,
  });
  await context.addInitScript({ content: 'window.__name = (fn) => fn;' });
  // Every layout shift without recent input, from the first paint on
  await context.addInitScript({
    content: `window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });`,
  });
  await context.addCookies([{ name: 'theme', value: theme, url: base }]);
  const page = await context.newPage();
  const login = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: PASSWORD },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: d.cpu });

  let lcp = 0;
  const initial = await trace(cdp, async () => {
    await page.goto(`/system/DnD_5e/character/${id}/spells`, { waitUntil: 'load' });
    await page
      .getByRole('article')
      .nth(COUNT - 1)
      .waitFor({ state: 'attached' });
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
  const grimoire = (await page.locator('article [data-school-emblem]').count()) > 0;

  let scrolling: Awaited<ReturnType<typeof readFrames>> | undefined;
  const scroll = await trace(cdp, async () => {
    await recordFrames(page);
    await page.mouse.move(700, 450);
    for (let i = 0; i < 110; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(600);
    scrolling = await readFrames(page);
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const cards = page.getByRole('article');
  let hovering: Awaited<ReturnType<typeof readFrames>> | undefined;
  const hover = d.mobile
    ? undefined
    : await trace(cdp, async () => {
        await recordFrames(page);
        for (let i = 0; i < 6; i++) {
          await cards.nth(i).hover({ position: { x: 300, y: 30 } });
          await page.waitForTimeout(450);
        }
        hovering = await readFrames(page);
      });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);

  // Open three cards one after another (each closes the one before): a damage drawing on top, a
  // stretched one, a school emblem. Clicked on the header's icon, like a person would
  let opening: Awaited<ReturnType<typeof readFrames>> | undefined;
  const open = await trace(cdp, async () => {
    await recordFrames(page);
    for (const i of [0, 1, 2]) {
      await cards.nth(i).click({ position: { x: 40, y: 24 } });
      await page.waitForTimeout(900);
    }
    opening = await readFrames(page);
  });
  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  await context.close();
  return {
    build: base === ON ? 'grimoire' : 'today',
    grimoire,
    device,
    theme,
    initial: { ...initial, lcp, cls },
    scroll: { ...scroll, ...scrolling! },
    open: { ...open, ...opening! },
    ...(hover && { hover: { ...hover, ...hovering! } }),
  };
}

const results: Awaited<ReturnType<typeof sample>>[] = [];
// Warm-up of both servers, not recorded
await sample(ON, 'desktop', 'dark');
await sample(OFF, 'desktop', 'dark');
for (let s = 0; s < SAMPLES; s++) {
  for (const device of Object.keys(DEVICES) as (keyof typeof DEVICES)[]) {
    if (ONLY_DEVICES && !ONLY_DEVICES.includes(device)) continue;
    for (const theme of THEMES) {
      for (const base of [ON, OFF]) {
        results.push(await sample(base, device, theme));
        process.stdout.write('.');
      }
    }
  }
}
const env = {
  date: new Date().toISOString(),
  os: `${os.type()} ${os.release()}`,
  cpu: os.cpus()[0]?.model,
  cores: os.cpus().length,
  node: process.version,
  chromium: browser.version(),
  samples: SAMPLES,
  cards: COUNT,
  devices: DEVICES,
};
await browser.close();
writeFileSync(OUT, JSON.stringify({ env, results }, null, 2));
console.log(`\n${results.length} samples -> ${OUT}`);
