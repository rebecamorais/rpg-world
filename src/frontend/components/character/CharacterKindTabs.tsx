import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { cn } from '@frontend/lib/utils';

import type { CharacterKind } from '@backend/contexts/characters/domain/entity/Character';

const TABS: { kind: CharacterKind; href: string }[] = [
  { kind: 'pc', href: '/characters' },
  { kind: 'npc', href: '/characters/npcs' },
];

/**
 * My characters / My NPCs: two pages, so each tab has its own address (and back button).
 * Underlined like the party's tabs (PartyTabs): tabs that are pages look the same everywhere.
 */
export function CharacterKindTabs({ current }: { current: CharacterKind }) {
  const t = useTranslations('characters.kinds');

  return (
    <nav aria-label={t('label')} className="border-border mb-6 border-b">
      <ul className="flex gap-1">
        {TABS.map(({ kind, href }) => (
          <li key={kind}>
            <Link
              href={href}
              aria-current={kind === current ? 'page' : undefined}
              className={cn(
                'focus-ring -mb-px flex h-11 items-center border-b-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                kind === current
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {t(kind)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
