// Shared by profile and character avatars; the avatars bucket enforces the same limits
// (database/migrations/20261017000000_restrict_avatars_bucket.sql), so keep them in sync.
export const AVATAR_BUCKET = 'avatars';
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
