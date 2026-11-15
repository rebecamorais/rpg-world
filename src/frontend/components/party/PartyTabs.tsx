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

/** "Round 2" while a combat runs (not while it is being prepared), or null. */
function useCombatRound(partyId: string): CombatRound | null {
  const t = useTranslations('combat');
  const { encounter } = useEncounter(partyId);
  if (!encounter || encounter.round === 0) return null;
  return { round: encounter.round, label: t('round', { round: encounter.round }) };
}

interface CombatRound {
  round: number;
  label: string;
}

/**
 * The round on the Combat tab, so it shows from any other tab. `compact` is the phone's bar, too
 * narrow for the words: just the number on the icon's corner. Both are only seen: the link's own
 * name says it (text in a child span ran into "CombatRound 2").
 */
function CombatBadge({ round, compact = false }: { round: CombatRound; compact?: boolean }) {
  if (compact) {
    return (
      <span
        aria-hidden="true"
        className="border-warning-muted bg-card text-warning-flare absolute top-1 left-1/2 ml-2 min-w-5 rounded-full border px-1 text-center text-xs leading-4 font-bold"
      >
        {round.round}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="bg-warning/15 text-warning-flare rounded-full px-2 py-0.5 text-xs font-semibold"
    >
      {round.label}
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
  const round = useCombatRound(partyId);
  // "Combat, round 2" while a combat runs; the other tabs keep their visible text as their name
  const nameOf = (tab: PartyTab) =>
    tab.id === 'combat' && round ? t('combatRound', { round: round.round }) : undefined;

  return (
    <>
      <nav aria-label={t('label')} className="border-border hidden border-b md:block">
        <ul className="flex gap-1">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <AppLink
                href={tab.href}
                aria-current={tab.isActive ? 'page' : undefined}
                aria-label={nameOf(tab)}
                className={cn(
                  'focus-ring -mb-px flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors',
                  tab.isActive
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )}
              >
                {/* The same icons as the phone's bar: one look for both */}
                <AppIcon name={tab.icon} size={16} aria-hidden="true" />
                {t(tab.id)}
                {tab.id === 'combat' && round && <CombatBadge round={round} />}
              </AppLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        data-scroll-pad="party-tabs"
        aria-label={t('label')}
        className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-[left] duration-200 ease-out sm:left-(--sidebar-offset) md:hidden"
      >
        <ul className="grid grid-cols-4">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <AppLink
                href={tab.href}
                aria-current={tab.isActive ? 'page' : undefined}
                aria-label={nameOf(tab)}
                className={cn(
                  'focus-ring relative flex min-h-14 flex-col items-center justify-center gap-1 text-xs transition-colors',
                  tab.isActive
                    ? 'text-primary-flare font-semibold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <AppIcon name={tab.icon} size={20} aria-hidden="true" />
                {t(tab.id)}
                {tab.id === 'combat' && round && <CombatBadge round={round} compact />}
              </AppLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
