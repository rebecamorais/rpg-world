// Shared by profile and character avatars; the avatars bucket enforces the same limits
// (database/migrations/20261017000000_restrict_avatars_bucket.sql), so keep them in sync. The
// image route (app/api/images/[...path]/route.ts) and ImageUpload's `accept` repeat the types.
export const AVATAR_BUCKET = 'avatars';
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

/** How each allowed format starts. WebP is `RIFF`, four bytes of size, then `WEBP`. */
const SIGNATURES: readonly (readonly (number | null)[])[] = [
  [0xff, 0xd8, 0xff], // JPEG
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50], // WebP
];

/**
 * Whether the file's first bytes are those of a JPEG, PNG or WebP. The type the browser declares
 * comes from the file name, so a text file named `.png` passes that check and not this one.
 */
export async function hasImageSignature(file: Blob): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return SIGNATURES.some(
    (signature) =>
      head.length >= signature.length &&
      signature.every((byte, index) => byte === null || head[index] === byte),
  );
}
