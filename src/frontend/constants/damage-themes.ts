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
  vfx: string;
  hex: string;
  parallax?: number;
}

export const DAMAGE_THEMES: Record<string, DamageTheme> = {
  // Elemental / Damage Types
  fire: {
    icon: DAMAGE_TYPE_ICONS.fire,
    vfx: 'vfx-dots',
    hex: '#f97316',
    parallax: -4,
  },
  cold: {
    icon: DAMAGE_TYPE_ICONS.cold,
    vfx: 'vfx-grid',
    hex: '#7dd3fc',
    parallax: 4,
  },
  lightning: {
    icon: DAMAGE_TYPE_ICONS.lightning,
    vfx: 'vfx-zigzag',
    hex: '#facc15',
    parallax: -2,
  },
  acid: {
    icon: DAMAGE_TYPE_ICONS.acid,
    vfx: 'vfx-bubbles',
    hex: '#84cc16',
    parallax: 2,
  },
  poison: {
    icon: DAMAGE_TYPE_ICONS.poison,
    vfx: 'vfx-mist',
    hex: '#059669',
    parallax: -3,
  },
  psychic: {
    icon: DAMAGE_TYPE_ICONS.psychic,
    vfx: 'vfx-waves',
    hex: '#ec4899',
    parallax: 5,
  },
  radiant: {
    icon: DAMAGE_TYPE_ICONS.radiant,
    vfx: 'vfx-beams',
    hex: '#fde68a',
    parallax: -5,
  },
  necrotic: {
    icon: DAMAGE_TYPE_ICONS.necrotic,
    vfx: 'vfx-decay',
    hex: '#a855f7',
    parallax: 3,
  },
  force: {
    icon: DAMAGE_TYPE_ICONS.force,
    vfx: 'force-shockwave',
    hex: '#f4f4f5',
    parallax: 0,
  },
  thunder: {
    icon: DAMAGE_TYPE_ICONS.thunder,
    vfx: 'vfx-concentric',
    hex: '#22d3ee',
    parallax: -1,
  },
  slashing: {
    icon: DAMAGE_TYPE_ICONS.slashing,
    vfx: 'vfx-lines-diag',
    hex: '#be123c',
    parallax: -2,
  },
  piercing: {
    icon: DAMAGE_TYPE_ICONS.piercing,
    vfx: 'vfx-dots-tight',
    hex: '#991b1b',
    parallax: 1,
  },
  bludgeoning: {
    icon: DAMAGE_TYPE_ICONS.bludgeoning,
    vfx: 'vfx-cracks',
    hex: '#78716c',
    parallax: -1,
  },
};

export const CATEGORY_THEMES: Record<string, DamageTheme> = {
  // Functional / Category
  buff: {
    icon: 'armor-upgrade',
    vfx: 'vfx-grid',
    hex: '#34d399',
    parallax: 0,
  },
  utility: {
    icon: 'convergence-target',
    vfx: 'vfx-dots',
    hex: '#fbbf24',
    parallax: 0,
  },
  control: {
    icon: 'despair',
    vfx: 'vfx-ethereal',
    hex: '#eab308',
    parallax: 0,
  },
};

export const SCHOOL_THEMES: Record<string, DamageTheme> = {
  // Traditional / Schools
  abjuration: {
    icon: SPELL_SCHOOL_ICONS.abjuration,
    vfx: 'vfx-grid',
    hex: '#60a5fa',
    parallax: 0,
  },
  conjuration: {
    icon: SPELL_SCHOOL_ICONS.conjuration,
    vfx: 'vfx-dots-tight',
    hex: '#facc15',
    parallax: 0,
  },
  divination: {
    icon: SPELL_SCHOOL_ICONS.divination,
    vfx: 'vfx-waves',
    hex: '#34d399',
    parallax: 0,
  },
  enchantment: {
    icon: SPELL_SCHOOL_ICONS.enchantment,
    vfx: 'vfx-ethereal',
    hex: '#f472b6',
    parallax: 0,
  },
  evocation: {
    icon: SPELL_SCHOOL_ICONS.evocation,
    vfx: 'vfx-dots',
    hex: '#f97316',
    parallax: 0,
  },
  illusion: {
    icon: SPELL_SCHOOL_ICONS.illusion,
    vfx: 'vfx-mist',
    hex: '#a78bfa',
    parallax: 0,
  },
  necromancy: {
    icon: SPELL_SCHOOL_ICONS.necromancy,
    vfx: 'vfx-decay',
    hex: '#9333ea',
    parallax: 0,
  },
  transmutation: {
    icon: SPELL_SCHOOL_ICONS.transmutation,
    vfx: 'vfx-cracks',
    hex: '#d97706',
    parallax: 0,
  },
};

export const DEFAULT_THEME: DamageTheme = {
  icon: 'tied-scroll',
  vfx: 'vfx-dots',
  hex: '#94a3b8',
  parallax: 0,
};
