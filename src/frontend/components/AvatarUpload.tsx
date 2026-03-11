'use client';

import { useRef, useState } from 'react';

import { useProfile } from '@frontend/hooks/useProfile';
import { useTranslations } from 'next-intl';

interface AvatarUploadProps {
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (err: unknown) => void;
}

export default function AvatarUpload({
  currentUrl,
  onUploadSuccess,
  onUploadError,
}: AvatarUploadProps) {
  const t = useTranslations('avatarUpload');
  const { uploadAvatar, isUploadingAvatar } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview ?? currentUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const { url } = await uploadAvatar(file);
      onUploadSuccess(url);
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
        disabled={isUploadingAvatar}
        aria-label={t('button')}
        className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/10 bg-white/5 transition-all hover:border-blue-500/50 disabled:opacity-60"
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={t('currentAlt')}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-4xl">
            🧙
          </span>
        )}

        {/* Upload overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploadingAvatar ? (
            <span className="text-xs font-medium text-white">
              {t('loading')}
            </span>
          ) : (
            <span className="text-xs font-medium text-white">
              {t('button')}
            </span>
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
