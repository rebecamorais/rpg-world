'use client';

import { useTranslations } from 'next-intl';

import { ImageViewerDialog } from '@frontend/components/shared/ImageViewerDialog';
import { LazyImageCropDialog } from '@frontend/components/shared/LazyImageCropDialog';
import { useCharacterActions } from '@frontend/context/CharacterContext';
import { useFileUploader } from '@frontend/context/FileUploaderContext';
import { useImageCrop } from '@frontend/hooks/useImageCrop';

/**
 * The image viewer for whoever can edit the sheet. The adjusted image goes to the sheet's draft,
 * like a new upload: only Save keeps it, and discarding the draft brings the previous one back.
 * Rendered inside the positioned box of the portrait, which it covers while the image updates.
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
  const t = useTranslations('avatarUpload');
  const { upload } = useFileUploader();
  const { update } = useCharacterActions();
  const crop = useImageCrop({
    upload: (file) => upload({ file, target: 'character', id: characterId }),
    onUploaded: (url) => update({ avatarUrl: url }),
  });

  return (
    <>
      {crop.preview && (
        // eslint-disable-next-line @next/next/no-img-element -- a local blob preview
        <img
          src={crop.preview}
          alt=""
          className="absolute inset-0 h-full w-full rounded-full object-cover"
        />
      )}
      {(crop.isLoadingSource || crop.preview) && (
        <div
          role="status"
          className="bg-overlay text-foreground absolute inset-0 flex items-center justify-center rounded-full text-center text-xs font-medium"
        >
          {t('adjusting')}
        </div>
      )}
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
