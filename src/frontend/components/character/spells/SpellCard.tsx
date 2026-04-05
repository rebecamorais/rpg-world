'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { MECHANIC_ICONS } from '@frontend/constants/damage-themes';
import { useSpellDisplay } from '@frontend/hooks/useSpellDisplay';
import { cn } from '@frontend/lib/utils';
import type { Spell } from '@frontend/types/spells';

import { SpellBackground } from './SpellBackground';
import { SpellChip } from './SpellChip';

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
  const { theme, mainIcon, schoolIcon, damageKey, tData } = useSpellDisplay(spell);

  const translatedDamageType = spell.damageType
    ? tData(`damageTypes.${damageKey}` as Parameters<typeof tData>[0])
    : null;
  const translatedSchool =
    spell.school &&
    tData.has(`schools.${spell.school.toLowerCase()}` as Parameters<typeof tData>[0])
      ? tData(`schools.${spell.school.toLowerCase()}` as Parameters<typeof tData>[0])
      : spell.school;

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-6 transition-all duration-500 ease-out ${theme.border} bg-card/40 backdrop-blur-md hover:-translate-y-2 hover:border-[var(--theme-primary)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] hover:backdrop-blur-xl active:scale-[0.98]`}
      style={
        {
          '--theme-primary': `var(--color-${theme.color.split('-')[1]}-500)`,
        } as React.CSSProperties
      }
    >
      {/* Dynamic Glow Effect */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100`}
        style={{
          background: `radial-gradient(circle at center, ${theme.glow.replace('shadow-', '').replace('/10', '')}, transparent 70%)`,
        }}
      />

      {/* Background VFX Pattern */}
      <SpellBackground spell={spell} />

      {/* Eldritch Scanline Animation */}
      <div className="group-hover:animate-shimmer pointer-events-none absolute inset-0 z-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Parallax Background Icon */}
      <div className="pointer-events-none absolute -right-8 -bottom-8 z-0 opacity-5 transition-all duration-700 ease-in-out group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-15">
        <AppIcon variant="game" name={mainIcon} size={160} strokeWidth={0.5} />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <header className="mb-5 flex items-center gap-4">
          <div
            className={cn(
              'rounded-xl p-3 shadow-sm ring-1 ring-white/10 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lg',
              theme.bg,
              theme.color,
            )}
          >
            <AppIcon variant="game" name={mainIcon} size={28} strokeWidth={2.5} />
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-serif text-xl font-bold tracking-tight text-white/90">
                {spell.name}
              </h3>
              {spell.ritual && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 ring-inset">
                  <AppIcon variant="game" name={MECHANIC_ICONS.ritual} size={14} />
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-80">
              <span className={cn('flex items-center gap-1', theme.color)}>
                <AppIcon variant="game" name={schoolIcon} size={14} className="opacity-70" />
                {translatedSchool}
              </span>
              {translatedDamageType && (
                <>
                  <span className="opacity-40">•</span>
                  <span className={cn('flex items-center gap-1', theme.color)}>
                    <AppIcon variant="game" name={mainIcon} size={12} strokeWidth={3} />
                    <span>{translatedDamageType}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        <div
          className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${
            isExpanded ? 'mb-6 grid-rows-[1fr] opacity-100' : 'mb-0 grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <section className="font-body pt-2 text-sm leading-relaxed text-gray-400 transition-colors group-hover:text-gray-200">
              <div className="space-y-4">
                <p className="whitespace-pre-wrap">{spell.description}</p>

                {/* Extra Details Example */}
                {spell.higherLevel && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-xs shadow-inner">
                    <strong className="text-white">Em Níveis Superiores:</strong>{' '}
                    {spell.higherLevel}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-auto flex flex-wrap gap-2">
          <SpellChip>{translatedSchool}</SpellChip>

          {/* New info chips */}
          {(spell.castingTime || spell.castingValue) && (
            <SpellChip
              icon={<AppIcon name="Clock" size={14} />}
              tooltip={tCharacters('castingTime')}
            >
              {spell.castingTime &&
              tData.has(`castingTimes.${spell.castingTime}` as Parameters<typeof tData>[0])
                ? tData(`castingTimes.${spell.castingTime}` as Parameters<typeof tData>[0], {
                    value: spell.castingValue || 1,
                  })
                : [spell.castingValue, spell.castingTime].filter(Boolean).join(' ')}
            </SpellChip>
          )}

          {(spell.rangeUnit || spell.rangeValue !== undefined) && (
            <SpellChip icon={<AppIcon name="Crosshair" size={14} />} tooltip={tCharacters('range')}>
              {spell.rangeUnit &&
              tData.has(`ranges.${spell.rangeUnit}` as Parameters<typeof tData>[0])
                ? tData(`ranges.${spell.rangeUnit}` as Parameters<typeof tData>[0], {
                    feet: spell.rangeValue || 0,
                    meters: Math.round(((spell.rangeValue || 0) / 5) * 1.5 * 10) / 10,
                    miles: spell.rangeValue || 0,
                    km: Math.round((spell.rangeValue || 0) * 1.6 * 10) / 10,
                  })
                : [spell.rangeValue, spell.rangeUnit].filter(Boolean).join(' ')}
            </SpellChip>
          )}

          {(spell.durationUnit || spell.durationValue !== undefined) && (
            <SpellChip
              icon={<AppIcon name="Hourglass" size={14} />}
              tooltip={tCharacters('duration')}
            >
              {spell.durationUnit &&
              tData.has(`durations.${spell.durationUnit}` as Parameters<typeof tData>[0])
                ? tData(`durations.${spell.durationUnit}` as Parameters<typeof tData>[0], {
                    value: spell.durationValue || 1,
                  })
                : [spell.durationValue, spell.durationUnit].filter(Boolean).join(' ')}
            </SpellChip>
          )}

          {spell.components && spell.components.length > 0 && (
            <SpellChip
              icon={
                <div className="flex items-center gap-1.5 opacity-80 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">
                  {spell.components.map((comp) => {
                    const iconName =
                      comp === 'V'
                        ? MECHANIC_ICONS.verbal
                        : comp === 'S'
                          ? MECHANIC_ICONS.somatic
                          : comp === 'M'
                            ? MECHANIC_ICONS.material
                            : null;
                    return iconName ? (
                      <AppIcon key={comp} variant="game" name={iconName} size={14} />
                    ) : null;
                  })}
                </div>
              }
              tooltip={tCharacters('components')}
            >
              {/* Text hidden in favor of icons */}
            </SpellChip>
          )}

          {spell.concentration && (
            <SpellChip
              variant="concentration"
              tooltip={isExpanded ? undefined : tCharacters('concentration')}
              icon={<AppIcon variant="game" name={MECHANIC_ICONS.concentration} size={14} />}
            >
              {isExpanded && tCharacters('concentration')}
            </SpellChip>
          )}
          {spell.ritual && (
            <SpellChip
              variant="ritual"
              tooltip={isExpanded ? undefined : tCharacters('ritual')}
              icon={<AppIcon variant="game" name={MECHANIC_ICONS.ritual} size={14} />}
            >
              {isExpanded && tCharacters('ritual')}
            </SpellChip>
          )}
        </footer>

        {/* Action Buttons (Only visible when expanded) */}
        {isExpanded && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
            {onLearnSpell ? (
              /* Selection Mode: Learn/Forget from catalog */
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLearned) {
                    onForgetSpell?.(spell.id);
                  } else {
                    onLearnSpell?.(spell.id);
                  }
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
                  isLearned
                    ? 'border border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-500/60 hover:bg-red-500/20'
                    : 'border border-[var(--theme-primary)] bg-[var(--theme-primary)] text-slate-950 shadow-md hover:opacity-90'
                }`}
              >
                {isLearned ? (
                  <>
                    <AppIcon name="Trash2" size={18} />
                    {tCharacters('forgetSpell')}
                  </>
                ) : (
                  <>
                    <AppIcon name="Plus" size={18} />
                    {tCharacters('learn')}
                  </>
                )}
              </button>
            ) : (
              /* Managed Mode: Prepare/Forget from known spells */
              <>
                {spell.level > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePrepared?.(spell.id, !spell.isPrepared);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
                      spell.isPrepared
                        ? 'border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:border-amber-500/60 hover:bg-amber-500/20'
                        : 'border border-amber-500 bg-amber-500 text-amber-950 shadow-md hover:bg-amber-400 hover:shadow-amber-500/20'
                    }`}
                  >
                    <AppIcon
                      name="Bookmark"
                      size={18}
                      className={
                        spell.isPrepared ? 'fill-amber-500/50 text-amber-500' : 'text-amber-950'
                      }
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
        )}
      </div>
    </div>
  );
}
