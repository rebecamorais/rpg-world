import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Type roles from app/globals.css. Each one sets family, size, weight, tracking and line height,
 * so in cn() a role replaces earlier classes of those groups (`font-medium` from a base style)
 * and a later explicit size (`text-sm`) replaces the role.
 */
const TYPE_ROLES = ['display', 'title', 'heading', 'body', 'label', 'caption'] as const;

const twMerge = extendTailwindMerge<'type-role'>({
  extend: {
    classGroups: { 'type-role': [{ text: [...TYPE_ROLES] }] },
    conflictingClassGroups: {
      'type-role': ['font-size', 'font-weight', 'font-family', 'tracking', 'leading'],
      'font-size': ['type-role'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the appropriate text color class based on an RPG value (bonus/penalty).
 * @param value The numerical value to check.
 */
export function getStatColorClass(value: number): string {
  if (value > 0) return 'text-character-flare';
  if (value < 0) return 'text-danger-flare';
  return 'text-foreground';
}
