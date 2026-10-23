/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio).
 * RPG World — Image Proxy Route Handler.
 *
 * Proxies asset requests from images.rpgworldapp.com to Supabase Storage,
 * masking the real storage URLs and enabling aggressive caching.
 *
 * URL pattern: /api/images/{bucket}/{...filePath}
 * Example:     /api/images/avatars/userId/avatar → downloads from bucket "avatars", path "userId/avatar"
 */
import { NextRequest, NextResponse } from 'next/server';

import 'server-only';

import { SupabaseFactory } from '@lib/supabase';

// One day, in the browser and on the CDN. Upload URLs are versioned, so a new image never waits
// for this; it only bounds how long a replaced (and deleted) avatar can still be served.
const CACHE_MAX_AGE = 86_400;

// Only buckets meant to be public may be served. The public object endpoint enforces the same (it
// only serves buckets marked public), so a missing entry here can't expose a private bucket.
const PUBLIC_BUCKETS = new Set(['avatars']);

// The image types the upload use cases accept. The stored Content-Type is chosen by whoever
// uploaded the file, so anything else (e.g. an SVG or HTML file sent straight to Storage) is
// served as a download instead of being rendered on this origin.
const INLINE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Stored paths are made of user/character ids and versioned file names (e.g.
// `<uuid>/characters/<uuid>-<version>.png`). Next decodes each segment, so `..%2F` or `%3F` would
// otherwise turn into `../` or `?` and point the storage request somewhere else on the host.
const SAFE_SEGMENT = /^[\w-][\w.-]*$/;

function isSafeSegment(segment: string) {
  return SAFE_SEGMENT.test(segment) && !segment.includes('..');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  if (path.length < 2) {
    return NextResponse.json(
      { error: 'Invalid path: must include bucket and file path' },
      { status: 400 },
    );
  }

  const [bucket, ...fileParts] = path;
  const filePath = fileParts.join('/');

  if (!PUBLIC_BUCKETS.has(bucket) || !fileParts.every(isSafeSegment)) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  try {
    // Read through the public object endpoint, which serves public buckets without the storage RLS.
    // The bucket deliberately has no public SELECT policy: that policy also authorizes listing, and
    // would let anyone enumerate every file (and with it every user and character id).
    const anonClient = SupabaseFactory.createAnon();
    const { publicUrl } = anonClient.storage.from(bucket).getPublicUrl(filePath).data;
    const response = await fetch(publicUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const contentType = response.headers.get('content-type') ?? '';
    const mimeType = contentType.split(';')[0].trim().toLowerCase();
    const inline = INLINE_CONTENT_TYPES.has(mimeType);

    // Streamed through: the function doesn't hold the whole file before answering
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': inline ? mimeType : 'application/octet-stream',
        ...(inline ? {} : { 'Content-Disposition': 'attachment' }),
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
