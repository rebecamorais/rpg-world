import type { AttributeKey } from '../types';

export const ATTRIBUTE_KEYS: AttributeKey[] = [
    'STR',
    'DEX',
    'CON',
    'INT',
    'WIS',
    'CHA',
];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
    STR: 'Força',
    DEX: 'Destreza',
    CON: 'Constituição',
    INT: 'Inteligência',
    WIS: 'Sabedoria',
    CHA: 'Carisma',
};
