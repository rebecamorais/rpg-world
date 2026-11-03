/**
 * Captures the screenshots shown on the public features page (public/showcase/<locale>/*.webp).
 *
 * Runs against a local app backed by the dev database, which has the real SRD spells:
 *   npx next dev -p 3005            (with .env.local pointing to the dev Supabase)
 *   npm run showcase -- [baseUrl]
 *
 * It signs in as the dev seed player, creates an example character, takes the shots in each
 * language, desktop and mobile, and deletes the character at the end. For the party screens the
 * seed player is the GM, and the second seed user joins with two characters.
 */
import { type APIRequestContext, type Page, chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const BASE_URL = process.argv[2] ?? 'http://localhost:3005';
const PLAYER = { email: 'player@email.com', password: 'player123' };
// Joins the example party as a player
const COMPANION = { email: 'user-normal@example.com', password: 'AnotherValidPassword123!' };
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

const item = (id: string) => `dnd5e:srd-5.2:item:${id}`;
const coins = (gp: number, sp = 0, cp = 0, pp = 0) => ({ cp, sp, ep: 0, gp, pp });

// The example character's coin pouch and backpack
const ARANI_COINS = coins(47, 8, 15, 2);
const ARANI_ITEMS: [string, number][] = [
  ['quarterstaff', 1],
  ['component-pouch', 1],
  ['ink', 1],
  ['ink-pen', 1],
  ['candle', 5],
  ['rations', 5],
  ['bedroll', 1],
];
// The party chest
const CHEST_COINS = coins(320, 45, 0, 12);
const CHEST_ITEMS: [string, number][] = [
  ['rope', 2],
  ['torch', 10],
  ['healer-s-kit', 1],
  ['crowbar', 1],
  ['grappling-hook', 1],
  ['hooded-lantern', 1],
  ['oil', 4],
];

const PARTY_NAME = 'Candlekeep';

type Companion = {
  name: string;
  base: object;
  byLocale: Record<Locale, { updates: object; lore: object }>;
};

// The second seed user's characters, brought to the party
const COMPANIONS: Companion[] = [
  {
    name: 'Bram',
    base: {
      level: 5,
      accentColor: '#b45309',
      ac: 18,
      hpMax: 49,
      hpCurrent: 49,
      attributes: { STR: 17, DEX: 10, CON: 16, INT: 9, WIS: 13, CHA: 11 },
      skills: { ATHLETICS: { isProficient: true }, PERCEPTION: { isProficient: true } },
    },
    byLocale: {
      en: {
        updates: { class: 'Fighter', race: 'Dwarf', background: 'Soldier' },
        lore: {
          personalityTraits: 'Tells the same war story at every tavern, a little bigger each time.',
          ideals: 'Nobody gets left behind.',
          bonds: 'The axe of his old captain, carried but never used.',
          flaws: 'Picks a fight before asking a question.',
        },
      },
      pt: {
        updates: { class: 'Guerreiro', race: 'Anão', background: 'Soldado' },
        lore: {
          personalityTraits: 'Conta a mesma história de guerra em toda taverna, cada vez maior.',
          ideals: 'Ninguém fica para trás.',
          bonds: 'O machado do seu antigo capitão, carregado mas nunca usado.',
          flaws: 'Briga antes de perguntar.',
        },
      },
    },
  },
  {
    name: 'Lia',
    base: {
      level: 5,
      accentColor: '#047857',
      ac: 15,
      hpMax: 33,
      hpCurrent: 33,
      attributes: { STR: 8, DEX: 18, CON: 12, INT: 13, WIS: 14, CHA: 12 },
      skills: {
        STEALTH: { isProficient: true, expertise: true },
        INSIGHT: { isProficient: true },
        PERCEPTION: { isProficient: true, expertise: true },
      },
    },
    byLocale: {
      en: {
        updates: { class: 'Rogue', race: 'Halfling', background: 'Criminal' },
        lore: {
          personalityTraits: 'Always knows where the exits are.',
          ideals: 'Freedom. Chains are meant to be broken.',
          bonds: 'Owes her life to the fence who raised her.',
          flaws: 'Cannot resist a locked box.',
        },
      },
      pt: {
        updates: { class: 'Ladina', race: 'Halfling', background: 'Criminosa' },
        lore: {
          personalityTraits: 'Sempre sabe onde ficam as saídas.',
          ideals: 'Liberdade. Correntes existem para ser quebradas.',
          bonds: 'Deve a vida ao receptador que a criou.',
          flaws: 'Não resiste a uma caixa trancada.',
        },
      },
    },
  },
];

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

async function json<T>(res: Awaited<ReturnType<APIRequestContext['get']>>, what: string) {
  return (await (await ok(res, what)).json()) as T;
}

type Inventory = { containers: { id: string; kind: string }[] };

/** Fills a coin pouch (or the party chest) and a container with items, through `inventory`. */
async function stock(
  request: APIRequestContext,
  inventory: string,
  money: object,
  items: [string, number][],
) {
  const { containers } = await json<Inventory>(await request.get(inventory), 'read inventory');
  const pouch = containers.find((c) => c.kind === 'coin_pouch' || c.kind === 'party_chest')!;
  const bag = containers.find((c) => c.kind === 'backpack' || c.kind === 'party_chest')!;
  await ok(
    await request.put(`${inventory}/coins`, { data: { containerId: pouch.id, coins: money } }),
    'coins',
  );
  for (const [id, quantity] of items) {
    await ok(
      await request.post(`${inventory}/items`, {
        data: { ref: item(id), containerId: bag.id, quantity },
      }),
      `add ${id}`,
    );
  }
}

type Encounter = { rows: { participantId: string; side: string; name: string }[] };

/**
 * A fight in round 1: the two companions against three goblins. The first goblin acts first, so
 * its open card shows the poison and the damage; the last one is down.
 */
async function setUpCombat(
  request: APIRequestContext,
  partyId: string,
  characterIds: string[],
  goblin: string,
) {
  const base = `/api/parties/${partyId}/encounter`;
  await ok(await request.post(base), 'create encounter');
  for (const characterId of characterIds) {
    await ok(await request.post(`${base}/participants`, { data: { characterId } }), 'add player');
  }
  await ok(
    await request.post(`${base}/participants`, {
      data: { characterId: goblin, count: 3, side: 'enemy' },
    }),
    'add goblins',
  );

  const { rows } = await json<Encounter>(await request.get(base), 'read encounter');
  // Rows come in the order they were added: Bram, Lia, then the goblins
  const initiative = [17, 15, 20, 9, 4];
  const hurt: Record<number, number> = { 2: 3, 4: 0 };
  for (const [i, row] of rows.entries()) {
    const data: Record<string, number> = { initiative: initiative[i] ?? 1 };
    if (hurt[i] !== undefined) data.hpCurrent = hurt[i];
    await ok(await request.patch(`${base}/participants/${row.participantId}`, { data }), 'patch');
  }
  const byInitiative = rows
    .map((row, i) => ({ id: row.participantId, initiative: initiative[i] ?? 1 }))
    .sort((a, b) => b.initiative - a.initiative)
    .map((row) => row.id);
  await ok(await request.put(`${base}/order`, { data: { participantIds: byInitiative } }), 'order');
  const poisoned = rows.find((r) => r.side === 'enemy')!;
  await ok(
    await request.put(`${base}/participants/${poisoned.participantId}/conditions`, {
      data: { conditions: [{ key: 'dnd5e:srd-5.2:condition:poisoned', level: null }] },
    }),
    'conditions',
  );
  await ok(await request.post(`${base}/start`), 'start');
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

  const companionContext = await browser.newContext({ baseURL: BASE_URL });
  const companion = companionContext.request;
  await ok(await companion.post('/api/auth/login', { data: COMPANION }), 'companion login');
  // The Role Play cards show who plays each character
  const profile = await json<{ usernameChosen: boolean }>(
    await companion.get('/api/profile'),
    'profile',
  );
  if (!profile.usernameChosen) {
    await ok(await companion.patch('/api/profile', { data: { username: 'bia' } }), 'username');
  }
  const companionIds: string[] = [];
  let partyId: string | null = null;
  let goblinId: string | null = null;

  try {
    await stock(request, `/api/characters/${id}/inventory`, ARANI_COINS, ARANI_ITEMS);

    // The party: the seed player is the GM, the companion joins with two characters
    ({ id: partyId } = await json<{ id: string }>(
      await request.post('/api/parties', { data: { name: PARTY_NAME } }),
      'create party',
    ));
    const party = `/api/parties/${partyId}`;
    const { gm } = await json<{ gm: { inviteCode: string } }>(await request.get(party), 'party');
    await ok(await companion.post(`/api/parties/join/${gm.inviteCode}`), 'join');
    const { people } = await json<{ people: { userId: string; status: string }[] }>(
      await request.get(party),
      'party people',
    );
    const asked = people.find((p) => p.status === 'requested')!;
    await ok(await request.patch(`${party}/members/${asked.userId}`), 'approve');
    for (const c of COMPANIONS) {
      const made = await json<{ id: string }>(
        await companion.post('/api/characters', { data: { name: c.name } }),
        `create ${c.name}`,
      );
      companionIds.push(made.id);
    }
    await ok(
      await companion.put(`${party}/my-characters`, { data: { characterIds: companionIds } }),
      'bring characters',
    );
    await stock(request, `${party}/chest`, CHEST_COINS, CHEST_ITEMS);
    ({ id: goblinId } = await json<{ id: string }>(
      await request.post('/api/characters', { data: { name: 'Goblin', kind: 'npc' } }),
      'create goblin',
    ));
    await ok(
      await request.put(`/api/characters/${goblinId}`, {
        data: {
          updates: {
            hpMax: 7,
            hpCurrent: 7,
            ac: 15,
            attributes: { STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 8, CHA: 8 },
          },
        },
      }),
      'goblin sheet',
    );
    await setUpCombat(request, partyId, companionIds, goblinId);

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
      for (const [i, c] of COMPANIONS.entries()) {
        const local = c.byLocale[locale];
        await ok(
          await companion.put(`/api/characters/${companionIds[i]}`, {
            data: { updates: { ...c.base, ...local.updates } },
          }),
          `update ${c.name}`,
        );
        await ok(
          await companion.put(`/api/characters/${companionIds[i]}/lore`, { data: local.lore }),
          `lore ${c.name}`,
        );
      }
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

        await page.goto(`${sheet}/inventory`);
        await page
          .getByText(/quarterstaff|bordão/i)
          .first()
          .waitFor();
        await shot(page, out('inventory'), viewport.outWidth, content, viewport.maxHeight);

        await page.goto(`/parties/${partyId}?mode=roleplay`);
        await page.getByText('Bram', { exact: true }).first().waitFor();
        await shot(page, out('party'), viewport.outWidth, content, viewport.maxHeight);

        await page.goto(`/parties/${partyId}?mode=combat`);
        await page.getByText('Goblin', { exact: false }).first().waitFor();
        await shot(page, out('combat'), viewport.outWidth, content, viewport.maxHeight);

        await page.goto(`/parties/${partyId}/inventory`);
        await page
          .getByText(/rope|corda/i)
          .first()
          .waitFor();
        await shot(page, out('chest'), viewport.outWidth, content, viewport.maxHeight);

        await page.close();
      }
    }
    await writeFile(MANIFEST, `${JSON.stringify(sizes, null, 2)}\n`);
    console.log('saved', MANIFEST);
  } finally {
    if (partyId) await request.delete(`/api/parties/${partyId}`);
    if (goblinId) await request.delete(`/api/characters/${goblinId}`);
    for (const companionId of companionIds)
      await companion.delete(`/api/characters/${companionId}`);
    await request.delete(`/api/characters/${id}`);
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
