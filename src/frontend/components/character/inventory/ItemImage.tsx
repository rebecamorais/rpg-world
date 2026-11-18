import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

import type { ItemDto } from '@backend/contexts/items/domain/item.repo';

import { ITEM_ART } from './item-art';
import { gameIconOf } from './item-visuals';

interface ItemImageProps {
  item: Pick<ItemDto, 'id' | 'category'> | null;
  /** Uploaded image, wins over own art and the game icon. */
  imageUrl?: string | null;
  size?: number;
  className?: string;
  /** Own art by item id; injectable for tests. */
  art?: Readonly<Record<string, string>>;
}

/**
 * Item picture: uploaded image, else own art, else a game icon. Decorative (the item name sits in
 * the text beside it). It does not paint: the caller sets `text-item-flare` inside an `.item-context`.
 */
export function ItemImage({
  item,
  imageUrl,
  size = 24,
  className,
  art = ITEM_ART,
}: ItemImageProps) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL, decorative
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        className={cn('object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const artUrl = item ? art[item.id] : undefined;
  if (artUrl) {
    const mask = `url(${artUrl})`;
    return (
      <span
        aria-hidden="true"
        className={cn('inline-block shrink-0 bg-current', className)}
        style={{
          width: size,
          height: size,
          maskImage: mask,
          WebkitMaskImage: mask,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
    );
  }

  return <AppIcon variant="game" name={gameIconOf(item)} size={size} className={className} />;
}
