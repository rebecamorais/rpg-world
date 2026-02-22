export class Attributes {
  private values: Map<string, number>;

  constructor(initialValues: Record<string, number> = {}) {
    this.values = new Map(Object.entries(initialValues));
  }

  get(key: string): number {
    return this.values.get(key) ?? 10;
  }

  set(key: string, value: number): void {
    if (value < 1) throw new Error('Atributo não pode ser menor que 1');
    this.values.set(key, value);
  }

  getAll(): Record<string, number> {
    return Object.fromEntries(this.values);
  }
}
