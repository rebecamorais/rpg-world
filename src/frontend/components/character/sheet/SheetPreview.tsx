'use client';

import dynamic from 'next/dynamic';

import { useTranslations } from 'next-intl';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@frontend/components/ui/sheet';
import AppLink from '@frontend/demo/AppLink';
import { useMediaQuery } from '@frontend/hooks/useMediaQuery';

import type { SheetViewerSource } from './SheetViewer';

// The whole sheet (spells, inventory...) only loads when someone opens it
const LazySheetViewer = dynamic(() => import('./SheetViewer').then((m) => m.SheetViewer), {
  ssr: false,
  loading: () => <LoadingState thematic />,
});

/**
 * "View sheet": the character's whole sheet, read-only, in a panel over the party page (from the
 * right on larger screens, from the bottom on a phone), so the table or the combat stays where
 * it was. Whoever can edit it gets "Edit sheet", which opens the sheet's page in a new tab.
 */
export function SheetPreview({
  characterId,
  name,
  source,
  canEdit = false,
}: {
  characterId: string;
  name: string;
  source: SheetViewerSource;
  canEdit?: boolean;
}) {
  const t = useTranslations('sheetViewer');
  const wide = useMediaQuery('(min-width: 768px)') === true;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="touch-target"
          // Starts with the visible words; the name tells apart the buttons of a list
          aria-label={`${t('open')} ${name}`}
        >
          <AppIcon name="Eye" size={16} aria-hidden="true" />
          {t('open')}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={wide ? 'right' : 'bottom'}
        className={
          wide ? 'flex w-full flex-col gap-4 sm:max-w-3xl' : 'flex max-h-[90dvh] flex-col gap-4'
        }
      >
        <SheetHeader className="pr-10">
          <SheetTitle className="text-title">{name}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
          {canEdit && (
            <Button asChild variant="outline" size="sm" className="self-start">
              <AppLink
                href={`/system/DnD_5e/character/${characterId}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('edit')} ${t('newTab')}`}
              >
                <AppIcon name="Pencil" size={16} aria-hidden="true" />
                {t('edit')}
                <AppIcon name="ExternalLink" size={14} aria-hidden="true" />
              </AppLink>
            </Button>
          )}
        </SheetHeader>
        <LazySheetViewer characterId={characterId} source={source} />
      </SheetContent>
    </Sheet>
  );
}
