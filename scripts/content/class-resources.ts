import type { ClassResource } from '@shared/systems/dnd5e/content/class.schema';

import type { ClassBook, ResourceSpecs } from './5etools-classes';

/*
 * Class resources: what a feature lets you spend and get back on a rest. 5etools has this only in
 * the rules text, so it is written here, from that text (the SRD 5.1 part follows the reviewed map
 * in issue #179). Maximums the class table has are read from it (`column`). The importer checks
 * that every feature named here exists and that a table maximum starts at the resource's level.
 */

type Recovery = ClassResource['recovery'];

const LONG: Recovery = [{ rest: 'long', amount: 'all' }];
const SHORT: Recovery = [
  { rest: 'short', amount: 'all' },
  { rest: 'long', amount: 'all' },
];
/** SRD 5.2: one use back on a short rest, all of them on a long one. */
const ONE_ON_SHORT: Recovery = [
  { rest: 'short', amount: 1 },
  { rest: 'long', amount: 'all' },
];

const once = (level: number) => ({ type: 'steps' as const, steps: [{ level, value: 1 }] });
const byAbility = (ability: 'CHA' | 'WIS', bonus = 0) => ({
  type: 'ability' as const,
  ability,
  bonus,
  minimum: 1,
});

const SRD_51: Record<string, ResourceSpecs> = {
  barbarian: {
    class: [
      {
        id: 'rage',
        name: 'Rage',
        feature: 'rage',
        unit: 'uses',
        max: { column: 'Rages' },
        recovery: LONG,
      },
    ],
    subclass: [],
  },
  bard: {
    class: [
      {
        id: 'bardic-inspiration',
        name: 'Bardic Inspiration',
        feature: 'bardic-inspiration',
        unit: 'uses',
        max: byAbility('CHA'),
        // Font of Inspiration
        recovery: [
          { rest: 'long', amount: 'all' },
          { rest: 'short', amount: 'all', fromLevel: 5 },
        ],
        die: [
          { level: 1, value: 6 },
          { level: 5, value: 8 },
          { level: 10, value: 10 },
          { level: 15, value: 12 },
        ],
      },
    ],
    subclass: [],
  },
  cleric: {
    class: [
      {
        id: 'channel-divinity',
        name: 'Channel Divinity',
        feature: 'channel-divinity-2',
        unit: 'uses',
        max: {
          type: 'steps',
          steps: [
            { level: 2, value: 1 },
            { level: 6, value: 2 },
            { level: 18, value: 3 },
          ],
        },
        recovery: SHORT,
      },
      {
        id: 'divine-intervention',
        name: 'Divine Intervention',
        note: "If your deity intervenes, you can't use it again for 7 days.",
        feature: 'divine-intervention',
        unit: 'uses',
        max: once(10),
        recovery: LONG,
      },
    ],
    subclass: [],
  },
  druid: {
    class: [
      {
        id: 'wild-shape',
        name: 'Wild Shape',
        feature: 'wild-shape',
        unit: 'uses',
        // Archdruid: unlimited at level 20
        max: {
          type: 'steps',
          steps: [
            { level: 2, value: 2 },
            { level: 20, value: null },
          ],
        },
        recovery: SHORT,
      },
    ],
    subclass: [
      {
        id: 'natural-recovery',
        name: 'Natural Recovery',
        note: 'Used during a short rest.',
        feature: 'circle-of-the-land',
        unit: 'uses',
        max: once(2),
        recovery: LONG,
      },
    ],
  },
  fighter: {
    class: [
      {
        id: 'second-wind',
        name: 'Second Wind',
        feature: 'second-wind',
        unit: 'uses',
        max: once(1),
        recovery: SHORT,
      },
      {
        id: 'action-surge',
        name: 'Action Surge',
        feature: 'action-surge',
        unit: 'uses',
        max: {
          type: 'steps',
          steps: [
            { level: 2, value: 1 },
            { level: 17, value: 2 },
          ],
        },
        recovery: SHORT,
      },
      {
        id: 'indomitable',
        name: 'Indomitable',
        feature: 'indomitable',
        unit: 'uses',
        max: {
          type: 'steps',
          steps: [
            { level: 9, value: 1 },
            { level: 13, value: 2 },
            { level: 17, value: 3 },
          ],
        },
        recovery: LONG,
      },
    ],
    subclass: [],
  },
  monk: {
    class: [
      {
        id: 'ki',
        name: 'Ki Points',
        feature: 'ki',
        unit: 'points',
        max: { column: 'Ki Points' },
        recovery: SHORT,
      },
    ],
    subclass: [
      {
        id: 'wholeness-of-body',
        name: 'Wholeness of Body',
        feature: 'wholeness-of-body',
        unit: 'uses',
        max: once(6),
        recovery: LONG,
      },
    ],
  },
  paladin: {
    class: [
      {
        id: 'divine-sense',
        name: 'Divine Sense',
        feature: 'divine-sense',
        unit: 'uses',
        max: byAbility('CHA', 1),
        recovery: LONG,
      },
      {
        id: 'lay-on-hands',
        name: 'Lay on Hands',
        feature: 'lay-on-hands',
        unit: 'hit-points',
        max: { type: 'classLevel', multiplier: 5 },
        recovery: LONG,
      },
      {
        id: 'channel-divinity',
        name: 'Channel Divinity',
        feature: 'sacred-oath',
        unit: 'uses',
        max: once(3),
        recovery: SHORT,
      },
      {
        id: 'cleansing-touch',
        name: 'Cleansing Touch',
        feature: 'cleansing-touch',
        unit: 'uses',
        max: byAbility('CHA'),
        recovery: LONG,
      },
    ],
    subclass: [
      {
        id: 'holy-nimbus',
        name: 'Holy Nimbus',
        feature: 'holy-nimbus',
        unit: 'uses',
        max: once(20),
        recovery: LONG,
      },
    ],
  },
  ranger: { class: [], subclass: [] },
  rogue: {
    class: [
      {
        id: 'stroke-of-luck',
        name: 'Stroke of Luck',
        feature: 'stroke-of-luck',
        unit: 'uses',
        max: once(20),
        recovery: SHORT,
      },
    ],
    subclass: [],
  },
  sorcerer: {
    class: [
      {
        id: 'sorcery-points',
        name: 'Sorcery Points',
        feature: 'font-of-magic',
        unit: 'points',
        max: { column: 'Sorcery Points' },
        // Sorcerous Restoration
        recovery: [
          { rest: 'long', amount: 'all' },
          { rest: 'short', amount: 4, fromLevel: 20 },
        ],
      },
    ],
    subclass: [],
  },
  warlock: {
    class: [
      {
        id: 'pact-slots',
        name: 'Pact Magic Spell Slots',
        feature: 'pact-magic',
        unit: 'spell-slots',
        max: { column: 'Spell Slots' },
        recovery: SHORT,
        spellLevel: { column: 'Slot Level' },
      },
      ...([6, 7, 8, 9] as const).map((spellLevel, i) => ({
        id: `mystic-arcanum-${spellLevel}`,
        name: `Mystic Arcanum (level ${spellLevel})`,
        feature: `mystic-arcanum-${spellLevel}th-level`,
        unit: 'uses' as const,
        max: once(11 + 2 * i),
        recovery: LONG,
        spellLevel: [{ level: 11 + 2 * i, value: spellLevel }],
      })),
      {
        id: 'eldritch-master',
        name: 'Eldritch Master',
        feature: 'eldritch-master',
        unit: 'uses',
        max: once(20),
        recovery: LONG,
      },
    ],
    subclass: [
      {
        id: 'dark-one-s-own-luck',
        name: "Dark One's Own Luck",
        feature: 'dark-one-s-own-luck',
        unit: 'uses',
        max: once(6),
        recovery: SHORT,
      },
      {
        id: 'hurl-through-hell',
        name: 'Hurl Through Hell',
        feature: 'hurl-through-hell',
        unit: 'uses',
        max: once(14),
        recovery: LONG,
      },
    ],
  },
  wizard: {
    class: [
      {
        id: 'arcane-recovery',
        name: 'Arcane Recovery',
        note: 'Used when you finish a short rest.',
        feature: 'arcane-recovery',
        unit: 'uses',
        max: once(1),
        recovery: LONG,
      },
      {
        id: 'signature-spells',
        name: 'Signature Spells',
        note: 'One free casting of each of the two spells.',
        feature: 'signature-spells',
        unit: 'uses',
        max: { type: 'steps', steps: [{ level: 20, value: 2 }] },
        recovery: SHORT,
      },
    ],
    subclass: [
      {
        id: 'overchannel',
        name: 'Overchannel',
        note: 'Using it again before a long rest deals necrotic damage to you, more each time.',
        feature: 'overchannel',
        unit: 'uses',
        max: once(14),
        recovery: LONG,
      },
    ],
  },
};

