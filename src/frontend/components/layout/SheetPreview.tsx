import { getTranslations } from 'next-intl/server';

import { Card } from '@frontend/components/ui/card';
import { HealthBar } from '@frontend/components/ui/health-bar';
import { StatBlock } from '@frontend/components/ui/stat-block';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn, getStatColorClass } from '@frontend/lib/utils';

import { getModifier } from '@shared/systems/dnd5e/calculations';

const ATTRIBUTES = { STR: 8, DEX: 14, CON: 13, INT: 18, WIS: 12, CHA: 10 } as const;

/** A static character sheet on the home page, built from the sheet's own components. */
export async function SheetPreview() {
  const t = await getTranslations('landing');
  const tCombat = await getTranslations('combatStats');
  const tAttr = await getTranslations('attributes.abbreviations');
  const theme = characterTheme('#6d28d9');

  return (
    <figure
      aria-label={t('previewLabel')}
      className={cn(theme.className, 'mx-auto mt-14 w-full max-w-xl text-left')}
      style={theme.style}
    >
      <Card className="flex flex-col gap-5 p-5 shadow-2xl sm:p-6">
        <div className="flex items-center gap-4">
          <div className="border-character-muted bg-muted text-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 font-bold">
            {t('previewName').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-title text-character-flare truncate">{t('previewName')}</p>
            <p className="text-caption text-muted-foreground">{t('previewClass')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-label text-danger-flare">{tCombat('hitPointsShort')}</span>
            <span className="text-foreground font-mono text-sm font-bold tabular-nums">
              24 / 32
            </span>
          </div>
          <HealthBar current={24} max={32} temp={5} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatBlock icon="shoulder-armor" label={tCombat('armorClass')}>
            13
          </StatBlock>
          <StatBlock icon="stopwatch" label={tCombat('initiative')}>
            +2
          </StatBlock>
          <StatBlock icon="boot-prints" label={tCombat('speed')} unit={tCombat('speedUnit')}>
            9
          </StatBlock>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {Object.entries(ATTRIBUTES).map(([key, value]) => {
            const mod = getModifier(value);
            return (
              <div
                key={key}
                className="border-border bg-background/60 flex flex-col items-center rounded-lg border py-2"
              >
                <span className="text-label text-muted-foreground">
                  {tAttr(key as keyof typeof ATTRIBUTES)}
                </span>
                <span
                  className={cn('font-mono text-lg font-bold tabular-nums', getStatColorClass(mod))}
                >
                  {mod >= 0 ? `+${mod}` : mod}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </figure>
  );
}
