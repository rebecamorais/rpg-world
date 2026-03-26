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

  try {
    const adminClient = SupabaseFactory.createAdmin();
    const { data, error } = await adminClient.storage.from(bucket).download(filePath);

    if (error || !data) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': data.type || 'application/octet-stream',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
