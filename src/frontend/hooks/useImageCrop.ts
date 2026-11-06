import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { CropArea, cropImage } from '@frontend/lib/crop-image';
import { loadStoredImage } from '@frontend/lib/stored-image';

interface UseImageCropOptions {
  upload: (file: File) => Promise<{ url: string }>;
  onUploaded: (url: string) => void;
  onUploadError?: (err: unknown) => void;
}

/**
 * From an image to its cropped upload: a file just picked, or (`adjust`) the image already saved.
 * Show `cropSource` in the crop dialog. A failure at any point leaves the current image as it is.
 */
export function useImageCrop({ upload, onUploaded, onUploadError }: UseImageCropOptions) {
  const t = useTranslations('avatarUpload');
  const { getErrorMessage } = useErrorMessage();
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<{ file: Blob; source: string } | null>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);

  const open = (file: Blob) => setPending({ file, source: URL.createObjectURL(file) });

  const adjust = async (url: string) => {
    setIsLoadingSource(true);
    try {
      open(await loadStoredImage(url));
    } catch {
      toast.error(t('adjustLoadError'));
    } finally {
      setIsLoadingSource(false);
    }
  };

  const cancel = () => {
    if (pending) URL.revokeObjectURL(pending.source);
    setPending(null);
  };

  const confirm = async (area: CropArea | null) => {
    if (!pending) return;
    const original = pending.file;
    cancel();

    let file: File;
    try {
      file = await cropImage(original, area);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
      onUploadError?.(err);
      return;
    }

    // Local preview (blob URL)
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const { url } = await upload(file);
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
    pickFile: open,
    adjust,
    cancel,
    confirm,
  };
}
