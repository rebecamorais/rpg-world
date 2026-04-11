'use client';

import React, { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { COMPONENT_METADATA, DamageTheme, MECHANIC_ICONS } from '@frontend/constants/damage-themes';
import { SpellDisplayValues, useSpellDisplay } from '@frontend/hooks/useSpellDisplay';
import { cn } from '@frontend/lib/utils';
import type { Spell } from '@frontend/types/spells';

import { SpellBackground } from './SpellBackground';
import { SpellChip } from './SpellChip';

// --- Shared Types ---

type TranslationFn = ReturnType<typeof useTranslations>;

interface SpellSubComponentProps {
  spell: Spell;
  isExpanded: boolean;
  theme: DamageTheme;
}

interface SpellCardProps {
  spell: Spell;
  isExpanded?: boolean;
  onClick?: () => void;
  onForgetSpell?: (id: string) => void;
  onTogglePrepared?: (id: string, isPrepared: boolean) => void;
  onLearnSpell?: (id: string) => void;
  isLearned?: boolean;
}

export function SpellCard({
  spell,
  isExpanded = false,
  onClick,
  onForgetSpell,
  onTogglePrepared,
  onLearnSpell,
  isLearned,
}: SpellCardProps) {
  const tCharacters = useTranslations('characters');
  const { theme, mainIcon, schoolIcon, displayValues } = useSpellDisplay(spell);

  const cardStyles = useMemo(
    () =>
      ({
        '--theme-primary': theme.hex,
        '--card-glow': theme.hex,
        '--card-muted': `color-mix(in srgb, ${theme.hex}, transparent 70%)`,
        contentVisibility: 'auto',
      }) as React.CSSProperties,
    [theme.hex],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-500 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[var(--card-glow)] focus-visible:ring-offset-2',
        'bg-card/40 backdrop-blur-md hover:-translate-y-1 hover:border-[var(--card-glow)] hover:backdrop-blur-xl active:scale-[0.98]',
        isExpanded ? 'bg-card/60 border-[var(--card-glow)] p-6 shadow-lg' : 'hover:bg-card/50 p-3',
        !isExpanded && theme.border,
      )}
      style={cardStyles}
    >
      <SpellVFX mainIcon={mainIcon} spell={spell} />

      <div className="relative z-10 flex h-full flex-col">
        <SpellHeader spell={spell} isExpanded={isExpanded} theme={theme} mainIcon={mainIcon} />

        <SpellStats
          isExpanded={isExpanded}
          theme={theme}
          schoolIcon={schoolIcon}
          mainIcon={mainIcon}
          displayValues={displayValues}
        />

        <SpellDetails spell={spell} isExpanded={isExpanded} />

        {isExpanded && (
          <>
            <div className="mt-auto">
              <SpellChipsRow
                spell={spell}
                displayValues={displayValues}
                tCharacters={tCharacters}
              />
            </div>
            <SpellActions
              spell={spell}
              onForgetSpell={onForgetSpell}
              onTogglePrepared={onTogglePrepared}
              onLearnSpell={onLearnSpell}
              isLearned={isLearned}
              tCharacters={tCharacters}
            />
          </>
        )}
      </div>
    </article>
  );
}

// --- Sub-components (Memoized) ---

const SpellVFX = React.memo(({ mainIcon, spell }: { mainIcon: string; spell: Spell }) => (
  <>
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100"
      style={{
        background: `radial-gradient(circle at center, var(--card-muted), transparent 70%)`,
      }}
    />
    <SpellBackground spell={spell} />
    <div className="group-hover:animate-shimmer pointer-events-none absolute inset-0 z-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    <div className="pointer-events-none absolute -right-8 -bottom-8 z-0 opacity-5 transition-all duration-700 ease-in-out group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-15">
      <AppIcon variant="game" name={mainIcon} size={160} strokeWidth={0.5} />
    </div>
  </>
));
SpellVFX.displayName = 'SpellVFX';

