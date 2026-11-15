import { normalizeSearch } from '@shared/content/normalize-search';

import { getModifier } from './calculations';
import type { ClassResource } from './content/class.schema';
import type { Edition } from './content/editions';
import type { AttributeKey } from './types';

export type Recovery = ClassResource['recovery'][number];

/** Where a box comes from. The class and its subclass build theirs; the player's own say it. */
export const RESOURCE_SOURCES = ['class', 'subclass', 'feat', 'item', 'manual'] as const;
export type ResourceSource = (typeof RESOURCE_SOURCES)[number];

/** Per-sheet edits of a class box: each one wins over what the class says, at any level. */
export interface ResourceOverrides {
  max?: number;
  recovery?: Recovery[];
  color?: string;
  name?: string;
  description?: string;
}

/** A box the player made up, or copied from another class. */
export interface CustomResource {
  name: string;
  max: number;
  recovery: Recovery[];
  color?: string;
  description?: string;
  source: ResourceSource;
}

/** What the sheet saves for one box. A class box's max and texts come from the content, not from here. */
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

const CUSTOM_PREFIX = 'custom:';

export interface ResourceBox {
  /** `class:<classId>:<id>`, `subclass:<classId>/<subId>:<id>` or `custom:<uuid>` */
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
  source: ResourceSource;
  /** The player's color for this box; without one it takes the sheet's. */
  color?: string;
}

/** A box as the sheet's settings list it: hidden ones too, with what the class says under the edits. */
export interface EditableResourceBox extends ResourceBox {
  hidden: boolean;
  /** What the class gives at this level; absent on a box the player made. */
  base?: Pick<ResourceBox, 'name' | 'description' | 'max' | 'recovery'>;
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

const clamp = (used: number, max: number | null) =>
  max === null ? 0 : Math.min(Math.max(used, 0), max);

interface BoxesInput {
  /** null when the sheet has no edition yet or its class isn't a listed one: only the player's own boxes. */
  content: ClassResourcesContent | null;
  subclassId: string | null;
  level: number;
  attributes: Record<AttributeKey, number>;
  state: Record<string, ResourceState> | undefined;
}

/**
 * Every box of the sheet, hidden ones included: the class's, the subclass's when `subclassId` is
 * the SRD one, then the player's own in the order they were made. The class's follow the level;
 * what the player changed in one stays on top of it.
 */
export function listResourceBoxes(input: BoxesInput): EditableResourceBox[] {
  const { content, subclassId, level, attributes, state } = input;

  const toBoxes = (
    resources: ResourceContent[],
    prefix: string,
    source: ResourceBox['source'],
  ): EditableResourceBox[] =>
    resources.flatMap((r) => {
      if (r.level > level || r.unit === 'spell-slots') return [];
      const key = `${prefix}:${r.id}`;
      const saved = state?.[key];
      const edits = saved?.overrides ?? {};
      const base = {
        name: r.name,
        description: r.description,
        max: resolveMax(r.max, level, attributes),
        recovery: r.recovery.filter((rec) => (rec.fromLevel ?? 1) <= level),
      };
      const max = edits.max ?? base.max;
      const die = r.die && stepValue(r.die, level)?.value;
      return [
        {
          key,
          name: edits.name || base.name,
          description: edits.description || base.description,
          ...(r.note !== undefined && { note: r.note }),
          unit: r.unit,
          max,
          used: clamp(saved?.used ?? 0, max),
          recovery: edits.recovery ?? base.recovery,
          ...(die && { die }),
          source,
          ...(edits.color && { color: edits.color }),
          hidden: saved?.hidden === true,
          base,
        },
      ];
    });

  const custom = Object.keys(state ?? {})
    .filter((key) => key.startsWith(CUSTOM_PREFIX))
    // The key carries the time it was made (see newCustomKey); the saved map keeps no order
    .sort()
    .flatMap((key): EditableResourceBox[] => {
      const saved = state![key];
      const box = saved.custom;
      if (!box) return [];
      return [
        {
          key,
          name: box.name,
          description: box.description ?? '',
          unit: 'uses',
          max: box.max,
          used: clamp(saved.used, box.max),
          recovery: box.recovery,
          source: box.source,
          ...(box.color && { color: box.color }),
          hidden: saved.hidden === true,
        },
      ];
    });

  return [
    ...(content ? toBoxes(content.resources, `class:${content.classId}`, 'class') : []),
    ...(content && subclassId !== null && subclassId === content.subclass.id
      ? toBoxes(
          content.subclass.resources,
          `subclass:${content.classId}/${content.subclass.id}`,
          'subclass',
        )
      : []),
    ...custom,
  ];
}

/** The boxes the sheet shows and the rest checklist reads: the listed ones the player didn't hide. */
export function buildResourceBoxes(input: BoxesInput): ResourceBox[] {
  return listResourceBoxes(input).flatMap(({ hidden, base: _, ...box }) => (hidden ? [] : [box]));
}

/** The three recoveries a box can be set to. A class box may follow finer rules until it is. */
export const REST_CHOICES = ['short', 'long', 'none'] as const;
export type RestChoice = (typeof REST_CHOICES)[number];

/** What comes back on a short rest also comes back on a long one. */
export function recoveryFor(choice: RestChoice): Recovery[] {
  if (choice === 'none') return [];
  const long: Recovery = { rest: 'long', amount: 'all' };
  return choice === 'short' ? [{ rest: 'short', amount: 'all' }, long] : [long];
}

/** The closest of the three choices to a recovery. */
export function restChoiceOf(recovery: Recovery[]): RestChoice {
  if (recovery.some((r) => r.rest === 'short')) return 'short';
  return recovery.some((r) => r.rest === 'long') ? 'long' : 'none';
}

/** The longest description the sheet saves for a box. */
export const MAX_RESOURCE_DESCRIPTION = 2000;

/**
 * A class resource as a box of the player's own, for a sheet of another class (a rogue with Wild
 * Shape). It is a copy at this level: from here on only the player changes it.
 */
export function customFromClass(
  resource: ResourceContent,
  source: 'class' | 'subclass',
  level: number,
  attributes: Record<AttributeKey, number>,
): CustomResource {
  // Not below the level that gives the resource: the copy would start with nothing to spend
  const at = Math.max(level, resource.level);
  const resolved = resolveMax(resource.max, at, attributes);
  // A box of the player's own always counts: unlimited becomes the highest count the class gives
  const max =
    resolved ??
    (resource.max.type === 'steps'
      ? Math.max(1, ...resource.max.steps.flatMap((step) => step.value ?? []))
      : 1);
  return {
    name: resource.name,
    max,
    recovery: resource.recovery
      .filter((rec) => (rec.fromLevel ?? 1) <= at)
      .map(({ rest, amount }) => ({ rest, amount })),
    ...(resource.description && {
      description: resource.description.slice(0, MAX_RESOURCE_DESCRIPTION),
    }),
    source,
  };
}

/** What a rest gives back to this box: 'all', a number, or null for nothing. */
export function recoveryOn(box: ResourceBox, rest: 'short' | 'long'): 'all' | number | null {
  return box.recovery.find((r) => r.rest === rest)?.amount ?? null;
}

const normalize = (text: string) => normalizeSearch(text).trim();

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
