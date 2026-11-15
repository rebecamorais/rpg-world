import { Lore } from '@backend/contexts/lore/domain/Lore';

import { Attributes } from '../value-object/Attributes';
import { HealthPoints } from '../value-object/HealthPoints';

/** A playable character (pc) or one of the GM's enemy sheets (npc). */
export type CharacterKind = 'pc' | 'npc';

export abstract class Character {
  public readonly id: string;
  public name: string;
  public readonly system: string;
  public ownerUsername: string;
  public attributes: Attributes;
  public hp: HealthPoints;
  public level: number;
  public lore: Lore;
  public avatarUrl?: string;
  /**
   * Goes up when a write changes the sheet's draft fields (not game state such as HP or spent
   * slots); a draft save sent with an older one is a conflict.
   */
  public revision = 0;
  /** Goes up with every write; the compare-and-set token of a full-row save. Not sent out. */
  public rowVersion = 0;

  constructor(
    id: string,
    name: string,
    system: string,
    ownerUsername: string,
    attributes: Attributes,
    hp: HealthPoints,
    level: number = 1,
    lore: Lore = Lore.empty(),
    public accentColor?: string,
    avatarUrl?: string,
    public kind: CharacterKind = 'pc',
    public sheetBackgroundUrl?: string,
  ) {
    this.id = id;
    this.name = name;
    this.system = system;
    this.ownerUsername = ownerUsername;
    this.attributes = attributes;
    this.hp = hp;
    this.level = Math.max(1, level);
    this.lore = lore;
    this.accentColor = accentColor;
    this.avatarUrl = avatarUrl;
  }

  isOwnedBy(userId: string): boolean {
    return Boolean(userId) && this.ownerUsername === userId;
  }

  abstract toJSON(): Record<string, unknown>;
}
