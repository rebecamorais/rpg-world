import { getTranslations } from 'next-intl/server';

import { Card } from '@frontend/components/ui/card';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

/** What the app does today, in the order the features page lists them. */
export const AVAILABLE_FEATURES = [
  { key: 'sheet', icon: 'Shield' },
  { key: 'calculations', icon: 'Dices' },
  { key: 'combat', icon: 'Heart' },
  { key: 'magic', icon: 'Sparkles' },
  { key: 'spellbook', icon: 'BookOpen' },
  { key: 'lore', icon: 'Scroll' },
  { key: 'customization', icon: 'Palette' },
  { key: 'languages', icon: 'Languages' },
] as const;

/** On the roadmap, not available yet. */
export const PLANNED_FEATURES = [
  { key: 'parties', icon: 'Swords' },
  { key: 'inventory', icon: 'Backpack' },
  { key: 'systems', icon: 'Book' },
  { key: 'homebrew', icon: 'Wand2' },
] as const;

type Feature = (typeof AVAILABLE_FEATURES)[number] | (typeof PLANNED_FEATURES)[number];

interface FeatureGridProps {
  features: readonly Feature[];
  /** Message group the titles and descriptions come from. */
  group: 'items' | 'planned';
  className?: string;
}

export async function FeatureGrid({ features, group, className }: FeatureGridProps) {
  const t = await getTranslations('features');
  const planned = group === 'planned';

  return (
    <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {features.map(({ key, icon }) => (
        <li key={key}>
          <Card
            className={cn('flex h-full flex-col gap-3 p-5 text-left', planned && 'border-dashed')}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                planned
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary-surface text-primary-flare',
              )}
            >
              <AppIcon name={icon} size={20} />
            </span>
            <h3 className="text-heading text-foreground">{t(`${group}.${key}.title`)}</h3>
            <p className="text-body text-muted-foreground">{t(`${group}.${key}.description`)}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
