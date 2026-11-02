import type { ItemsContext } from '../index';

export const makeItemsApi = (itemsContext: ItemsContext) => ({
  list: (locale?: string) => itemsContext.list(locale),
});
