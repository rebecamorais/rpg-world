import { useFormatter, useLocale, useTranslations } from 'next-intl';

import { formatPrice } from './format-price';

/**
 * Prices ("1.500 PO") and weights of items, in the screen's language. Weights come in pounds; in
 * Portuguese they show in kilograms, as the pt-BR books do (1 lb = 0,5 kg): "65 lb", "32,5 kg".
 */
export function useItemFormat() {
  const format = useFormatter();
  const metric = useLocale() === 'pt';
  const tCoins = useTranslations('characters.coins');
  const t = useTranslations('characters.inventory');

  return {
    price: (copper: number) => {
      const { amount, coin } = formatPrice(copper);
      return `${format.number(amount, { maximumFractionDigits: 2 })} ${tCoins(`${coin}.short`)}`;
    },
    weight: (pounds: number) =>
      t('weight', {
        weight: metric
          ? format.number(pounds / 2, { maximumFractionDigits: 2 })
          : format.number(pounds, { maximumFractionDigits: 1 }),
      }),
  };
}
