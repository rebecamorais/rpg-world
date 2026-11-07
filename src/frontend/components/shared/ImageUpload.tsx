'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ImageViewerDialog } from '@frontend/components/shared/ImageViewerDialog';
import { LazyImageCropDialog } from '@frontend/components/shared/LazyImageCropDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { Button } from '@frontend/components/ui/button';
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
}: ImageUploadProps) {
  const t = useTranslations('avatarUpload');
  const { upload: contextUpload, isUploading: isUploadingContext } = useFileUploader();
  const inputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Image display / Trigger */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label={t('button')}
        className={cn(
          'group relative transition-transform hover:scale-105 active:scale-95 disabled:opacity-60',
        )}
      >
        <Avatar
          className={cn(
            'border-border bg-muted group-hover:border-primary-flare border-2 shadow-md transition-colors',
            sizeClasses[size],
          )}
        >
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt={t('currentAlt')} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-muted text-2xl font-bold">🧙</AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div className="bg-overlay absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <span className="text-foreground text-xs font-medium">{t('loading')}</span>
          ) : (
            <span className="text-foreground text-xs font-medium">{t('button')}</span>
          )}
        </div>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        id="image-file-input"
      />

      {currentUrl ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsViewerOpen(true)}>
          {t('view')}
        </Button>
      ) : null}

      <LazyImageCropDialog
        source={crop.cropSource}
        onCancel={crop.cancel}
        onConfirm={crop.confirm}
      />
      <ImageViewerDialog
        src={currentUrl}
        alt={t('currentAlt')}
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        onAdjust={currentUrl ? () => crop.adjust(currentUrl) : undefined}
      />
    </div>
  );
}
