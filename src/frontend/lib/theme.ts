export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'dark';
const THEME_COOKIE = 'theme';

/** Anything but a known theme falls back to the default. */
export function parseTheme(value: string | undefined | null): Theme {
  return THEMES.find((theme) => theme === value) ?? DEFAULT_THEME;
}

export function themeCookie(theme: Theme): string {
  return `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Inline script for the root layout's <head>: prebuilt pages can't read the cookie on the server,
 * so the browser sets the theme before first paint.
 */
export const THEME_SCRIPT = `(function(){var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);document.documentElement.dataset.theme=m&&m[1]==='light'?'light':'dark'})()`;

export function applyTheme(theme: Theme): void {
  document.cookie = themeCookie(theme);
  document.documentElement.dataset.theme = theme;
}
