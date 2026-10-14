/**
 * Version segment for an uploaded asset's path. The image proxy serves assets as immutable
 * (cached for a year), so a replaced image must get a new URL instead of overwriting the old one.
 */
export type AssetVersionGenerator = () => string;

export const newAssetVersion: AssetVersionGenerator = () =>
  `${Date.now().toString(36)}${crypto.randomUUID().slice(0, 8)}`;
