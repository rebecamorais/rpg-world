'use client';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { SelectField } from '@frontend/components/ui/select-field';
import { useConditions } from '@frontend/hooks/useConditions';
import {
  SPELLBOOK_CASTING_TIMES,
  type SpellbookCastingTime,
  type SpellbookFilters,
  activeSpellbookFilterCount,
  conditionIdOf,
} from '@frontend/lib/spellbook-filter';
import { cn } from '@frontend/lib/utils';
import type { Spell } from '@frontend/types/spells';

interface SpellbookFilterBarProps {
  spells: Spell[];
  filters: SpellbookFilters;
  onChange: (filters: SpellbookFilters) => void;
  onClear: () => void;
}

const FILTERS_ID = 'spellbook-filters';
const SELECT_CLASS = 'border-border bg-muted text-foreground h-10 w-full gap-2 sm:w-auto';

type Toggle = 'preparedOnly' | 'concentration' | 'ritual';

/** Distinct values of a field among the learned spells, so a select never offers a dead end. */
function presentValues(spells: Spell[], pick: (spell: Spell) => string | null | undefined) {
  return [...new Set(spells.map(pick).filter((v): v is string => Boolean(v)))].sort();
}

export function SpellbookFilterBar({
  spells,
  filters,
  onChange,
  onClear,
}: SpellbookFilterBarProps) {
  const t = useTranslations('characters.spellbookFilters');
  const tSpellsDrawer = useTranslations('spellsDrawer');
  const tSpellsData = useTranslations('spellsData');
  const tConditions = useTranslations('conditions');
  const { byKey } = useConditions();
  const [open, setOpen] = useState(false);

  const set = <K extends keyof SpellbookFilters>(key: K, value: SpellbookFilters[K]) =>
    onChange({ ...filters, [key]: value });
  const activeCount = activeSpellbookFilterCount(filters);
  const canClear = activeCount > 0 || filters.search !== '';

  const schools = useMemo(() => presentValues(spells, (s) => s.school), [spells]);
  const damageTypes = useMemo(() => presentValues(spells, (s) => s.damageType), [spells]);

  // One option per condition the spells cite, named in the edition of the first spell that does
  const conditionOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const spell of spells) {
      for (const key of spell.conditions ?? []) {
        const id = conditionIdOf(key);
        if (id && !byId.has(id)) byId.set(id, byKey.get(key)?.name ?? id);
      }
    }
    return [...byId]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [spells, byKey]);

  const toggles: { key: Toggle; label: string }[] = [
    { key: 'preparedOnly', label: t('prepared') },
    { key: 'concentration', label: t('concentration') },
    { key: 'ritual', label: t('ritual') },
  ];

  return (
    <div role="group" aria-label={t('filters')} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <AppIcon
            name="Search"
            size={18}
            aria-hidden="true"
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <Input
            type="search"
            aria-label={t('searchLabel')}
            placeholder={t('searchPlaceholder')}
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="focus:ring-character/50 border-border bg-muted text-foreground pl-10"
          />
        </div>

        {/* Phones: the filters fold behind this button, so the spellbook keeps the screen */}
        <Button
          variant="outline"
          aria-expanded={open}
          aria-controls={FILTERS_ID}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            'h-10 shrink-0 sm:hidden',
            activeCount > 0 && 'border-character-muted text-character-flare',
          )}
        >
          <AppIcon name="Settings2" size={16} aria-hidden="true" />
          {tSpellsDrawer('filtersToggle', { count: activeCount })}
        </Button>
      </div>

      <div
        id={FILTERS_ID}
        className={cn(
          'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center',
          !open && 'max-sm:hidden',
        )}
      >
        {toggles.map(({ key, label }) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            aria-pressed={filters[key]}
            onClick={() => set(key, !filters[key])}
            className={cn(
              'h-10',
              filters[key] && 'border-character-muted bg-character-surface text-character-flare',
            )}
          >
            {label}
          </Button>
        ))}

        {schools.length > 1 && (
          <SelectField
            aria-label={tSpellsDrawer('filterLabels.school')}
            value={filters.school ?? 'all'}
            onValueChange={(val) => set('school', val === 'all' ? null : val)}
            className={cn(SELECT_CLASS, 'sm:min-w-[150px]')}
            options={[
              { value: 'all', label: t('allSchools') },
              ...schools.map((school) => ({
                value: school,
                label: tSpellsData(`schools.${school}` as Parameters<typeof tSpellsData>[0]),
              })),
            ]}
          />
        )}

        {damageTypes.length > 0 && (
          <SelectField
            aria-label={tSpellsDrawer('filterLabels.damage')}
            value={filters.damage ?? 'all'}
            onValueChange={(val) => set('damage', val === 'all' ? null : val)}
            className={cn(SELECT_CLASS, 'sm:min-w-[150px]')}
            options={[
              { value: 'all', label: t('allDamage') },
              ...damageTypes.map((type) => ({
                value: type,
                label: tSpellsData(`damageTypes.${type}` as Parameters<typeof tSpellsData>[0]),
              })),
            ]}
          />
        )}

        {conditionOptions.length > 0 && (
          <SelectField
            aria-label={tConditions('filter')}
            value={filters.condition ?? 'all'}
            onValueChange={(val) => set('condition', val === 'all' ? null : val)}
            className={cn(SELECT_CLASS, 'sm:min-w-[150px]')}
            options={[{ value: 'all', label: tConditions('any') }, ...conditionOptions]}
          />
        )}

        <SelectField
          aria-label={t('castingTime')}
          value={filters.castingTime ?? 'all'}
          onValueChange={(val) =>
            set('castingTime', val === 'all' ? null : (val as SpellbookCastingTime))
          }
          className={cn(SELECT_CLASS, 'col-span-2 sm:min-w-[190px]')}
          options={[
            { value: 'all', label: t('allCastingTimes') },
            ...SPELLBOOK_CASTING_TIMES.map((time) => ({
              value: time,
              label: t(`castingTimes.${time}`),
            })),
          ]}
        />

        {canClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-character-flare hover:bg-character-surface hover:text-character-flare col-span-2 justify-self-start"
          >
            <AppIcon name="X" size={16} aria-hidden="true" />
            {t('clear')}
          </Button>
        )}
      </div>
    </div>
  );
}
