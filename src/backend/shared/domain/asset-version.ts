/**
 * Version segment for an uploaded asset's path. The image proxy lets browsers and the CDN cache
 * each URL for a day, so a replaced image must get a new URL instead of overwriting the old one.
 */
export type AssetVersionGenerator = () => string;

export const newAssetVersion: AssetVersionGenerator = () =>
  `${Date.now().toString(36)}${crypto.randomUUID().slice(0, 8)}`;
