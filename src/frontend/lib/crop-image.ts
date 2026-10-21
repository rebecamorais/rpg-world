export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropImageOptions {
  /** Largest side of the result, in pixels. */
  maxSide?: number;
  /** Target size; quality and then dimensions go down until the result fits. */
  maxBytes?: number;
}

type Encoder = (canvas: HTMLCanvasElement, type: string, quality: number) => Promise<Blob | null>;

// Big enough for a full-screen view, small enough to stay far below the server's 5 MB ceiling
const DEFAULT_MAX_SIDE = 1024;
const DEFAULT_MAX_BYTES = 800 * 1024;
const QUALITIES = [0.85, 0.75, 0.6];
const MAX_SHRINKS = 3;

export class ImageDecodeError extends Error {
  constructor() {
    super('image_error_decode');
    this.name = 'ImageDecodeError';
  }
}

/** Scales `width × height` down (never up) so the largest side is at most `maxSide`. */
export function fitWithin(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Centered square: what is saved if the cropper never reported an area. */
export function centeredSquare(width: number, height: number): CropArea {
  const side = Math.min(width, height);
  return { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side };
}

const encodeWithCanvas: Encoder = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Re-encodes `draw` output until it fits `maxBytes`: lower quality first, then 25% smaller.
 * WebP when the browser can make it (some Safari versions return PNG instead), JPEG otherwise.
 */
export async function encodeWithinLimit(
  draw: (width: number, height: number) => HTMLCanvasElement,
  size: { width: number; height: number },
  maxBytes: number,
  encode: Encoder = encodeWithCanvas,
): Promise<Blob> {
  let { width, height } = size;
  let smallest: Blob | null = null;

  for (let shrink = 0; shrink <= MAX_SHRINKS; shrink++) {
    const canvas = draw(width, height);
    for (const quality of QUALITIES) {
      let blob = await encode(canvas, 'image/webp', quality);
      if (blob?.type !== 'image/webp') blob = await encode(canvas, 'image/jpeg', quality);
      if (!blob) throw new ImageDecodeError();
      if (blob.size <= maxBytes) return blob;
      if (!smallest || blob.size < smallest.size) smallest = blob;
    }
    width = Math.round(width * 0.75);
    height = Math.round(height * 0.75);
  }

  return smallest!;
}

async function loadImage(file: Blob): Promise<ImageBitmap> {
  try {
    // Applies the EXIF orientation, so phone photos don't come out sideways
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageDecodeError();
  }
}

/**
 * Crops `file` to `area` (in the original image's pixels), resizes and compresses it.
 * Drawing on a canvas also drops the EXIF data, GPS location included.
 */
export async function cropImage(
  file: Blob,
  area: CropArea | null,
  { maxSide = DEFAULT_MAX_SIDE, maxBytes = DEFAULT_MAX_BYTES }: CropImageOptions = {},
): Promise<File> {
  const image = await loadImage(file);
  const crop = area ?? centeredSquare(image.width, image.height);

  const draw = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new ImageDecodeError();
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    return canvas;
  };

  try {
    const blob = await encodeWithinLimit(
      draw,
      fitWithin(crop.width, crop.height, maxSide),
      maxBytes,
    );
    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `image.${extension}`, { type: blob.type });
  } finally {
    image.close();
  }
}
