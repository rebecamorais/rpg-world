import type { ClassResource } from './content/class.schema';
import type { Edition } from './content/editions';

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
