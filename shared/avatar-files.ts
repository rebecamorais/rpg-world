/**
 * A character's image is two files: `<name>.<ext>`, the whole image, and `<name>-avatar.<ext>`, the
 * crop. The saved URL is the crop's, so a URL without the suffix is from before the whole image was
 * kept, and has none.
 */
const AVATAR_SUFFIX = /-avatar(\.\w+)$/;
const CHARACTERS_FOLDER = '/characters/';

export function fullImageUrl(avatarUrl: string): string | null {
  if (!avatarUrl.includes(CHARACTERS_FOLDER) || !AVATAR_SUFFIX.test(avatarUrl)) return null;
  return avatarUrl.replace(AVATAR_SUFFIX, '$1');
}

export function avatarPathOf(fullPath: string): string {
  return fullPath.replace(/(\.\w+)$/, '-avatar$1');
}

/** Whether a stored file may be a whole image: nothing in the database names those. */
export function isFullImageCandidate(path: string): boolean {
  return path.includes(CHARACTERS_FOLDER) && !AVATAR_SUFFIX.test(path);
}
