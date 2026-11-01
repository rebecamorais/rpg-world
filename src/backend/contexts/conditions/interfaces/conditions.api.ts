import type { ConditionsContext } from '../index';

export const makeConditionsApi = (conditionsContext: ConditionsContext) => ({
  list: (locale?: string) => conditionsContext.list(locale),
});
