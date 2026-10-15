import type { AttributeKey } from '../types';

export const ATTRIBUTE_KEYS: AttributeKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/** Range of an ability score on the sheet (5e caps them at 30). */
export const MIN_ATTRIBUTE = 1;
export const MAX_ATTRIBUTE = 30;
