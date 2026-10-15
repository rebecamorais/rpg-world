/**
 * Captures the screenshots shown on the public features page (public/showcase/<locale>/*.webp).
 *
 * Runs against a local app backed by the dev database, which has the real SRD spells:
 *   npx next dev -p 3005            (with .env.local pointing to the dev Supabase)
 *   npm run showcase -- [baseUrl]
 *
 * It signs in as the dev seed player, creates an example character, takes the shots in each
 * language, desktop and mobile, and deletes the character at the end.
 */
import { type APIRequestContext, type Page, chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const BASE_URL = process.argv[2] ?? 'http://localhost:3005';
const PLAYER = { email: 'player@email.com', password: 'player123' };
const OUT_DIR = 'public/showcase';
// Image sizes for next/image, read by the features page
const MANIFEST = 'src/frontend/constants/showcase.generated.json';
const sizes: Record<string, { width: number; height: number }> = {};

const LOCALES = ['en', 'pt'] as const;
type Locale = (typeof LOCALES)[number];

const VIEWPORTS = {
  desktop: { width: 1280, height: 900, maxHeight: 820, outWidth: 1200 },
  mobile: { width: 412, height: 915, maxHeight: 860, outWidth: 412 },
} as const;

// Learned by the example character; the first ones are also prepared
const SPELLS = ['Fire Bolt', 'Light', 'Mage Hand', 'Shield', 'Magic Missile', 'Mage Armor'];
const PREPARED = ['Shield', 'Magic Missile', 'Mage Armor'];
const LEARNED_EXTRA = ['Fireball', 'Misty Step', 'Detect Magic'];

const CHARACTER: Record<Locale, { updates: object; lore: object; spellName: RegExp }> = {
  en: {
    updates: { class: 'Wizard', race: 'High Elf', background: 'Sage', alignment: 'Neutral Good' },
    lore: {
      age: '142',
      height: '1.70 m',
      eyes: 'Silver',
      hair: 'Black, braided',
      personalityTraits: 'Speaks to her books as if they could answer. Never refuses a riddle.',
      ideals: 'Knowledge is the path to power and self-improvement.',
      bonds: 'The lost spellbook of her master, stolen from Candlekeep.',
      flaws: 'Trusts anyone who carries a rare book.',
      backstory:
        'Raised among the archives of Candlekeep, Arani left the library the night her master ' +
        'vanished, following the only clue he left behind: a burned page and a name.',
    },
    spellName: /Magic Missile/,
  },
  pt: {
    updates: { class: 'Maga', race: 'Alta Elfa', background: 'Sábia', alignment: 'Neutra e Boa' },
    lore: {
      age: '142',
      height: '1,70 m',
      eyes: 'Prateados',
      hair: 'Pretos, trançados',
      personalityTraits:
        'Conversa com os livros como se eles respondessem. Nunca recusa um enigma.',
      ideals: 'O conhecimento é o caminho para o poder e para melhorar a si mesma.',
      bonds: 'O grimório perdido do seu mestre, roubado de Candlekeep.',
      flaws: 'Confia em qualquer pessoa que carregue um livro raro.',
      backstory:
        'Criada entre os arquivos de Candlekeep, Arani deixou a biblioteca na noite em que seu ' +
        'mestre desapareceu, seguindo a única pista que ele deixou: uma página queimada e um nome.',
    },
    spellName: /Mísseis Mágicos/,
  },
};

const BASE_UPDATES = {
  level: 5,
  xp: 9800,
  accentColor: '#6d28d9',
  ac: 15,
  initiative: 3,
  speed: 30,
  hpMax: 32,
  hpCurrent: 24,
  hpTemp: 5,
  attributes: { STR: 8, DEX: 16, CON: 14, INT: 18, WIS: 12, CHA: 10 },
  savingThrowProficiencies: { INT: true, WIS: true },
  skills: {
    ARCANA: { isProficient: true, expertise: true },
    HISTORY: { isProficient: true },
    INVESTIGATION: { isProficient: true },
    INSIGHT: { isProficient: true },
  },
  spellcastingSystem: 'slots',
  spellSlots: { '1': { max: 4, used: 1 }, '2': { max: 3, used: 1 }, '3': { max: 2, used: 0 } },
};

// Only the page content: no header, sidebar, footer, save bar or dev overlays
const CONTENT_ONLY_CSS = `
  /* Only the site's own header, sidebar and footer; cards and dialogs have headers too */
  header:not(main header, [role='dialog'] header),
  aside:not(main aside, [role='dialog'] aside),
  footer:not(main footer, [role='dialog'] footer) { display: none !important; }
  nextjs-portal, [data-sonner-toaster] { display: none !important; }
  /* Spell cards skip rendering while off screen; a screenshot needs them painted */
  article { content-visibility: visible !important; }
`;

const DIALOG = '[role="dialog"]';

async function ok(res: Awaited<ReturnType<APIRequestContext['get']>>, what: string) {
  if (!res.ok()) throw new Error(`${what} failed with ${res.status()}: ${await res.text()}`);
  return res;
}

async function findSpellId(request: APIRequestContext, name: string): Promise<string> {
  const res = await ok(
    await request.get(`/api/spells?search=${encodeURIComponent(name)}&locale=en&limit=20`),
    `search ${name}`,
  );
  const { data } = (await res.json()) as { data: { id: string; name: string }[] };
  const spell = data.find((s) => s.name === name);
  if (!spell) throw new Error(`Spell not found: ${name}`);
  return spell.id;
}

async function shot(page: Page, file: string, outWidth: number, clipTo: string, maxHeight: number) {
  await page.addStyleTag({ content: CONTENT_ONLY_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const target = page.locator(clipTo).first();
  // A fixed dialog doesn't survive the full-page capture; shoot the element itself
  if (clipTo === DIALOG) {
    const png = await target.screenshot();
    await save(png, file, outWidth);
    return;
  }
  const box = await target.boundingBox();
  if (!box) throw new Error(`Nothing to capture at ${clipTo}`);
  // boundingBox is relative to the viewport; a full-page clip needs page coordinates
  const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const png = await page.screenshot({
    fullPage: true,
    clip: {
      x: box.x + scroll.x,
      y: box.y + scroll.y,
      width: box.width,
      height: Math.min(box.height, maxHeight),
    },
  });
  await save(png, file, outWidth);
}

async function save(png: Buffer, file: string, outWidth: number) {
  const info = await sharp(png)
    .resize({ width: outWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(file);
  sizes[file.replace('public', '')] = { width: info.width, height: info.height };
  console.log('saved', file);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const { request } = context;

  await ok(await request.post('/api/auth/login', { data: PLAYER }), 'login');
  const created = await ok(
    await request.post('/api/characters', { data: { name: 'Arani' } }),
    'create character',
  );
  const { id } = (await created.json()) as { id: string };
  const sheet = `/system/DnD_5e/character/${id}`;

  try {
    for (const name of [...SPELLS, ...LEARNED_EXTRA]) {
      const spellId = await findSpellId(request, name);
      await ok(
        await request.post(`/api/characters/${id}/spells`, {
          data: { id: spellId, action: 'learn' },
        }),
        `learn ${name}`,
      );
      if (PREPARED.includes(name)) {
        await ok(
          await request.post(`/api/characters/${id}/spells`, {
            data: { id: spellId, action: 'prepare' },
          }),
          `prepare ${name}`,
        );
      }
    }

    for (const locale of LOCALES) {
      const { updates, lore, spellName } = CHARACTER[locale];
      await ok(
        await request.put(`/api/characters/${id}`, {
          data: { updates: { ...BASE_UPDATES, ...updates } },
        }),
        'update character',
      );
      await ok(await request.put(`/api/characters/${id}/lore`, { data: lore }), 'update lore');
      await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, url: BASE_URL }]);
      await mkdir(`${OUT_DIR}/${locale}`, { recursive: true });

      for (const [device, viewport] of Object.entries(VIEWPORTS)) {
        const page = await context.newPage();
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const out = (name: string) => `${OUT_DIR}/${locale}/${name}-${device}.webp`;
        const content = 'main .max-w-5xl';

        await page.goto(sheet);
        await page.getByRole('heading', { level: 1 }).waitFor();
        await shot(page, out('sheet'), viewport.outWidth, content, viewport.maxHeight);

        await page.goto(`${sheet}/spells`);
        const expanded = page.getByRole('article', { name: spellName }).first();
        await expanded.locator('button[aria-expanded]').first().click();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(400);
        await shot(page, out('spellbook'), viewport.outWidth, content, viewport.maxHeight);

        await page
          .locator('main button')
          .filter({ hasText: /add spell|adicionar magia/i })
          .first()
          .click();
        const dialog = page.getByRole('dialog').first();
        await page.addStyleTag({ content: CONTENT_ONLY_CSS });
        await dialog.locator('article h3').first().waitFor({ state: 'attached' });
        // The search runs after a debounce; wait for its response, then for the cards to paint
        const searched = page.waitForResponse((res) => res.url().includes('search='));
        await dialog.getByRole('searchbox').fill(locale === 'pt' ? 'fogo' : 'fire');
        await searched;
        await dialog.locator('article h3').first().waitFor({ state: 'attached' });
        await page.waitForTimeout(1000);
        await shot(page, out('search'), viewport.outWidth, DIALOG, viewport.maxHeight);
        await page.keyboard.press('Escape');

        await page.goto(`${sheet}/lore`);
        await page.getByRole('heading', { level: 1 }).waitFor();
        await shot(page, out('lore'), viewport.outWidth, content, viewport.maxHeight);

        await page.close();
      }
    }
    await writeFile(MANIFEST, `${JSON.stringify(sizes, null, 2)}\n`);
    console.log('saved', MANIFEST);
  } finally {
    await request.delete(`/api/characters/${id}`);
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
