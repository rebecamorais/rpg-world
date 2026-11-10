import { useSyncExternalStore } from 'react';

import { DEFAULT_THEME, type Theme, applyTheme, parseTheme } from '@frontend/lib/theme';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const getSnapshot = () => parseTheme(document.documentElement.dataset.theme);
const getServerSnapshot = (): Theme => DEFAULT_THEME;

/** The theme on <html> (set by the inline script before paint) and a way to change it. */
export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { theme, setTheme: applyTheme };
}
