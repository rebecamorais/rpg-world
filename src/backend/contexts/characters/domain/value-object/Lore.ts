export class Lore {
  constructor(
    public readonly age?: string,
    public readonly height?: string,
    public readonly weight?: string,
    public readonly eyes?: string,
    public readonly skin?: string,
    public readonly hair?: string,
    public readonly backstory?: string,
    public readonly personalityTraits?: string,
    public readonly ideals?: string,
    public readonly bonds?: string,
    public readonly flaws?: string,
    public readonly alliesAndEnemies?: string,
    public readonly organizations?: string,
    public readonly treasure?: string,
  ) {}

  public static empty(): Lore {
    return new Lore();
  }

  public toJSON(): Record<string, string | undefined> {
    return {
      age: this.age,
      height: this.height,
      weight: this.weight,
      eyes: this.eyes,
      skin: this.skin,
      hair: this.hair,
      backstory: this.backstory,
      personalityTraits: this.personalityTraits,
      ideals: this.ideals,
      bonds: this.bonds,
      flaws: this.flaws,
      alliesAndEnemies: this.alliesAndEnemies,
      organizations: this.organizations,
      treasure: this.treasure,
    };
  }

  public static fromJSON(json: Record<string, unknown>): Lore {
    return new Lore(
      json.age as string | undefined,
      json.height as string | undefined,
      json.weight as string | undefined,
      json.eyes as string | undefined,
      json.skin as string | undefined,
      json.hair as string | undefined,
      json.backstory as string | undefined,
      json.personalityTraits as string | undefined,
      json.ideals as string | undefined,
      json.bonds as string | undefined,
      json.flaws as string | undefined,
      json.alliesAndEnemies as string | undefined,
      json.organizations as string | undefined,
      json.treasure as string | undefined,
    );
  }
}
