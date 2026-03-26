'use client';

import { useRef, useState } from 'react';

import Image from 'next/image';

import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { UploadTarget, useFileUploader } from '@frontend/context/FileUploaderContext';
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
}

/**
 * Generic ImageUpload component that handles file picking and uploading
 * to a specific target (profile, character, etc.) via FileUploaderContext.
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
}: ImageUploadProps) {
  const t = useTranslations('avatarUpload');
  const { upload: contextUpload, isUploading: isUploadingContext } = useFileUploader();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const isUploading = isUploadingProp ?? isUploadingContext;

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const pixelSize = {
    sm: 64,
    md: 96,
    lg: 128,
  };

  const displayUrl = preview ?? currentUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview (blob URL)
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const uploadAction = uploadFn
        ? uploadFn(file)
        : target
          ? contextUpload({ file, target, id: targetId })
          : Promise.reject(new Error('No upload action provided to ImageUpload'));

      const { url } = await uploadAction;
      onUploadSuccess(url);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
      onUploadError?.(err);
    }
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
            'border-2 border-white/10 bg-white/5 shadow-md transition-colors group-hover:border-blue-500/50',
            sizeClasses[size],
          )}
        >
          {displayUrl ? (
            <AvatarImage
              src={displayUrl}
              alt={t('currentAlt')}
              className="object-cover"
              autoTimestamp={!preview} // Don't timestamp blob previews
            />
          ) : null}
          <AvatarFallback className="bg-muted text-2xl font-bold">🧙</AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <span className="text-xs font-medium text-white">{t('loading')}</span>
          ) : (
            <span className="text-xs font-medium text-white">{t('button')}</span>
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
    </div>
  );
}
