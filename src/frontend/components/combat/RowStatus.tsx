import { useTranslations } from 'next-intl';

import { AppIcon, type IconName } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

import type { GmRow } from '@backend/contexts/combat/domain/Encounter';

type Status = {
  key: 'visibilityHidden' | 'visibilityAnonymous' | 'dead' | 'deathStable' | 'down';
  icon: IconName;
  color: string;
};

/** What sets this NPC apart from the normal: unseen by the players, then down, dead or stable. */
function statusesOf(row: GmRow): Status[] {
  if (row.side === 'player') return [];
  const statuses: Status[] = [];
  if (row.visibility === 'hidden') {
    statuses.push({ key: 'visibilityHidden', icon: 'EyeOff', color: 'text-warning-flare' });
  } else if (row.visibility === 'anonymous') {
    statuses.push({
      key: 'visibilityAnonymous',
      icon: 'VenetianMask',
      color: 'text-warning-flare',
    });
  }
  if (row.fate === 'dead') {
    statuses.push({ key: 'dead', icon: 'Skull', color: 'text-foreground' });
  } else if ((row.deathSaves?.successes ?? 0) >= 3) {
    statuses.push({ key: 'deathStable', icon: 'HeartPulse', color: 'text-success-flare' });
  } else if (row.hp.current === 0) {
    statuses.push({ key: 'down', icon: 'HeartCrack', color: 'text-danger-flare' });
  }
  return statuses;
}

/**
 * An NPC's state badges in the GM's closed row: hidden, anonymous, down, dead (not yet revealed)
 * or stable. Visible and standing has none. Icon plus text: color is never the only cue.
 */
export function RowStatus({ row }: { row: GmRow }) {
  const t = useTranslations('combat');
  const statuses = statusesOf(row);
  if (statuses.length === 0) return null;

  return (
    <>
      {statuses.map(({ key, icon, color }) => (
        <span
          key={key}
          className={cn(
            'text-label bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5',
            color,
          )}
        >
          <AppIcon name={icon} size={12} aria-hidden="true" />
          {t(key)}
        </span>
      ))}
    </>
  );
}
