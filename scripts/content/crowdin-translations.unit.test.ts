import { describe, expect, it } from 'vitest';

import { assertIdentifiers, identifierOf, leafPaths, withoutPaths } from './crowdin-translations';

const json = { fighter: { name: 'Guerreiro', features: { asi: { name: 'AVA' } } } };

describe('leafPaths', () => {
  it('lists leaf paths', () =>
    expect(leafPaths(json)).toEqual([
      ['fighter', 'name'],
      ['fighter', 'features', 'asi', 'name'],
    ]));
});

describe('withoutPaths', () => {
  it('drops skipped leaves and empty parents', () =>
    expect(withoutPaths(json, (p) => p.includes('features'))).toEqual({
      fighter: { name: 'Guerreiro' },
    }));

  it('keeps everything when nothing is skipped', () =>
    expect(withoutPaths(json, () => false)).toEqual(json));
});

describe('identifierOf', () => {
  it('joins the JSON path with dots', () =>
    expect(identifierOf(['fighter', 'features', 'second-wind', 'name'])).toBe(
      'fighter.features.second-wind.name',
    ));
});

describe('assertIdentifiers', () => {
  const en = { fighter: { name: 'Fighter', subclassTitle: 'Martial Archetype' } };

  it('accepts identifiers built from the English paths', () =>
    expect(() =>
      assertIdentifiers(['fighter.name', 'fighter.subclassTitle'], en, 'classes.json'),
    ).not.toThrow());

  it('refuses an unexpected identifier format', () =>
    expect(() =>
      assertIdentifiers(['fighter/name', 'fighter/subclassTitle'], en, 'classes.json'),
    ).toThrow(/classes\.json/));
});
