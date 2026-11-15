import type { ClassResourcesContent } from '@shared/systems/dnd5e/class-resources';

const base = { feature: 'f', level: 1 } as const;

/** Monk: Ki (1 per level, short + long rest). */
export const MONK: ClassResourcesContent = {
  classId: 'monk',
  edition: '2014',
  hitDie: 8,
  resources: [
    {
      ...base,
      id: 'ki',
      name: 'Ki',
      description: 'Ki feature text',
      unit: 'points',
      max: { type: 'classLevel', multiplier: 1 },
      recovery: [
        { rest: 'short', amount: 'all' },
        { rest: 'long', amount: 'all' },
      ],
    },
  ],
  subclass: { id: 'open-hand', names: ['Open Hand'], resources: [] },
};

/** Paladin: Lay on Hands (5 per level, a pool of hit points). */
export const PALADIN: ClassResourcesContent = {
  classId: 'paladin',
  edition: '2014',
  hitDie: 10,
  resources: [
    {
      ...base,
      id: 'lay-on-hands',
      name: 'Lay on Hands',
      description: 'Healing pool',
      unit: 'hit-points',
      max: { type: 'classLevel', multiplier: 5 },
      recovery: [{ rest: 'long', amount: 'all' }],
    },
  ],
  subclass: { id: 'devotion', names: ['Devotion'], resources: [] },
};
