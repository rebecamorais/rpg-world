'use client';

import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { AppIcon, type IconName } from '@frontend/components/ui/icon';
import AppLink from '@frontend/demo/AppLink';
import { useEncounter } from '@frontend/hooks/useEncounter';
import { cn } from '@frontend/lib/utils';

interface PartyTab {
  id: 'overview' | 'combat' | 'journal' | 'chest';
  icon: IconName;
  href: string;
  isActive: boolean;
}

/** The party's four places. The overview (the table) is the party's root: every other tab's path starts with it. */
function usePartyTabs(partyId: string): PartyTab[] {
  const pathname = usePathname();
  const root = `/parties/${partyId}`;
  const tabs: Omit<PartyTab, 'isActive'>[] = [
    { id: 'overview', icon: 'Users', href: root },
    { id: 'combat', icon: 'Swords', href: `${root}/combat` },
    { id: 'journal', icon: 'BookOpen', href: `${root}/journal` },
    { id: 'chest', icon: 'Backpack', href: `${root}/inventory` },
  ];
  return tabs.map((tab) => ({
    ...tab,
    isActive: tab.id === 'overview' ? pathname === tab.href : !!pathname?.startsWith(tab.href),
  }));
}

/** "Round 2" on the Combat tab while a combat runs, so it shows from any other tab. */
function CombatBadge({ partyId }: { partyId: string }) {
  const t = useTranslations('combat');
  const { encounter } = useEncounter(partyId);
  if (!encounter || encounter.round === 0) return null;

  return (
    <span className="bg-warning/15 text-warning-flare rounded-full px-2 py-0.5 text-xs font-semibold">
      {t('round', { round: encounter.round })}
    </span>
  );
}

/**
 * The party's tabs: Table, Combat, Journal and Chest. Under the title on larger screens; at the
 * bottom of a phone, in reach of the thumb, like the sheet's.
 */
export function PartyTabs({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.tabs');
  const tabs = usePartyTabs(partyId);

  return (
    <>
      <nav aria-label={t('label')} className="border-border hidden border-b md:block">
        <ul className="flex gap-1">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <AppLink
                href={tab.href}
                aria-current={tab.isActive ? 'page' : undefined}
                className={cn(
                  'focus-ring -mb-px flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors',
                  tab.isActive
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )}
              >
                {t(tab.id)}
                {tab.id === 'combat' && <CombatBadge partyId={partyId} />}
              </AppLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        data-scroll-pad="party-tabs"
        aria-label={t('label')}
        className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-4">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <AppLink
                href={tab.href}
                aria-current={tab.isActive ? 'page' : undefined}
                className={cn(
                  'focus-ring flex min-h-14 flex-col items-center justify-center gap-1 text-xs transition-colors',
                  tab.isActive
                    ? 'text-primary-flare font-semibold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <AppIcon name={tab.icon} size={20} aria-hidden="true" />
                {t(tab.id)}
              </AppLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
