import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { cn } from '@frontend/lib/utils';

import type { CharacterKind } from '@backend/contexts/characters/domain/entity/Character';

const TABS: { kind: CharacterKind; href: string }[] = [
  { kind: 'pc', href: '/characters' },
  { kind: 'npc', href: '/characters/npcs' },
];

/** My characters / My NPCs: two pages, so each tab has its own address (and back button). */
export function CharacterKindTabs({ current }: { current: CharacterKind }) {
  const t = useTranslations('characters.kinds');

  return (
    <nav
      aria-label={t('label')}
      className="bg-muted text-muted-foreground mb-6 inline-flex h-10 items-center rounded-md p-1"
    >
      {TABS.map(({ kind, href }) => (
        <Link
          key={kind}
          href={href}
          aria-current={kind === current ? 'page' : undefined}
          className={cn(
            'focus-ring touch-target hover:text-foreground inline-flex items-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
            kind === current && 'bg-background text-foreground shadow-sm',
          )}
        >
          {t(kind)}
        </Link>
      ))}
    </nav>
  );
}
