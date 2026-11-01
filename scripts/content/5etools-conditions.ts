import type { ConditionData, ConditionText } from '@shared/systems/dnd5e/content/condition.schema';

import { type Entry, renderEntries } from './5etools-spells';

/*
 * Converts 5etools conditions (data/conditionsdiseases.json) to the content format.
 * Only the fields the conversion reads are typed.
 */

export interface FiveToolsCondition {
  name: string;
  source: string;
  /** The SRD 5.2 condition (on the 2024 book's). */
  srd52?: boolean;
  /** The SRD 5.1 condition (on the 2014 book's). */
  srd?: boolean;
  entries: Entry[];
}

export const toConditionId = (condition: FiveToolsCondition) =>
  condition.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function toConditionData(condition: FiveToolsCondition): ConditionData {
  const id = toConditionId(condition);
  return id === 'exhaustion' ? { id, maxLevel: 6 } : { id };
}

export const toConditionText = (condition: FiveToolsCondition): ConditionText => ({
  name: condition.name,
  description: renderEntries(condition.entries),
});
