/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio).
 * RPG World Asset URL Helper.
 *
 * Generates the correct proxy URL for assets stored in Supabase Storage,
 * routing through images.rpgworldapp.com in production and falling back
 * to localhost in development.
 */
import { storagePathFromAssetUrl } from '../../application/remove-replaced-asset';
import { siteUrl } from './site-url';

function assetBaseUrl(): string {
  // Explicit override, e.g. a production build served locally (the e2e suite)
  if (process.env.ASSET_BASE_URL) return process.env.ASSET_BASE_URL.replace(/\/+$/, '');

  if (process.env.NODE_ENV === 'development') {
    const devHost = process.env.NEXT_PUBLIC_DEV_IMAGES_HOST || 'localhost:3000';
    return `http://${devHost}/api/images`;
  }

  // images.rpgworldapp.com serves production storage; a preview proxies the staging bucket itself
  if (process.env.VERCEL_ENV === 'preview') return `${siteUrl()}/api/images`;

  return 'https://images.rpgworldapp.com';
}

export function formatAssetUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${assetBaseUrl()}/${cleanPath}`;
}

/** Whether `url` points at our own asset host (what an upload here returns), in this environment. */
export function isOwnAssetUrl(url: string): boolean {
  return url.startsWith(`${assetBaseUrl()}/`);
}

/**
 * Path inside `bucket` of a URL on our own asset host (`<base>/<bucket>/<path>`, what an upload
 * here returns), or null for any other URL, including another bucket on the same host.
 */
export function ownAssetPath(url: string, bucket: string): string | null {
  return storagePathFromAssetUrl(url, bucket, assetBaseUrl());
}
