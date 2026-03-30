'use client';

import { useTranslations } from 'next-intl';

interface FormattedUnitProps {
  value: number | null;
  unit: string | null;
  category: 'range' | 'duration' | 'casting_time';
  fallback?: string;
}

export function FormattedUnit({ value, unit, category, fallback }: FormattedUnitProps) {
  const t = useTranslations('spellsData');

  if (value === null || value === undefined) {
    if (!unit) return <span>{fallback || '-'}</span>;
    let content: string;
    try {
      const prefixes: Record<string, string> = {
        range: 'ranges',
        duration: 'durations',
        casting_time: 'castingTimes',
      };
      const key = `${prefixes[category]}.${unit}`;
      content = t(key);
    } catch {
      content = unit;
    }
    return <span>{content}</span>;
  }

  if (category === 'range') {
    if (unit === 'feet' || unit === 'foot') {
      const meters = (value / 5) * 1.5;
      const formattedMeters = Number.isInteger(meters) ? meters : meters.toFixed(1);
      return <span>{t('ranges.feet', { feet: value, meters: formattedMeters })}</span>;
    }

    if (unit === 'mile' || unit === 'miles') {
      const km = (value * 1.609).toFixed(1);
      return <span>{t('ranges.mile', { miles: value, km })}</span>;
    }

    return (
      <span>
        {value} {unit}
      </span>
    );
  }

  // Durations & Casting Times
  let content: string;
  try {
    const key = category === 'casting_time' ? `castingTimes.${unit}` : `durations.${unit}`;
    content = t(key, { value });
  } catch {
    content = `${value} ${unit}`;
  }

  return <span>{content}</span>;
}
