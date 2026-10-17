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

const CACHE_MAX_AGE = 31_536_000; // 1 year in seconds

// Only buckets meant to be public may be served. The anonymous client enforces the same at the
// storage RLS level, so a missing entry here can't expose a private bucket.
const PUBLIC_BUCKETS = new Set(['avatars']);

// The image types the upload use cases accept. The stored Content-Type is chosen by whoever
// uploaded the file, so anything else (e.g. an SVG or HTML file sent straight to Storage) is
// served as a download instead of being rendered on this origin.
const INLINE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

  if (!PUBLIC_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  try {
    const anonClient = SupabaseFactory.createAnon();
    const { data, error } = await anonClient.storage.from(bucket).download(filePath);

    if (error || !data) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();
    const mimeType = data.type.split(';')[0].trim().toLowerCase();
    const inline = INLINE_CONTENT_TYPES.has(mimeType);

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': inline ? mimeType : 'application/octet-stream',
        ...(inline ? {} : { 'Content-Disposition': 'attachment' }),
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
