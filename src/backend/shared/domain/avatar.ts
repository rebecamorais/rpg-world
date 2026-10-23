// Shared by profile and character avatars; the avatars bucket enforces the same limits
// (database/migrations/20261017000000_restrict_avatars_bucket.sql), so keep them in sync. The
// image route (app/api/images/[...path]/route.ts) and ImageUpload's `accept` repeat the types.
export const AVATAR_BUCKET = 'avatars';
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
