import { describe, expect, it } from 'vitest';

import { formatDistance, formatDuration } from './units';

describe('formatDistance', () => {
  it('converte pés em metros no português (5 ft = 1,5 m)', () => {
    expect(formatDistance(30, 'feet', 'pt')).toBe('9m (30 ft)');
    expect(formatDistance(10, 'foot', 'pt')).toBe('3m (10 ft)');
  });

  it('arredonda metros fracionados para uma casa', () => {
    expect(formatDistance(7, 'feet', 'pt')).toBe('2.1m (7 ft)');
  });

  it('mantém pés no inglês', () => {
    expect(formatDistance(30, 'feet', 'en')).toBe('30 ft');
  });

  it('converte milhas em km no português, no singular e no plural', () => {
    expect(formatDistance(1, 'mile', 'pt')).toBe('1.6 km (1 milha)');
    expect(formatDistance(2, 'miles', 'pt')).toBe('3.2 km (2 milhas)');
  });

  it('flexiona milhas no inglês', () => {
    expect(formatDistance(1, 'mile', 'en')).toBe('1 mile');
    expect(formatDistance(500, 'miles', 'en')).toBe('500 miles');
  });

  it('devolve só a unidade quando não há valor (ex.: self, touch)', () => {
    expect(formatDistance(null, 'self', 'pt')).toBe('self');
    expect(formatDistance(null, null, 'en')).toBe('');
  });

  it('repete valor e unidade desconhecida como vieram', () => {
    expect(formatDistance(5, 'yards', 'pt')).toBe('5 yards');
  });
});

describe('formatDuration', () => {
  it('traduz e flexiona a unidade no português', () => {
    expect(formatDuration(1, 'minute', 'pt')).toBe('1 minuto');
    expect(formatDuration(10, 'round', 'pt')).toBe('10 rodadas');
  });

  it('flexiona a unidade no inglês', () => {
    expect(formatDuration(1, 'hour', 'en')).toBe('1 hour');
    expect(formatDuration(8, 'hour', 'en')).toBe('8 hours');
  });

  it('devolve só a unidade quando não há valor (ex.: instantaneous)', () => {
    expect(formatDuration(null, 'instantaneous', 'pt')).toBe('instantaneous');
    expect(formatDuration(null, null, 'pt')).toBe('');
  });

  it('repete valor e unidade desconhecida como vieram', () => {
    expect(formatDuration(1, 'year', 'pt')).toBe('1 year');
  });
});
