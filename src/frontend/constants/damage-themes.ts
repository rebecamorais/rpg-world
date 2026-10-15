import { DAMAGE_TYPE_ICONS, SPELL_SCHOOL_ICONS, SPELL_UI_ICONS } from './spells';

export const MECHANIC_ICONS = {
  ritual: SPELL_UI_ICONS.Ritual,
  concentration: SPELL_UI_ICONS.Concentration,
  verbal: SPELL_UI_ICONS.Verbal,
  somatic: SPELL_UI_ICONS.Somatic,
  material: SPELL_UI_ICONS.Material,
  castingTime: SPELL_UI_ICONS.CastingTime,
  duration: SPELL_UI_ICONS.Duration,
  default: 'tied-scroll',
} as const;

export const COMPONENT_METADATA = {
  V: { icon: MECHANIC_ICONS.verbal, color: 'text-info-flare' },
  S: { icon: MECHANIC_ICONS.somatic, color: 'text-success-flare' },
  M: { icon: MECHANIC_ICONS.material, color: 'text-warning-flare' },
} as const;

/**
 * Visual identity of a spell. `hex` is the spell's own color: SpellCard sets it as
 * --spell-color, and its parts use the derived tokens (text-spell-flare, bg-spell-surface...),
 * which keep text readable whatever the hue.
 */
export interface DamageTheme {
  icon: string;
  hex: string;
}

export const DAMAGE_THEMES: Record<string, DamageTheme> = {
  // Elemental / Damage Types
  fire: {
    icon: DAMAGE_TYPE_ICONS.fire,
    hex: '#f97316',
  },
  cold: {
    icon: DAMAGE_TYPE_ICONS.cold,
    hex: '#7dd3fc',
  },
  lightning: {
    icon: DAMAGE_TYPE_ICONS.lightning,
    hex: '#facc15',
  },
  acid: {
    icon: DAMAGE_TYPE_ICONS.acid,
    hex: '#84cc16',
  },
  poison: {
    icon: DAMAGE_TYPE_ICONS.poison,
    hex: '#059669',
  },
  psychic: {
    icon: DAMAGE_TYPE_ICONS.psychic,
    hex: '#ec4899',
  },
  radiant: {
    icon: DAMAGE_TYPE_ICONS.radiant,
    hex: '#fde68a',
  },
  necrotic: {
    icon: DAMAGE_TYPE_ICONS.necrotic,
    hex: '#a855f7',
  },
  force: {
    icon: DAMAGE_TYPE_ICONS.force,
    hex: '#f4f4f5',
  },
  thunder: {
    icon: DAMAGE_TYPE_ICONS.thunder,
    hex: '#22d3ee',
  },
  slashing: {
    icon: DAMAGE_TYPE_ICONS.slashing,
    hex: '#be123c',
  },
  piercing: {
    icon: DAMAGE_TYPE_ICONS.piercing,
    hex: '#991b1b',
  },
  bludgeoning: {
    icon: DAMAGE_TYPE_ICONS.bludgeoning,
    hex: '#78716c',
  },
};

export const CATEGORY_THEMES: Record<string, DamageTheme> = {
  // Functional / Category
  buff: {
    icon: 'armor-upgrade',
    hex: '#34d399',
  },
  utility: {
    icon: 'convergence-target',
    hex: '#fbbf24',
  },
  control: {
    icon: 'despair',
    hex: '#eab308',
  },
};

export const SCHOOL_THEMES: Record<string, DamageTheme> = {
  // Traditional / Schools
  abjuration: {
    icon: SPELL_SCHOOL_ICONS.abjuration,
    hex: '#60a5fa',
  },
  conjuration: {
    icon: SPELL_SCHOOL_ICONS.conjuration,
    hex: '#facc15',
  },
  divination: {
    icon: SPELL_SCHOOL_ICONS.divination,
    hex: '#34d399',
  },
  enchantment: {
    icon: SPELL_SCHOOL_ICONS.enchantment,
    hex: '#f472b6',
  },
  evocation: {
    icon: SPELL_SCHOOL_ICONS.evocation,
    hex: '#f97316',
  },
  illusion: {
    icon: SPELL_SCHOOL_ICONS.illusion,
    hex: '#a78bfa',
  },
  necromancy: {
    icon: SPELL_SCHOOL_ICONS.necromancy,
    hex: '#9333ea',
  },
  transmutation: {
    icon: SPELL_SCHOOL_ICONS.transmutation,
    hex: '#d97706',
  },
};

export const DEFAULT_THEME: DamageTheme = {
  icon: 'tied-scroll',
  hex: '#94a3b8',
};
