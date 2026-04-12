import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the appropriate text color class based on an RPG value (bonus/penalty).
 * @param value The numerical value to check.
 */
export function getStatColorClass(value: number): string {
  if (value > 0) return 'text-character-flare';
  if (value < 0) return 'text-red-flare';
  return 'text-foreground';
}
