import { Attributes } from '../value-object/Attributes';
import { HealthPoints } from '../value-object/HealthPoints';

export abstract class Character {
  public readonly id: string;
  public name: string;
  public readonly system: string;
  public ownerUsername: string;
  public attributes: Attributes;
  public hp: HealthPoints;
  public level: number;

  constructor(
    id: string,
    name: string,
    system: string,
    ownerUsername: string,
    attributes: Attributes,
    hp: HealthPoints,
    level: number = 1,
  ) {
    this.id = id;
    this.name = name;
    this.system = system;
    this.ownerUsername = ownerUsername;
    this.attributes = attributes;
    this.hp = hp;
    this.level = Math.max(1, level);
  }

  // Business rules all characters must implement
  abstract getCombatStats(): Record<string, unknown>;
  abstract toJSON(): Record<string, unknown>;
}
