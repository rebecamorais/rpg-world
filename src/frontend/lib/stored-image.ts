const IMAGE_ROUTE = '/api/images';

/**
 * Where to read a saved image from: the app's own route. In production the saved URLs point at the
 * images host, which the browser's connect-src doesn't allow; the host is never used here.
 */
export function storedImagePath(url: string): string {
  const { pathname } = new URL(url);
  const path = pathname.startsWith(`${IMAGE_ROUTE}/`)
    ? pathname.slice(IMAGE_ROUTE.length)
    : pathname;
  return `${IMAGE_ROUTE}${path}`;
}

/** The bytes of a saved image, to crop it again. Rejects when it can't be read as an image. */
export async function loadStoredImage(url: string): Promise<Blob> {
  const response = await fetch(storedImagePath(url));
  const isImage = response.headers.get('content-type')?.startsWith('image/');
  if (!response.ok || !isImage) throw new Error('stored_image_unavailable');
  return response.blob();
}
