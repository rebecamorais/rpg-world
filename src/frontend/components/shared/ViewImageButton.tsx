'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { ImageViewerDialog } from '@frontend/components/shared/ImageViewerDialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

/**
 * Opens a character's image in the viewer; nothing without an image. It sits above a card's
 * stretched link (z-10) and must be its sibling, never inside it. Position comes from `className`.
 */
export function ViewImageButton({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const t = useTranslations('avatarUpload');
  const [isOpen, setIsOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t('viewOf', { name })}
        className={cn(
          'focus-ring bg-background border-border hover:text-character-flare relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors',
          className,
        )}
      >
        <AppIcon name="Maximize2" size={14} aria-hidden="true" />
      </button>
      <ImageViewerDialog src={src} alt={name} open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
