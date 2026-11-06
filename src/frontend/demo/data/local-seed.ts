import type { DemoData } from '../types';
import { buildDemoData } from './build';

/*
 * The SQL that loads The Pioneers into the local dev database, as a real party with real accounts.
 * Everything comes from the demo's data, so the two can't drift (local-seed.unit.test.ts checks it).
 * The passwords are public: this file only ever goes to database/db-dev/seeds.
 */

export const LOCAL_SEED_FILE = 'database/db-dev/seeds/01-seed-the-pioneers.sql';

const PARTY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const USERS = {
  gm: {
    id: 'c0000000-0000-4000-8000-000000000001',
    email: 'mestre@email.com',
    password: 'mestre123',
    username: 'mestre',
  },
  chilli: {
    id: 'c0000000-0000-4000-8000-000000000002',
    email: 'playerchilli@email.com',
    password: 'chilli123',
    username: 'playerChilli',
  },
  pepper: {
    id: 'c0000000-0000-4000-8000-000000000003',
    email: 'playerpepper@email.com',
    password: 'pepper123',
    username: 'playerPepper',
  },
};

type Player = 'chilli' | 'pepper';

/** Who plays each character at the table. The others are the GM's NPC sheets. */
const SEATS: Record<string, Player> = {
  grace: 'chilli',
  hedy: 'chilli',
  mirela: 'chilli',
  ada: 'pepper',
  katherine: 'pepper',
  maren: 'pepper',
};

const LORE_COLUMNS = {
  age: 'age',
  height: 'height',
  weight: 'weight',
  eyes: 'eyes',
  skin: 'skin',
  hair: 'hair',
  personalityTraits: 'personality_traits',
  ideals: 'ideals',
  bonds: 'bonds',
  flaws: 'flaws',
  backstory: 'backstory',
  alliesAndEnemies: 'allies_and_enemies',
  organizations: 'organizations',
  treasure: 'treasure',
} as const;

const text = (value: string) => `'${value.replaceAll("'", "''")}'`;
const json = (value: unknown) => `${text(JSON.stringify(value))}::jsonb`;

function userSql({ id, email, password, username }: (typeof USERS)[keyof typeof USERS]) {
  return `INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone, phone_change, phone_change_token, email_change_token_current
) VALUES (
  ${text(id)}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  ${text(email)}, crypt(${text(password)}, gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}',
  now(), now(),
  '', '', '', '',
  NULL, '', '', ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(), ${text(id)},
  ${json({ sub: id, email })},
  'email', ${text(id)}, now(), now(), now()
);
-- The sign-up trigger made the profile with a placeholder name; this one counts as chosen
UPDATE public.profile SET username = ${text(username)}, username_chosen = true WHERE id = ${text(id)};`;
}

function inventorySql(owner: string, inventory: DemoData['chest']) {
  const pouch = inventory.containers[0];
  const holder = inventory.containers[inventory.containers.length - 1];
  const items = inventory.items
    .map(
      ({ ref, quantity }) =>
        `INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, ${text(ref)}, ${quantity} FROM public.containers WHERE ${owner} AND kind = ${text(holder.kind)};`,
    )
    .join('\n');
  return `UPDATE public.containers SET coins = ${json(pouch.coins)} WHERE ${owner} AND kind = ${text(pouch.kind)};
${items}`;
}

function characterSql(data: DemoData, slug: string, index: number, gmOwned: boolean) {
  const id = `e0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
  const owner = gmOwned ? USERS.gm : USERS[SEATS[slug]];
  const lore = data.lore[slug];
  const {
    /* Columns of their own, or the lore row below */
    id: _id,
    ownerUsername: _ownerUsername,
    system: _system,
    name,
    level,
    avatarUrl,
    accentColor,
    hpCurrent,
    hpMax,
    attributes,
    backstory: _backstory,
    personalityTraits: _personalityTraits,
    ideals: _ideals,
    bonds: _bonds,
    flaws: _flaws,
    treasure: _treasure,
    ...systemData
  } = data.characters[slug];
  const columns = Object.values(LORE_COLUMNS).join(', ');
  const values = Object.keys(LORE_COLUMNS)
    .map((field) => {
      const value = lore[field as keyof typeof LORE_COLUMNS];
      return value ? text(value) : 'NULL';
    })
    .join(', ');
  const spells = (data.spells[slug] as string[])
    .map(
      (ref) =>
        `INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES (${text(id)}, ${text(ref)}, true);`,
    )
    .join('\n');

  return [
    `-- ${name}`,
    `INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  ${text(id)}, ${text(owner.id)}, ${text(name)}, 'dnd_5e', ${text(gmOwned ? 'npc' : 'pc')}, ${level}, ${hpCurrent}, ${hpMax},
  ${text(avatarUrl ?? '')}, ${text(accentColor ?? '')},
  ${json(attributes)},
  ${json(systemData)}
);`,
    `INSERT INTO public.character_lore (character_id, ${columns})\nVALUES (${text(id)}, ${values});`,
    spells,
    inventorySql(`character_id = ${text(id)}`, data.inventories[slug]),
    gmOwned
      ? ''
      : `INSERT INTO public.party_characters (party_id, character_id) VALUES (${text(PARTY_ID)}, ${text(id)});`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function renderLocalSeed(): string {
  const data = buildDemoData('pt');
  const atTable = new Set(data.party.roster.map((entry) => entry.characterId));
  for (const slug of atTable) {
    if (!SEATS[slug]) throw new Error(`Nobody plays ${slug}: add it to SEATS`);
  }

  const users = Object.values(USERS);
  const emails = users.map((user) => text(user.email)).join(', ');
  const characters = Object.keys(data.characters).map((slug, index) =>
    characterSql(data, slug, index, !atTable.has(slug)),
  );

  return `-- Generated from the demo's data by \`npm run seed:local\`. Do not edit by hand.
-- Local development only: these accounts and passwords are public (see docs/ambiente-local.md).

-- Safe to run again: starts over from these accounts
DELETE FROM public.parties WHERE id = ${text(PARTY_ID)};
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN (${emails}));
DELETE FROM auth.users WHERE email IN (${emails});

${users.map(userSql).join('\n\n')}

-- ${data.party.name}: no picture, since the database only takes one the GM uploaded
INSERT INTO public.parties (id, name, system, edition, gm_id)
VALUES (${text(PARTY_ID)}, ${text(data.party.name)}, 'dnd_5e', ${text(data.party.edition)}, ${text(USERS.gm.id)});
INSERT INTO public.party_members (party_id, user_id, status) VALUES
  (${text(PARTY_ID)}, ${text(USERS.chilli.id)}, 'active'),
  (${text(PARTY_ID)}, ${text(USERS.pepper.id)}, 'active');
${inventorySql(`party_id = ${text(PARTY_ID)}`, data.chest)}

${characters.join('\n\n')}
`;
}
