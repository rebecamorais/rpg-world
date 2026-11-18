'use client';

import { useId, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ImageViewerDialog } from '@frontend/components/shared/ImageViewerDialog';
import { LazyImageCropDialog } from '@frontend/components/shared/LazyImageCropDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Button } from '@frontend/components/ui/button';
import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import { UploadTarget, useFileUploader } from '@frontend/context/FileUploaderContext';
import { useImageCrop } from '@frontend/hooks/useImageCrop';
import { cn } from '@frontend/lib/utils';

interface ImageUploadProps {
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (err: unknown) => void;
  uploadFn?: (file: File) => Promise<{ url: string }>;
  isUploading?: boolean;
  target?: UploadTarget;
  targetId?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Also keeps the whole image, for the viewer and to crop again without a new upload. */
  keepFullImage?: boolean;
  /** Whose image it is (a character, a username): the image's text alternative. */
  name?: string;
  /** Offers "Remove" while there is an image; called once the person confirms. */
  onRemove?: () => Promise<void> | void;
}

/**
 * Generic ImageUpload component that handles file picking, cropping and uploading
 * to a specific target (profile, character, etc.) via FileUploaderContext.
 * The cropped image is resized and compressed in the browser, so large files (e.g. AI art)
 * still fit the server's limit.
 */
export default function ImageUpload({
  currentUrl,
  onUploadSuccess,
  onUploadError,
  uploadFn,
  isUploading: isUploadingProp,
  target,
  targetId,
  size = 'md',
  keepFullImage = false,
  name,
  onRemove,
}: ImageUploadProps) {
  const t = useTranslations('avatarUpload');
  const confirm = useConfirm();
  const alt = name ? t('imageOf', { name }) : t('currentAlt');
  const { upload: contextUpload, isUploading: isUploadingContext } = useFileUploader();
  const inputRef = useRef<HTMLInputElement>(null);
  // Unique per instance: a page can show more than one uploader
  const inputId = useId();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const crop = useImageCrop({
    keepFull: keepFullImage,
    upload: (file, full) =>
      uploadFn
        ? uploadFn(file)
        : target
          ? contextUpload({ file, full, target, id: targetId })
          : Promise.reject(new Error('No upload action provided to ImageUpload')),
    onUploaded: onUploadSuccess,
    onUploadError,
  });

  const isUploading = (isUploadingProp ?? isUploadingContext) || crop.isLoadingSource;

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const displayUrl = crop.preview ?? currentUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear the input so picking the same file again (e.g. retrying a failed upload) fires change
    e.target.value = '';
    if (file) crop.pickFile(file);
  };

  const remove =
    onRemove &&
    (async () => {
      const ok = await confirm({
        title: t('removeConfirmTitle'),
        description: t('removeConfirm'),
        confirmLabel: t('remove'),
        destructive: true,
      });
      if (ok) await onRemove();
    });

  const pick = () => inputRef.current?.click();

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Only shows the image: the buttons below say what each action does, also on touch */}
      <Avatar
        className={cn(
          'border-border bg-muted border-2 shadow-md transition-opacity',
          sizeClasses[size],
          isUploading && 'opacity-60',
        )}
      >
        {displayUrl ? <AvatarImage src={displayUrl} alt={alt} className="object-cover" /> : null}
        <AvatarFallback className="bg-muted text-2xl font-bold">🧙</AvatarFallback>
      </Avatar>

      <div className="flex flex-wrap justify-center gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={pick}
          disabled={isUploading}
          loading={isUploading}
        >
          {isUploading ? t('loading') : currentUrl ? t('button') : t('add')}
        </Button>
        {currentUrl ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsViewerOpen(true)}>
            {t('view')}
          </Button>
        ) : null}
        {currentUrl && remove ? (
          <Button
            type="button"
            variant="destructive-ghost"
            size="sm"
            onClick={remove}
            disabled={isUploading}
          >
            {t('remove')}
          </Button>
        ) : null}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        id={inputId}
        data-testid="image-upload-input"
      />

      <LazyImageCropDialog
        source={crop.cropSource}
        onCancel={crop.cancel}
        onConfirm={crop.confirm}
      />
      <ImageViewerDialog
        src={currentUrl}
        alt={alt}
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        onAdjust={currentUrl ? () => crop.adjust(currentUrl) : undefined}
      />
    </div>
  );
}
