import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { CropArea, cropImage, fullImage } from '@frontend/lib/crop-image';
import { loadStoredImage } from '@frontend/lib/stored-image';

import { fullImageUrl } from '@shared/avatar-files';

interface UseImageCropOptions {
  upload: (file: File, full?: File) => Promise<{ url: string }>;
  onUploaded: (url: string) => void;
  onUploadError?: (err: unknown) => void;
  /** Also sends the whole image, for the viewer and to crop again later. */
  keepFull?: boolean;
}

/** Where the whole image sent with a crop comes from, if any. */
type FullSource = 'generate' | 'reuse' | 'none';

/** The whole image to send. Both files must share a format: re-encoded only if they don't. */
async function fullVersion(original: Blob, source: FullSource, cropType: string) {
  if (source === 'none') return undefined;
  if (source === 'generate' || original.type !== cropType) return fullImage(original);
  return new File([original], 'full', { type: original.type });
}

/**
 * From an image to its cropped upload: a file just picked, or (`adjust`) the image already saved.
 * Show `cropSource` in the crop dialog. A failure at any point leaves the current image as it is.
 */
export function useImageCrop({
  upload,
  onUploaded,
  onUploadError,
  keepFull = false,
}: UseImageCropOptions) {
  const t = useTranslations('avatarUpload');
  const { getErrorMessage } = useErrorMessage();
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<{ file: Blob; source: string; full: FullSource } | null>(
    null,
  );
  const [isLoadingSource, setIsLoadingSource] = useState(false);

  // A ref: two clicks in the same render would both still see the state as false
  const isLoading = useRef(false);

  const open = (file: Blob, full: FullSource) =>
    setPending({ file, source: URL.createObjectURL(file), full });

  /**
   * The whole image when there is one, never the avatar in its place: saving a crop without it
   * would delete the whole image for good, and a read can fail for a moment.
   */
  const loadForAdjust = async (url: string) => {
    const fullUrl = keepFull ? fullImageUrl(url) : null;
    if (fullUrl) open(await loadStoredImage(fullUrl), 'reuse');
    else open(await loadStoredImage(url), 'none');
  };

  const adjust = async (url: string) => {
    if (isLoading.current) return;
    isLoading.current = true;
    setIsLoadingSource(true);
    try {
      await loadForAdjust(url);
    } catch {
      toast.error(t('adjustLoadError'));
    } finally {
      isLoading.current = false;
      setIsLoadingSource(false);
    }
  };

  const cancel = () => {
    if (pending) URL.revokeObjectURL(pending.source);
    setPending(null);
  };

  const confirm = async (area: CropArea | null) => {
    if (!pending) return;
    const { file: original, full: fullSource } = pending;
    cancel();

    let file: File;
    let full: File | undefined;
    try {
      file = await cropImage(original, area);
      full = await fullVersion(original, fullSource, file.type);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
      onUploadError?.(err);
      return;
    }

    // Local preview (blob URL)
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const { url } = await upload(file, full);
      onUploaded(url);
    } catch (err: unknown) {
      onUploadError?.(err);
    } finally {
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    }
  };

  return {
    preview,
    cropSource: pending?.source ?? null,
    isLoadingSource,
    pickFile: (file: File) => open(file, keepFull ? 'generate' : 'none'),
    adjust,
    cancel,
    confirm,
  };
}
