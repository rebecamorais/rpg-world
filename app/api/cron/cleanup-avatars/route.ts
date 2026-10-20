import { NextResponse } from 'next/server';

import { timingSafeEqual } from 'node:crypto';
import 'server-only';

import { CleanupOrphanAvatarsUseCase } from '@backend/shared/application/cleanup-orphan-avatars.use-case';
import { SupabaseOrphanAvatarFinder } from '@backend/shared/infrastructure/repositories/supabase-orphan-avatar-finder';
import { SupabaseStorageRepository } from '@backend/shared/infrastructure/repositories/supabase-storage-repository';

import { SupabaseFactory } from '@lib/supabase';

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the env var is set. */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Without a secret the job can't tell Vercel from anyone else: refuse
  if (!secret) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.get('authorization') ?? '');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Daily job (vercel.json): deletes avatar uploads no profile or character uses. */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = SupabaseFactory.createAdmin();
    const useCase = new CleanupOrphanAvatarsUseCase(
      new SupabaseOrphanAvatarFinder(admin),
      new SupabaseStorageRepository(admin),
    );
    return NextResponse.json(await useCase.execute());
  } catch (error) {
    console.error('Avatar cleanup failed:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
