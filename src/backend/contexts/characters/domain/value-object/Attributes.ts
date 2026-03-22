import { CharacterError, CharacterErrorCodes } from '../CharacterError';

export class Attributes {
  private values: Map<string, number>;

  constructor(initialValues: Record<string, number> = {}) {
    this.values = new Map(Object.entries(initialValues));
  }

  get(key: string): number {
    return this.values.get(key) ?? 10;
  }

  set(key: string, value: number): void {
    if (value < 1) throw new CharacterError(CharacterErrorCodes.DOMAIN_ATTRIBUTE_BELOW_ONE);
    this.values.set(key, value);
  }

  getAll(): Record<string, number> {
    return Object.fromEntries(this.values);
  }
}
