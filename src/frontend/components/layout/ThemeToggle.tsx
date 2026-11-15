'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { useTheme } from '@frontend/hooks/useTheme';

/**
 * Switches between the dark and light themes; the icon shows where the click goes. Both
 * variants are rendered and CSS keyed on <html data-theme> picks one, so prebuilt pages show
 * the right icon and name before hydration (the inline script sets data-theme before paint).
 * Same size and tooltip as its neighbor, the contact button.
 */
export function ThemeToggle() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <span className="contents [[data-theme=light]_&]:hidden">
            <AppIcon name="Sun" size={16} aria-hidden="true" />
            <span className="sr-only">{t('useLightTheme')}</span>
          </span>
          <span className="hidden [[data-theme=light]_&]:contents">
            <AppIcon name="Moon" size={16} aria-hidden="true" />
            <span className="sr-only">{t('useDarkTheme')}</span>
          </span>
        </Button>
      </TooltipTrigger>
      {/* The tooltip is in a portal, still under <html data-theme>: the same CSS picks its text */}
      <TooltipContent>
        <p className="[[data-theme=light]_&]:hidden">{t('useLightTheme')}</p>
        <p className="hidden [[data-theme=light]_&]:block">{t('useDarkTheme')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
