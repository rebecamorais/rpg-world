/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio).
 * RPG World Asset URL Helper.
 *
 * Generates the correct proxy URL for assets stored in Supabase Storage,
 * routing through images.rpgworldapp.com in production and falling back
 * to localhost in development.
 */

function assetBaseUrl(): string {
  // Explicit override, e.g. a production build served locally (the e2e suite)
  if (process.env.ASSET_BASE_URL) return process.env.ASSET_BASE_URL.replace(/\/+$/, '');

  if (process.env.NODE_ENV === 'development') {
    const devHost = process.env.NEXT_PUBLIC_DEV_IMAGES_HOST || 'localhost:3000';
    return `http://${devHost}/api/images`;
  }

  return 'https://images.rpgworldapp.com';
}

export function formatAssetUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${assetBaseUrl()}/${cleanPath}`;
}
