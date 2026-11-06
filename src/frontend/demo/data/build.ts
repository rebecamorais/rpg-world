import 'server-only';

import type { LoreData } from '@frontend/hooks/useCharacterLore';

import type {
  InventoryContainer,
  InventoryDto,
} from '@backend/contexts/characters/domain/repository/inventory.repo';
import { getItemCatalog } from '@backend/contexts/items';
import type { MyParties } from '@backend/contexts/parties/domain/Party';
import type { PartyView, RolePlayCard } from '@backend/contexts/parties/domain/PartyView';
import { getSpellCatalog } from '@backend/contexts/spells';

import { SKILLS_CATALOG } from '@shared/systems/dnd5e/constants/skill';
import type { SkillKey } from '@shared/systems/dnd5e/constants/skill';
import type { AttributeKey, DnD5eCharacter } from '@shared/systems/dnd5e/types';
import type { CharacterSummary } from '@shared/types/character';

import { DEMO_GM_ID, DEMO_OWNER, DEMO_PARTY_ID } from '../ids';
import type { DemoData, DemoLocale, Inspiration } from '../types';
import { APPEARANCE } from './appearance';
import { HEROES } from './heroes';
import type { Hero } from './heroes';
import { INSPIRATIONS } from './inspirations';
import { CHEST, SHEETS, itemKey, spellKey } from './sheets';
import type { Sheet } from './sheets';

const PARTY_NAME = 'The Pioneers';
const ATTRIBUTES: AttributeKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

const mod = (score: number) => Math.floor((score - 10) / 2);
const proficiency = (level: number) => 2 + Math.floor((level - 1) / 4);
const imageOf = (hero: Hero) => `/demo/pioneers/${hero.image}`;

function buildCharacter(hero: Hero, sheet: Sheet, locale: DemoLocale): DnD5eCharacter {
  const attributes = Object.fromEntries(
    ATTRIBUTES.map((key, i) => [key, sheet.scores[i]]),
  ) as Record<AttributeKey, number>;
  const bonus = proficiency(sheet.level);
  const skills: Partial<Record<SkillKey, { isProficient: boolean }>> = Object.fromEntries(
    sheet.skills.map((skill) => [skill, { isProficient: true }]),
  );
  const passive = (skill: SkillKey) =>
    10 + mod(attributes[SKILLS_CATALOG[skill].attribute]) + (skills[skill] ? bonus : 0);
  const conMod = mod(attributes.CON);
  const hpMax = sheet.hitDie + conMod + (sheet.level - 1) * (sheet.hitDie / 2 + 1 + conMod);
  const character: DnD5eCharacter = {
    id: hero.slug,
    ownerUsername: DEMO_OWNER,
    system: 'DnD_5e',
    name: hero.name,
    level: sheet.level,
    avatarUrl: imageOf(hero),
    accentColor: hero.accentColor,
    backstory: hero.lore[locale],
    race: sheet.race[locale],
    class: hero.className[locale],
    subclass: sheet.subclass?.[locale],
    background: sheet.background[locale],
    alignment: sheet.alignment,
    hpCurrent: hpMax,
    hpMax,
    hpTemp: 0,
    ac: sheet.ac,
    speed: sheet.speed,
    initiative: mod(attributes.DEX),
    hitDice: { total: `${sheet.level}d${sheet.hitDie}`, current: sheet.level },
    deathSaves: { successes: 0, failures: 0 },
    attributes,
    skills,
    savingThrowProficiencies: Object.fromEntries(
      ATTRIBUTES.map((key) => [key, sheet.saves.includes(key)]),
    ) as Record<AttributeKey, boolean>,
    passivePerception: passive('PERCEPTION'),
    personalityTraits: hero.personality[locale],
    ideals: hero.ideals[locale],
    bonds: hero.bonds[locale],
    flaws: hero.flaws[locale],
    treasure: hero.item[locale],
  };
  if (sheet.caster) {
    const abilityMod = mod(attributes[sheet.caster.ability]);
    character.spellcastingSystem = 'slots';
    character.spellcastingAbility = sheet.caster.ability;
    character.spellSaveDc = 8 + bonus + abilityMod;
    character.spellAttackBonus = bonus + abilityMod;
    character.spellSlots = Object.fromEntries(
      sheet.caster.slots.map((max, i) => [String(i + 1), { max, used: 0 }]),
    );
  }
  return character;
}

function buildInventory(
  ownerId: string,
  gear: [string, number][],
  coins: { gp: number; sp: number; cp: number },
  locale: DemoLocale,
  chest = false,
): InventoryDto {
  const catalog = getItemCatalog();
  const empty = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const containers: InventoryContainer[] = chest
    ? [
        {
          id: `${ownerId}-chest`,
          kind: 'party_chest',
          name: null,
          position: 0,
          coins: { ...empty, ...coins },
        },
      ]
    : [
        {
          id: `${ownerId}-pouch`,
          kind: 'coin_pouch',
          name: null,
          position: 0,
          coins: { ...empty, ...coins },
        },
        { id: `${ownerId}-backpack`, kind: 'backpack', name: null, position: 1, coins: empty },
      ];
  const container = containers[containers.length - 1];
  const keys = gear.map(([id]) => itemKey(id));
  const resolved = new Map(catalog.findByKeys(keys, locale).map((item) => [item.key, item]));
  return {
    containers,
    items: gear.map(([id, quantity]) => ({
      id: `${ownerId}-${id}`,
      containerId: container.id,
      ref: itemKey(id),
      quantity,
      item: resolved.get(itemKey(id)) ?? null,
    })),
  };
}

