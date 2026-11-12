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

/** Page background of each theme (`--background` in globals.css), for the browser's toolbar. */
export const THEME_COLORS: Record<Theme, string> = { dark: '#09090b', light: '#fafafa' };

/**
 * Inline script for the root layout's <head>: prebuilt pages can't read the cookie on the server,
 * so the browser sets the theme before first paint, and the matching `theme-color` so the
 * phone's toolbar blends with the page. (The OS preference can't pick it: the theme is the
 * player's choice, in a cookie.)
 */
export const THEME_SCRIPT = `(function(){var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);var t=m&&m[1]==='light'?'light':'dark';document.documentElement.dataset.theme=t;var c=document.createElement('meta');c.name='theme-color';c.content=t==='light'?'${THEME_COLORS.light}':'${THEME_COLORS.dark}';document.head.appendChild(c)})()`;

export function applyTheme(theme: Theme): void {
  document.cookie = themeCookie(theme);
  document.documentElement.dataset.theme = theme;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLORS[theme];
}
