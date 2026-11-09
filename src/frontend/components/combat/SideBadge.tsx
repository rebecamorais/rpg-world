import { useTranslations } from 'next-intl';

import { AppIcon, type IconName } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

import type { Side } from '@backend/contexts/combat/domain/Encounter';

// Each side has an icon and a theme color, but the text always says it: color is never the only cue
const SIDES: Record<Side, { icon: IconName; color: string }> = {
  player: { icon: 'User', color: 'text-primary-flare' },
  ally: { icon: 'Shield', color: 'text-success-flare' },
  neutral: { icon: 'Footprints', color: 'text-warning-flare' },
  enemy: { icon: 'Sword', color: 'text-danger-flare' },
};

/** Which side a combatant is on: icon plus the translated name. */
export function SideBadge({ side, className }: { side: Side; className?: string }) {
  const t = useTranslations('combat');
  const { icon, color } = SIDES[side];

  return (
    <span className={cn('text-label inline-flex items-center gap-1', color, className)}>
      <AppIcon name={icon} size={12} aria-hidden="true" />
      {t(side)}
    </span>
  );
}
