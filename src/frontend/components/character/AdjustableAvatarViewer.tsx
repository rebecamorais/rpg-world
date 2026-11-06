'use client';

import { ImageViewerDialog } from '@frontend/components/shared/ImageViewerDialog';
import { LazyImageCropDialog } from '@frontend/components/shared/LazyImageCropDialog';
import { useCharacterActions } from '@frontend/context/CharacterContext';
import { useFileUploader } from '@frontend/context/FileUploaderContext';
import { useImageCrop } from '@frontend/hooks/useImageCrop';

/**
 * The image viewer for whoever can edit the sheet. The adjusted image goes to the sheet's draft,
 * like a new upload: only Save keeps it, and discarding the draft brings the previous one back.
 */
export function AdjustableAvatarViewer({
  characterId,
  src,
  alt,
  open,
  onOpenChange,
}: {
  characterId: string;
  src: string | undefined;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { upload } = useFileUploader();
  const { update } = useCharacterActions();
  const crop = useImageCrop({
    upload: (file) => upload({ file, target: 'character', id: characterId }),
    onUploaded: (url) => update({ avatarUrl: url }),
  });

  return (
    <>
      <ImageViewerDialog
        src={src}
        alt={alt}
        open={open}
        onOpenChange={onOpenChange}
        onAdjust={src ? () => crop.adjust(src) : undefined}
      />
      <LazyImageCropDialog
        source={crop.cropSource}
        onCancel={crop.cancel}
        onConfirm={crop.confirm}
      />
    </>
  );
}
