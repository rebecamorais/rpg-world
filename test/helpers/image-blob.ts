const HEADS: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff, 0xe0],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/webp': [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
};

/**
 * A blob of `size` bytes that starts like a real file of `type` (the server checks the first
 * bytes), zeros after that. Types without a known head are all zeros.
 */
export function imageBlob(type = 'image/png', size = 1024): Blob {
  const bytes = new Uint8Array(size);
  bytes.set((HEADS[type] ?? []).slice(0, size));
  return new Blob([bytes], { type });
}

/** Text declared as an image: what the server must refuse whatever the type says. */
export const textAsImage = (type = 'image/png') =>
  new Blob(['<script>alert(1)</script>'], { type });
