import { getModifier } from './calculations';
import type { ClassResource } from './content/class.schema';
import type { Edition } from './content/editions';
import type { AttributeKey } from './types';

export type Recovery = ClassResource['recovery'][number];

/** Per-sheet edits of a resource box (#180). */
export interface ResourceOverrides {
  max?: number;
  recovery?: Recovery[];
  color?: string;
  name?: string;
  description?: string;
}

/** A box the player made up (#180). */
export interface CustomResource {
  name: string;
  max: number;
  recovery: Recovery[];
  color?: string;
  source: 'class' | 'subclass' | 'feat' | 'item' | 'manual';
}

/** What the sheet saves for one box. The max and texts come from the content, not from here. */
export interface ResourceState {
  used: number;
  hidden?: boolean;
  overrides?: ResourceOverrides;
  custom?: CustomResource;
}

/** What GET /api/content/classes returns: one class, its SRD subclass, resource texts resolved to one locale. */
export interface ResourceContent extends ClassResource {
  name: string;
  note?: string;
  description: string;
}

export interface ClassResourcesContent {
  classId: string;
  edition: Edition;
  hitDie: 6 | 8 | 10 | 12;
  resources: ResourceContent[];
  /** names: English + locale name, for matching */
  subclass: { id: string; names: string[]; resources: ResourceContent[] };
}

/**
 * Keys of the saved `resources` map: `class:<class>:<resource>`, `subclass:<class>/<subclass>:<resource>`
 * or `custom:<uuid>` (no resource part).
 */
export const RESOURCE_KEY =
  /^(?:class:[a-z0-9-]+:[a-z0-9-]+|subclass:[a-z0-9-]+\/[a-z0-9-]+:[a-z0-9-]+|custom:[0-9a-f-]{36})$/;

export interface ResourceBox {
  /** `class:<classId>:<id>` or `subclass:<classId>/<subId>:<id>` */
  key: string;
  name: string;
  description: string;
  note?: string;
  /** Spell slots never reach a box. */
  unit: 'uses' | 'points' | 'hit-points';
  /** null = unlimited */
  max: number | null;
  /** Clamped to [0, max]; 0 when unlimited. */
  used: number;
  /** Only the entries active at this level (fromLevel <= level). */
  recovery: Recovery[];
  /** Faces at this level. */
  die?: number;
  source: 'class' | 'subclass';
}

/** The value of the last step whose level is <= `level`, or undefined if none applies yet. */
function stepValue<T>(
  steps: { level: number; value: T }[],
  level: number,
): { value: T } | undefined {
  let found: { value: T } | undefined;
  for (const step of steps) if (step.level <= level) found = { value: step.value };
  return found;
}

function resolveMax(
  max: ResourceContent['max'],
  level: number,
  attributes: Record<AttributeKey, number>,
): number | null {
  switch (max.type) {
    case 'steps': {
      // null is a real value here (unlimited), so only a missing step falls back to 0
      const step = stepValue(max.steps, level);
      return step ? step.value : 0;
    }
    case 'classLevel':
      return level * max.multiplier;
    case 'ability':
      return Math.max(max.minimum, getModifier(attributes[max.ability]) + max.bonus);
  }
}

/** Boxes of the class, then of the subclass when `subclassId` is the SRD one, in content order. */
export function buildResourceBoxes(input: {
  content: ClassResourcesContent;
  subclassId: string | null;
  level: number;
  attributes: Record<AttributeKey, number>;
  state: Record<string, ResourceState> | undefined;
}): ResourceBox[] {
  const { content, subclassId, level, attributes, state } = input;

  const toBoxes = (
    resources: ResourceContent[],
    prefix: string,
    source: ResourceBox['source'],
  ): ResourceBox[] =>
    resources.flatMap((r) => {
      if (r.level > level || r.unit === 'spell-slots') return [];
      const max = resolveMax(r.max, level, attributes);
      const key = `${prefix}:${r.id}`;
      const saved = state?.[key]?.used ?? 0;
      const die = r.die && stepValue(r.die, level)?.value;
      return [
        {
          key,
          name: r.name,
          description: r.description,
          ...(r.note !== undefined && { note: r.note }),
          unit: r.unit,
          max,
          used: max === null ? 0 : Math.min(Math.max(saved, 0), max),
          recovery: r.recovery.filter((rec) => (rec.fromLevel ?? 1) <= level),
          ...(die && { die }),
          source,
        },
      ];
    });

  return [
    ...toBoxes(content.resources, `class:${content.classId}`, 'class'),
    ...(subclassId !== null && subclassId === content.subclass.id
      ? toBoxes(
          content.subclass.resources,
          `subclass:${content.classId}/${content.subclass.id}`,
          'subclass',
        )
      : []),
  ];
}

/** What a rest gives back to this box: 'all', a number, or null for nothing. */
export function recoveryOn(box: ResourceBox, rest: 'short' | 'long'): 'all' | number | null {
  return box.recovery.find((r) => r.rest === rest)?.amount ?? null;
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** The SRD subclass if the free-text subclass names it (English or locale name; case, accents and surrounding spaces ignored). */
export function matchSubclass(
  content: ClassResourcesContent,
  text: string | undefined,
): string | null {
  const wanted = text && normalize(text);
  if (!wanted) return null;
  const { id, names } = content.subclass;
  return [id, ...names].some((n) => normalize(n) === wanted) ? id : null;
}