interface SpellHeaderProps extends Pick<SpellSubComponentProps, 'spell' | 'isExpanded' | 'theme'> {
  mainIcon: string;
}

const SpellHeader = React.memo(({ spell, isExpanded, theme, mainIcon }: SpellHeaderProps) => (
  <header
    className={cn(
      'flex items-center transition-all duration-300',
      isExpanded ? 'mb-5 gap-4' : 'mb-0.5 gap-3',
    )}
  >
    <div
      className={cn(
        'shadow-sm ring-1 ring-white/10 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lg',
        isExpanded ? 'rounded-xl p-3' : 'rounded-lg p-2',
        theme.bg,
        theme.color,
      )}
    >
      <AppIcon variant="game" name={mainIcon} size={24} strokeWidth={2.5} />
    </div>

    <div className="flex-1 overflow-hidden">
      <div className="flex items-center gap-2">
        <h3
          className={cn(
            'truncate font-serif font-bold tracking-tight text-white/90',
            isExpanded ? 'text-xl' : 'text-sm font-black',
          )}
        >
          {spell.name}
        </h3>
        {spell.ritual && (
          <AppIcon
            variant="game"
            name={MECHANIC_ICONS.ritual}
            size={18}
            className="shrink-0 text-purple-500"
          />
        )}
        {spell.components?.map((comp) => {
          const metadata = COMPONENT_METADATA[comp as keyof typeof COMPONENT_METADATA];
          if (!metadata) return null;

          return (
            <Tooltip key={comp}>
              <TooltipTrigger asChild>
                <button className="flex cursor-help items-center justify-center transition-all hover:scale-110 active:scale-95">
                  <AppIcon
                    variant="game"
                    name={metadata.icon}
                    size={18}
                    className={cn('shrink-0', metadata.color)}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent className="border-white/10 bg-black/90 text-xs font-medium text-white">
                {comp}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  </header>
));
SpellHeader.displayName = 'SpellHeader';

interface SpellStatsProps extends Pick<SpellSubComponentProps, 'isExpanded' | 'theme'> {
  schoolIcon: string;
  mainIcon: string;
  displayValues: SpellDisplayValues;
}

const SpellStats = React.memo(
  ({ isExpanded, theme, schoolIcon, mainIcon, displayValues }: SpellStatsProps) => (
    <div
      className={cn(
        'flex items-center font-black tracking-widest uppercase opacity-70 transition-all duration-300',
        isExpanded ? 'mt-4 gap-3 text-xs' : 'mt-0 gap-2 text-[9px]',
      )}
    >
      <span className={cn('flex items-center gap-1.5', theme.color)}>
        <AppIcon
          variant="game"
          name={isExpanded ? schoolIcon : MECHANIC_ICONS.castingTime}
          size={14}
          className="opacity-70"
        />
        <span className="truncate">
          {isExpanded ? displayValues.school : displayValues.compactCastingTime}
        </span>
      </span>
      {displayValues.damage && (
        <>
          <span className="opacity-40">•</span>
          <span className={cn('flex items-center gap-1.5', theme.color)}>
            <AppIcon variant="game" name={mainIcon} size={14} strokeWidth={3} />
            <span>{displayValues.damage}</span>
          </span>
        </>
      )}
    </div>
  ),
);
SpellStats.displayName = 'SpellStats';

const SpellDetails = React.memo(
  ({ spell, isExpanded }: Pick<SpellSubComponentProps, 'spell' | 'isExpanded'>) => (
    <div
      className={cn(
        'grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out',
        isExpanded ? 'mt-5 mb-6 grid-rows-[1fr] opacity-100' : 'mb-0 grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-[100px] overflow-hidden">
        <section className="font-body pt-2 text-sm leading-relaxed text-gray-400 transition-colors group-hover:text-gray-200">
          <div className="space-y-4">
            <p className="whitespace-pre-wrap">{spell.description}</p>
            {spell.higherLevel && (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-xs shadow-inner">
                <strong className="text-white">Em Níveis Superiores:</strong> {spell.higherLevel}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  ),
);
SpellDetails.displayName = 'SpellDetails';

interface SpellChipsRowProps {
  spell: Spell;
  displayValues: SpellDisplayValues;
  tCharacters: TranslationFn;
}

const SpellChipsRow = React.memo(({ spell, displayValues, tCharacters }: SpellChipsRowProps) => (
  <div className="flex flex-wrap gap-1 border-t border-white/5 pt-6">
    {(spell.castingTime || spell.castingValue) && (
      <SpellChip
        icon={<AppIcon variant="game" name={MECHANIC_ICONS.castingTime} size={12} />}
        tooltip={tCharacters('castingTime')}
      >
        {displayValues.castingTime}
      </SpellChip>
    )}
    {(spell.rangeUnit || spell.rangeValue !== undefined) && (
      <SpellChip icon={<AppIcon name="Crosshair" size={10} />} tooltip={tCharacters('range')}>
        {displayValues.range}
      </SpellChip>
    )}
    {(spell.durationUnit || spell.durationValue !== undefined) && (
      <SpellChip
        icon={<AppIcon variant="game" name={MECHANIC_ICONS.duration} size={12} />}
        tooltip={tCharacters('duration')}
      >
        {displayValues.duration}
      </SpellChip>
    )}
    {spell.concentration && (
      <SpellChip
        variant="concentration"
        tooltip={tCharacters('concentration')}
        icon={<AppIcon variant="game" name={MECHANIC_ICONS.concentration} size={10} />}
      >
        {tCharacters('concentration')}
      </SpellChip>
    )}
    {spell.ritual && (
      <SpellChip
        variant="ritual"
        tooltip={tCharacters('ritual')}
        icon={<AppIcon variant="game" name={MECHANIC_ICONS.ritual} size={10} />}
      >
        {tCharacters('ritual')}
      </SpellChip>
    )}
  </div>
));
SpellChipsRow.displayName = 'SpellChipsRow';

interface SpellActionsProps {
  spell: Spell;
  onForgetSpell?: (id: string) => void;
  onTogglePrepared?: (id: string, isPrepared: boolean) => void;
  onLearnSpell?: (id: string) => void;
  isLearned?: boolean;
  tCharacters: TranslationFn;
}

const SpellActions = React.memo(
  ({
    spell,
    onForgetSpell,
    onTogglePrepared,
    onLearnSpell,
    isLearned,
    tCharacters,
  }: SpellActionsProps) => (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
      {onLearnSpell ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isLearned) {
              onForgetSpell?.(spell.id);
            } else {
              onLearnSpell?.(spell.id);
            }
          }}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all',
            isLearned
              ? 'border border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-500/60 hover:bg-red-500/20'
              : 'bg-character text-slate-950 shadow-md hover:opacity-90',
          )}
        >
          <AppIcon name={isLearned ? 'Trash2' : 'Plus'} size={18} />
          {isLearned ? tCharacters('forgetSpell') : tCharacters('learn')}
        </button>
      ) : (
        <>
          {spell.level > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePrepared?.(spell.id, !spell.isPrepared);
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all',
                spell.isPrepared
                  ? 'border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:border-amber-500/60 hover:bg-amber-500/20'
                  : 'border border-amber-500 bg-amber-500 text-amber-950 shadow-md hover:bg-amber-400 hover:shadow-amber-500/20',
              )}
            >
              <AppIcon
                name="Bookmark"
                size={18}
                className={spell.isPrepared ? 'fill-amber-500/50 text-amber-500' : 'text-amber-950'}
              />
              {spell.isPrepared ? tCharacters('unprepareSpell') : tCharacters('prepareSpell')}
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onForgetSpell?.(spell.id);
            }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-400/80 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <AppIcon name="Trash2" size={18} />
            {tCharacters('forgetSpell')}
          </button>
        </>
      )}
    </div>
  ),
);
SpellActions.displayName = 'SpellActions';
