/**
 * Spell School Icons for D&D 5e.
 * Focus on clear silhouettes that scale well from small (w-6) to larger grids.
 */
export const SPELL_SCHOOL_ICONS = {
  abjuration: 'shield-reflect', // Proteção/Escudo
  conjuration: 'portal', // Invocação/Teleporte
  divination: 'crystal-ball', // Previsão/Revelação
  enchantment: 'chained-heart', // Controle mental/Encanto
  evocation: 'rolling-energy', // Dano/Energia pura
  illusion: 'heat-haze', // Engano/Ilusão
  necromancy: 'half-dead', // Morte/Mortos-vivos
  transmutation: 'magic-swirl', // Alteração de matéria
} as const;

/**
 * Damage Type Icons.
 * Perfect for quick badges next to damage rolls.
 */
export const DAMAGE_TYPE_ICONS = {
  acid: 'chemical-bolt',
  bludgeoning: 'hammer-drop', // Concussão
  cold: 'thermometer-cold',
  fire: 'burning-embers',
  force: 'circle-sparks', // Força (Energia mágica)
  lightning: 'lightning-tree',
  necrotic: 'tombstone', // Necrótico
  piercing: 'spear-feather', // Perfurante
  poison: 'poison-gas',
  psychic: 'brain',
  radiant: 'fireflake', // Radiante/Sagrado
  slashing: 'quick-slash', // Cortante
  thunder: 'echo-ripples', // Trovão (Som/Onda de choque)
} as const;

/**
 * UI Support Icons (Components, Rituals, etc.)
 */
export const SPELL_UI_ICONS = {
  Ritual: 'pentagram-rose',
  Concentration: 'psychic-waves',
  Verbal: 'talk',
  Somatic: 'palm',
  Material: 'swap-bag',
  CastingTime: 'stopwatch',
  Duration: 'empty-hourglass',
} as const;

// Types for better TypeScript DX
export type SpellSchool = keyof typeof SPELL_SCHOOL_ICONS;
export type DamageType = keyof typeof DAMAGE_TYPE_ICONS;
export type SpellUIIcon = keyof typeof SPELL_UI_ICONS;
