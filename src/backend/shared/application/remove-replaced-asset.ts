import { StorageRepository } from '../domain/StorageRepository';

/**
 * Path inside `bucket` of an uploaded asset's URL, whatever host served it (the image proxy,
 * images.rpgworldapp.com or a Supabase public URL all end in `/<bucket>/<path>`).
 */
export function storagePathFromAssetUrl(url: string, bucket: string): string | null {
  let segments: string[];
  try {
    segments = new URL(url).pathname.split('/').map(decodeURIComponent);
  } catch {
    return null;
  }

  const start = segments.indexOf(bucket);
  if (start === -1) return null;

  const path = segments.slice(start + 1);
  if (path.length === 0 || path.some((segment) => !segment || segment.includes('..'))) return null;
  return path.join('/');
}

/** Whether `path` is a file directly inside `folder` whose name starts with `namePrefix`. */
export function isFileIn(path: string, folder: string, namePrefix: string): boolean {
  if (!path.startsWith(`${folder}/`)) return false;
  const name = path.slice(folder.length + 1);
  return name.startsWith(namePrefix) && !name.includes('/');
}

/**
 * Deletes the file an avatar URL pointed to once a new one (or none) is saved in its place.
 * Uploads are versioned and kept until the form is saved, so without this every replaced image
 * would stay in the bucket. `isRemovable` limits it to the files that kind of upload creates,
 * because the stored URL can be any URL the user typed. Best effort: a failure here must not fail
 * the save, it only leaves a file behind.
 */
export async function removeReplacedAsset(
  storage: StorageRepository,
  bucket: string,
  previousUrl: string | undefined,
  currentUrl: string | undefined,
  isRemovable: (path: string) => boolean,
): Promise<void> {
  if (!previousUrl || previousUrl === currentUrl) return;

  const path = storagePathFromAssetUrl(previousUrl, bucket);
  if (!path || !isRemovable(path)) return;

  try {
    await storage.remove(bucket, path);
  } catch (error) {
    console.warn(`Could not remove replaced asset ${bucket}/${path}:`, error);
  }
}
