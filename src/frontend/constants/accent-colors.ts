/**
 * The color choices of the profile and of a character. Hex values only (#rrggbb), the format the
 * schemas accept; the empty one keeps the app's default. Names are keys of `profileForm.colors`.
 */
export const ACCENT_COLORS = [
  { name: 'default', value: '' },
  { name: 'red', value: '#ef4444' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'green', value: '#22c55e' },
  { name: 'purple', value: '#a855f7' },
  { name: 'yellow', value: '#eab308' },
  { name: 'orange', value: '#f97316' },
  { name: 'cyan', value: '#06b6d4' },
  { name: 'pink', value: '#ec4899' },
  { name: 'slate', value: '#64748b' },
] as const;