function inspirationOf(slug: string, locale: DemoLocale): Inspiration {
  const { realName, period, contribution, sources } = INSPIRATIONS[slug];
  return { realName, period, contribution: contribution[locale], sources };
}

/** The whole demo campaign in one language. Pure data: nothing here is read from or saved to the database. */
export function buildDemoData(locale: DemoLocale): DemoData {
  const characters: Record<string, DnD5eCharacter> = {};
  const lore: Record<string, LoreData> = {};
  const spells: Record<string, string[]> = {};
  const inventories: Record<string, InventoryDto> = {};
  const inspirations: Record<string, Inspiration> = {};

  for (const hero of HEROES) {
    const sheet = SHEETS[hero.slug];
    const character = buildCharacter(hero, sheet, locale);
    characters[hero.slug] = character;
    const look = APPEARANCE[hero.slug];
    lore[hero.slug] = {
      age: look.age[locale],
      height: look.height[locale],
      weight: look.weight[locale],
      eyes: look.eyes[locale],
      skin: look.skin[locale],
      hair: look.hair[locale],
      backstory: character.backstory,
      personalityTraits: character.personalityTraits,
      ideals: character.ideals,
      bonds: character.bonds,
      flaws: character.flaws,
      treasure: character.treasure,
    };
    spells[hero.slug] = (sheet.caster?.spells ?? []).map(spellKey);
    inventories[hero.slug] = buildInventory(hero.slug, sheet.gear, sheet.coins, locale);
    inspirations[hero.slug] = inspirationOf(hero.slug, locale);
  }

  const table = HEROES.filter((hero) => hero.atTable);
  const ownerOf = (slug: string) => `demo-player-${slug}`;
  const roster = table.map((hero) => {
    const c = characters[hero.slug];
    return {
      characterId: hero.slug,
      ownerId: ownerOf(hero.slug),
      name: c.name,
      avatarUrl: c.avatarUrl ?? null,
      race: c.race,
      class: c.class,
      level: c.level,
      accentColor: c.accentColor ?? null,
    };
  });
  const rolePlay: RolePlayCard[] = roster.map((entry) => {
    const c = characters[entry.characterId];
    return {
      ...entry,
      ownerUsername: `pioneer_${entry.characterId}`,
      personalityTraits: c.personalityTraits ?? null,
      ideals: c.ideals ?? null,
      bonds: c.bonds ?? null,
      flaws: c.flaws ?? null,
      passivePerception: c.passivePerception ?? 10,
      passiveInsight: 10 + mod(c.attributes.WIS) + (c.skills.INSIGHT ? proficiency(c.level) : 0),
    };
  });

  const party: PartyView = {
    id: DEMO_PARTY_ID,
    name: PARTY_NAME,
    system: 'DnD_5e',
    edition: '2014',
    imageUrl: imageOf(HEROES[0]),
    role: 'gm',
    hasGm: true,
    gmClaim: null,
    people: [
      { userId: DEMO_GM_ID, username: DEMO_OWNER, avatarUrl: null, status: 'gm' },
      ...roster.map((entry) => ({
        userId: entry.ownerId,
        username: `pioneer_${entry.characterId}`,
        avatarUrl: null,
        status: 'active' as const,
      })),
    ],
    roster,
    myCharacterIds: [],
    journalDocId: null,
    gm: { inviteCode: 'THE-PIONEERS', rolePlay },
  };

  const parties: MyParties = {
    asGm: [
      {
        id: DEMO_PARTY_ID,
        name: PARTY_NAME,
        system: 'DnD_5e',
        role: 'gm',
        status: 'gm',
        gmUsername: DEMO_OWNER,
        pendingRequests: 0,
        activePlayers: roster.length,
        hasGm: true,
      },
    ],
    asPlayer: [],
    invites: [],
    requests: [],
  };

  const npcs: CharacterSummary[] = HEROES.filter((hero) => !hero.atTable).map((hero) => {
    const c = characters[hero.slug];
    return {
      id: hero.slug,
      name: c.name,
      level: c.level,
      class: c.class,
      system: 'DnD_5e',
      accentColor: c.accentColor,
      avatarUrl: c.avatarUrl,
    };
  });

  return {
    party,
    parties,
    characters,
    lore,
    spells,
    inventories,
    chest: buildInventory(DEMO_PARTY_ID, CHEST.gear, CHEST.coins, locale, true),
    npcs,
    inspirations,
  };
}

/** The spells each character knows, as the spells endpoint returns them, from the SRD content. */
export async function resolveDemoSpells(data: DemoData, locale: DemoLocale) {
  const catalog = getSpellCatalog();
  const entries = await Promise.all(
    Object.entries(data.spells as Record<string, string[]>).map(async ([slug, keys]) => [
      slug,
      (await catalog.findByKeys(keys, locale)).map((spell) => ({ ...spell, isPrepared: true })),
    ]),
  );
  return Object.fromEntries(entries);
}