const SRD_52: Record<string, ResourceSpecs> = {
  barbarian: {
    class: [
      {
        id: 'rage',
        name: 'Rage',
        feature: 'rage',
        unit: 'uses',
        max: { column: 'Rages' },
        recovery: ONE_ON_SHORT,
      },
      {
        id: 'persistent-rage',
        name: 'Persistent Rage',
        note: 'Regain all uses of Rage when you roll Initiative.',
        feature: 'persistent-rage',
        unit: 'uses',
        max: once(15),
        recovery: LONG,
      },
    ],
    subclass: [
      {
        id: 'intimidating-presence',
        name: 'Intimidating Presence',
        note: 'You can also restore it by expending a use of Rage.',
        feature: 'intimidating-presence',
        unit: 'uses',
        max: once(14),
        recovery: LONG,
      },
    ],
  },
  bard: {
    class: [
      {
        id: 'bardic-inspiration',
        name: 'Bardic Inspiration',
        feature: 'bardic-inspiration',
        unit: 'uses',
        max: byAbility('CHA'),
        // Font of Inspiration
        recovery: [
          { rest: 'long', amount: 'all' },
          { rest: 'short', amount: 'all', fromLevel: 5 },
        ],
        die: { column: 'Bardic Die' },
      },
    ],
    subclass: [],
  },
  cleric: {
    class: [
      {
        id: 'channel-divinity',
        name: 'Channel Divinity',
        feature: 'channel-divinity',
        unit: 'uses',
        max: { column: 'Channel Divinity' },
        recovery: ONE_ON_SHORT,
      },
      {
        id: 'divine-intervention',
        name: 'Divine Intervention',
        note: 'After choosing Wish (Greater Divine Intervention), you wait 2d4 long rests.',
        feature: 'divine-intervention',
        unit: 'uses',
        max: once(10),
        recovery: LONG,
      },
    ],
    subclass: [],
  },
  druid: {
    class: [
      {
        id: 'wild-shape',
        name: 'Wild Shape',
        feature: 'wild-shape',
        unit: 'uses',
        max: { column: 'Wild Shape' },
        recovery: ONE_ON_SHORT,
      },
      {
        id: 'wild-resurgence',
        name: 'Wild Resurgence',
        note: 'Turns a use of Wild Shape into a level 1 spell slot.',
        feature: 'wild-resurgence',
        unit: 'uses',
        max: once(5),
        recovery: LONG,
      },
      {
        id: 'nature-magician',
        name: 'Nature Magician',
        note: 'Turns uses of Wild Shape into one spell slot.',
        feature: 'archdruid',
        unit: 'uses',
        max: once(20),
        recovery: LONG,
      },
    ],
    subclass: [
      {
        id: 'natural-recovery-spell',
        name: 'Natural Recovery (spell)',
        note: 'Cast a Circle spell without a spell slot.',
        feature: 'natural-recovery',
        unit: 'uses',
        max: once(6),
        recovery: LONG,
      },
      {
        id: 'natural-recovery-slots',
        name: 'Natural Recovery (spell slots)',
        note: 'Used when you finish a short rest.',
        feature: 'natural-recovery',
        unit: 'uses',
        max: once(6),
        recovery: LONG,
      },
    ],
  },
  fighter: {
    class: [
      {
        id: 'second-wind',
        name: 'Second Wind',
        feature: 'second-wind',
        unit: 'uses',
        max: { column: 'Second Wind' },
        recovery: ONE_ON_SHORT,
      },
      {
        id: 'action-surge',
        name: 'Action Surge',
        feature: 'action-surge-2',
        unit: 'uses',
        max: {
          type: 'steps',
          steps: [
            { level: 2, value: 1 },
            { level: 17, value: 2 },
          ],
        },
        recovery: SHORT,
      },
      {
        id: 'indomitable',
        name: 'Indomitable',
        feature: 'indomitable-9',
        unit: 'uses',
        max: {
          type: 'steps',
          steps: [
            { level: 9, value: 1 },
            { level: 13, value: 2 },
            { level: 17, value: 3 },
          ],
        },
        recovery: LONG,
      },
    ],
    subclass: [],
  },
  monk: {
    class: [
      {
        id: 'focus-points',
        name: 'Focus Points',
        feature: 'monk-s-focus',
        unit: 'points',
        max: { column: 'Focus Points' },
        recovery: SHORT,
      },
      {
        id: 'uncanny-metabolism',
        name: 'Uncanny Metabolism',
        note: 'Used when you roll Initiative.',
        feature: 'uncanny-metabolism',
        unit: 'uses',
        max: once(2),
        recovery: LONG,
      },
    ],
    subclass: [
      {
        id: 'wholeness-of-body',
        name: 'Wholeness of Body',
        feature: 'wholeness-of-body',
        unit: 'uses',
        max: byAbility('WIS'),
        recovery: LONG,
      },
    ],
  },
  paladin: {
    class: [
      {
        id: 'lay-on-hands',
        name: 'Lay on Hands',
        feature: 'lay-on-hands',
        unit: 'hit-points',
        max: { type: 'classLevel', multiplier: 5 },
        recovery: LONG,
      },
      {
        id: 'paladin-s-smite',
        name: "Paladin's Smite",
        note: 'Cast Divine Smite without a spell slot.',
        feature: 'paladin-s-smite',
        unit: 'uses',
        max: once(2),
        recovery: LONG,
      },
      {
        id: 'channel-divinity',
        name: 'Channel Divinity',
        feature: 'channel-divinity',
        unit: 'uses',
        max: { column: 'Channel Divinity' },
        recovery: ONE_ON_SHORT,
      },
      {
        id: 'faithful-steed',
        name: 'Faithful Steed',
        note: 'Cast Find Steed without a spell slot.',
        feature: 'faithful-steed',
        unit: 'uses',
        max: once(5),
        recovery: LONG,
      },
    ],
    subclass: [
      {
        id: 'holy-nimbus',
        name: 'Holy Nimbus',
        note: 'You can also restore it by expending a level 5 spell slot.',
        feature: 'holy-nimbus',
        unit: 'uses',
        max: once(20),
        recovery: LONG,
      },
    ],
  },
  ranger: {
    class: [
      {
        id: 'favored-enemy',
        name: 'Favored Enemy',
        note: "Cast Hunter's Mark without a spell slot.",
        feature: 'favored-enemy',
        unit: 'uses',
        max: { column: 'Favored Enemy' },
        recovery: LONG,
      },
      {
        id: 'tireless',
        name: 'Tireless',
        feature: 'tireless',
        unit: 'uses',
        max: byAbility('WIS'),
        recovery: LONG,
      },
      {
        id: 'nature-s-veil',
        name: "Nature's Veil",
        feature: 'nature-s-veil',
        unit: 'uses',
        max: byAbility('WIS'),
        recovery: LONG,
      },
    ],
    subclass: [],
  },
  rogue: {
    class: [
      {
        id: 'stroke-of-luck',
        name: 'Stroke of Luck',
        feature: 'stroke-of-luck',
        unit: 'uses',
        max: once(20),
        recovery: SHORT,
      },
    ],
    subclass: [],
  },
  sorcerer: {
    class: [
      {
        id: 'innate-sorcery',
        name: 'Innate Sorcery',
        note: 'From level 7, you can also use it by spending 2 Sorcery Points.',
        feature: 'innate-sorcery',
        unit: 'uses',
        max: { type: 'steps', steps: [{ level: 1, value: 2 }] },
        recovery: LONG,
      },
      {
        id: 'sorcery-points',
        name: 'Sorcery Points',
        feature: 'font-of-magic',
        unit: 'points',
        max: { column: 'Sorcery Points' },
        recovery: LONG,
      },
      {
        id: 'sorcerous-restoration',
        name: 'Sorcerous Restoration',
        note: 'On a short rest, regain Sorcery Points up to half your Sorcerer level.',
        feature: 'sorcerous-restoration',
        unit: 'uses',
        max: once(5),
        recovery: LONG,
      },
    ],
    subclass: [
      {
        id: 'dragon-wings',
        name: 'Dragon Wings',
        note: 'You can also restore it by spending 3 Sorcery Points.',
        feature: 'dragon-wings',
        unit: 'uses',
        max: once(14),
        recovery: LONG,
      },
      {
        id: 'dragon-companion',
        name: 'Dragon Companion',
        note: 'Cast Summon Dragon without a spell slot.',
        feature: 'dragon-companion',
        unit: 'uses',
        max: once(18),
        recovery: LONG,
      },
    ],
  },
  warlock: {
    class: [
      {
        id: 'pact-slots',
        name: 'Pact Magic Spell Slots',
        feature: 'pact-magic',
        unit: 'spell-slots',
        max: { column: 'Spell Slots' },
        recovery: SHORT,
        spellLevel: { column: 'Slot Level' },
      },
      {
        id: 'magical-cunning',
        name: 'Magical Cunning',
        note: 'Regain up to half your Pact Magic spell slots.',
        feature: 'magical-cunning',
        unit: 'uses',
        max: once(2),
        recovery: LONG,
      },
      {
        id: 'contact-patron',
        name: 'Contact Patron',
        note: 'Cast Contact Other Plane without a spell slot.',
        feature: 'contact-patron',
        unit: 'uses',
        max: once(9),
        recovery: LONG,
      },
      ...([6, 7, 8, 9] as const).map((spellLevel, i) => ({
        id: `mystic-arcanum-${spellLevel}`,
        name: `Mystic Arcanum (level ${spellLevel})`,
        feature: `mystic-arcanum-${11 + 2 * i}`,
        unit: 'uses' as const,
        max: once(11 + 2 * i),
        recovery: LONG,
        spellLevel: [{ level: 11 + 2 * i, value: spellLevel }],
      })),
    ],
    subclass: [
      {
        id: 'dark-one-s-own-luck',
        name: "Dark One's Own Luck",
        feature: 'dark-one-s-own-luck',
        unit: 'uses',
        max: byAbility('CHA'),
        recovery: LONG,
      },
      {
        id: 'hurl-through-hell',
        name: 'Hurl Through Hell',
        note: 'You can also restore it by expending a Pact Magic spell slot.',
        feature: 'hurl-through-hell',
        unit: 'uses',
        max: once(14),
        recovery: LONG,
      },
    ],
  },
  wizard: {
    class: [
      {
        id: 'arcane-recovery',
        name: 'Arcane Recovery',
        note: 'Used when you finish a short rest.',
        feature: 'arcane-recovery',
        unit: 'uses',
        max: once(1),
        recovery: LONG,
      },
      {
        id: 'signature-spells',
        name: 'Signature Spells',
        note: 'One free casting of each of the two spells.',
        feature: 'signature-spells',
        unit: 'uses',
        max: { type: 'steps', steps: [{ level: 20, value: 2 }] },
        recovery: SHORT,
      },
    ],
    subclass: [
      {
        id: 'overchannel',
        name: 'Overchannel',
        note: 'Using it again before a long rest deals Necrotic damage to you, more each time.',
        feature: 'overchannel',
        unit: 'uses',
        max: once(14),
        recovery: LONG,
      },
    ],
  },
};

export const CLASS_RESOURCES: Record<ClassBook, Record<string, ResourceSpecs>> = {
  'srd-5.1': SRD_51,
  'srd-5.2': SRD_52,
};
