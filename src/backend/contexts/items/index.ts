import type { ItemCatalog } from './domain/item.repo';
import { getItemCatalog } from './infrastructure/srd-items';

export { getItemCatalog };

export class ItemsContext {
  constructor(readonly catalog: ItemCatalog) {}

  list(locale?: string) {
    return this.catalog.list(locale);
  }
}

export function createItemsContext() {
  return new ItemsContext(getItemCatalog());
}
