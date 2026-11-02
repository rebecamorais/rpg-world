import { useFormatter, useTranslations } from 'next-intl';

import { formatPrice } from './format-price';

/** Prices ("1.500 PO") and weights ("65 lb") of items, in the screen's language. */
export function useItemFormat() {
  const format = useFormatter();
  const tCoins = useTranslations('characters.coins');
  const t = useTranslations('characters.inventory');

  return {
    price: (copper: number) => {
      const { amount, coin } = formatPrice(copper);
      return `${format.number(amount, { maximumFractionDigits: 2 })} ${tCoins(`${coin}.short`)}`;
    },
    weight: (pounds: number) =>
      t('weight', { weight: format.number(pounds, { maximumFractionDigits: 1 }) }),
  };
}
