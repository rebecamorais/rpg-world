import { describe, expect, it } from 'vitest';

import { Attributes } from '../value-object/Attributes';
import { HealthPoints } from '../value-object/HealthPoints';
import { DnD5eCharacter } from './DnD5eCharacter';

describe('DnD5eCharacter (Domain Entity)', () => {
  const buildCharacter = (attrs: Record<string, number> = {}) => {
    return new DnD5eCharacter({
      id: 'id-123',
      name: 'Thor',
      ownerUsername: 'user1',
      attributes: new Attributes(attrs),
      hp: new HealthPoints(10, 10),
      level: 1,
      classStr: 'Fighter',
      race: 'Human',
      ac: 10,
      speed: 30,
      initiative: 0,
    });
  };

  it('deve exportar corretamente via toJSON (Data Transfer Object)', () => {
    const char = buildCharacter({ STR: 18 });

    const json = char.toJSON();

    expect(json.id).toBeDefined();
    expect(json.name).toBe('Thor');
    expect(json.system).toBe('DnD_5e');

    // Atributos foram convertidos para object standard?
    expect((json.attributes as unknown as { STR: number }).STR).toBe(18);
  });
});
