'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { useTheme } from '@frontend/hooks/useTheme';

/** Switches between the dark and light themes; the icon shows where the click goes. */
export function ThemeToggle() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();
  const goLight = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground"
      aria-label={goLight ? t('useLightTheme') : t('useDarkTheme')}
      onClick={() => setTheme(goLight ? 'light' : 'dark')}
    >
      <AppIcon name={goLight ? 'Sun' : 'Moon'} size={16} aria-hidden="true" />
    </Button>
  );
}
