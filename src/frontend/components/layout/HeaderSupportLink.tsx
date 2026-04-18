'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';

import { AppIcon } from '../ui/icon';

export function HeaderSupportLink() {
  const t = useTranslations('common');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-white">
          <Link href="/support">
            <AppIcon name="Bug" size="sm" />
            <span className="sr-only">{t('contact')}</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('contactTooltip')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
