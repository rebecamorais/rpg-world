/**
 * Formata distâncias seguindo as regras de RPG (5ft = 1.5m).
 * @param value Valor numérico (ex: 30)
 * @param unit Unidade original (ex: 'feet')
 * @param locale Locale atual ('pt' ou 'en')
 */
export function formatDistance(value: number | null, unit: string | null, locale: string): string {
  if (value === null || value === undefined) {
    return unit || '';
  }

  // Tratamento para pés (feet)
  if (unit === 'feet' || unit === 'foot') {
    if (locale === 'pt') {
      // Regra: cada 5ft = 1.5m
      const meters = (value / 5) * 1.5;
      // Formata para evitar dízimas estranhas se o valor não for múltiplo de 5 (raro no SRD)
      const formattedMeters = Number.isInteger(meters) ? meters : meters.toFixed(1);
      return `${formattedMeters}m (${value} ft)`;
    }
    return `${value} ft`;
  }

  // Tratamento para milhas
  if (unit === 'mile' || unit === 'miles') {
    if (locale === 'pt') {
      const formattedValue = value === 1 ? '1 milha' : `${value} milhas`;
      // Opcional: converter para km (1 milha ~ 1.6km)
      const km = (value * 1.60934).toFixed(1);
      return `${km} km (${formattedValue})`;
    }
    return value === 1 ? '1 mile' : `${value} miles`;
  }

  return `${value} ${unit}`;
}

/**
 * Formata durações.
 */
export function formatDuration(value: number | null, unit: string | null, locale: string): string {
  if (value === null || value === undefined) {
    return unit || '';
  }

  const isPt = locale === 'pt';

  const unitsMap: Record<string, { en: string; pt: string; pluralEn: string; pluralPt: string }> = {
    minute: { en: 'minute', pt: 'minuto', pluralEn: 'minutes', pluralPt: 'minutos' },
    hour: { en: 'hour', pt: 'hora', pluralEn: 'hours', pluralPt: 'horas' },
    day: { en: 'day', pt: 'dia', pluralEn: 'days', pluralPt: 'dias' },
    round: { en: 'round', pt: 'rodada', pluralEn: 'rounds', pluralPt: 'rodadas' },
  };

  const unitData = unitsMap[unit || ''];
  if (!unitData) return `${value} ${unit}`;

  if (isPt) {
    const label = value === 1 ? unitData.pt : unitData.pluralPt;
    return `${value} ${label}`;
  }

  const label = value === 1 ? unitData.en : unitData.pluralEn;
  return `${value} ${label}`;
}
