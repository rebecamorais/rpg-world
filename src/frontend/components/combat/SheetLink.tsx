'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import AppLink from '@frontend/demo/AppLink';

/**
 * Opens a character's sheet in a new tab: the combat stays where it was, the sheet is a tab away.
 * The label says where it opens, for screen readers.
 */
export function SheetLink({ href, name }: { href: string; name: string }) {
  const t = useTranslations('combat');

  return (
    <Button asChild variant="outline" size="sm" className="touch-target">
      <AppLink href={href} target="_blank" rel="noopener noreferrer">
        <AppIcon name="Scroll" size={16} aria-hidden="true" />
        {t('openSheet')}
        <span className="sr-only">
          {' '}
          {name} {t('newTab')}
        </span>
        <AppIcon name="ExternalLink" size={14} aria-hidden="true" />
      </AppLink>
    </Button>
  );
}
