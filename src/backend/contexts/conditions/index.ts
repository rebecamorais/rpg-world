import type { ConditionCatalog } from './domain/condition';
import { getConditionCatalog } from './infrastructure/srd-conditions';

export { getConditionCatalog };

export class ConditionsContext {
  constructor(readonly catalog: ConditionCatalog) {}

  list(locale?: string) {
    return this.catalog.list(locale);
  }
}

export function createConditionsContext() {
  return new ConditionsContext(getConditionCatalog());
}
