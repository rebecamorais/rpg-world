'use client';

import { useRef, useState } from 'react';

import Image from 'next/image';

import { useTranslations } from 'next-intl';

import { useProfile } from '@frontend/hooks/useProfile';
import { cn } from '@frontend/lib/utils';

interface AvatarUploadProps {
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (err: unknown) => void;
  uploadFn: (file: File) => Promise<{ url: string }>;
  isUploading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarUpload({
  currentUrl,
  onUploadSuccess,
  onUploadError,
  uploadFn,
  isUploading = false,
  size = 'md',
}: AvatarUploadProps) {
  const t = useTranslations('avatarUpload');
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

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

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const { url } = await uploadFn(file);
      onUploadSuccess(url);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      // Revert preview on error
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
      onUploadError?.(err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar display */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label={t('button')}
        className={cn(
          'group relative overflow-hidden rounded-full border-2 border-white/10 bg-white/5 transition-all hover:border-blue-500/50 disabled:opacity-60',
          sizeClasses[size],
        )}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={t('currentAlt')}
            width={pixelSize[size]}
            height={pixelSize[size]}
            className="h-full w-full object-cover"
            unoptimized={displayUrl.includes('localhost') || displayUrl.includes('127.0.0.1')}
          />
        ) : (
          <span
            className={cn(
              'flex h-full w-full items-center justify-center',
              size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-4xl' : 'text-6xl',
            )}
          >
            🧙
          </span>
        )}

        {/* Upload overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
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
        id="avatar-file-input"
      />
    </div>
  );
}
