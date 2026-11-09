'use client';

import { type ReactNode, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ImageViewerDialog } from '@frontend/components/shared/ImageViewerDialog';
import { cn } from '@frontend/lib/utils';

/**
 * A character's picture that opens it in the viewer when clicked, like the sheet's header. The
 * picture is `children`; without an image it's only the picture. Size and position come from `className`.
 */
export function ZoomablePortrait({
  src,
  name,
  className,
  children,
}: {
  src?: string | null;
  name: string;
  className?: string;
  children: ReactNode;
}) {
  const t = useTranslations('avatarUpload');
  const [isOpen, setIsOpen] = useState(false);

  if (!src) return <div className={cn('relative shrink-0', className)}>{children}</div>;

  return (
    // The button sits over the picture instead of wrapping it, so its name is only the label
    <div
      className={cn(
        'relative shrink-0 rounded-lg transition-transform has-[button:active]:scale-95 has-[button:hover]:scale-105',
        className,
      )}
    >
      {children}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t('viewOf', { name })}
        className="focus-ring absolute inset-0 cursor-zoom-in rounded-lg pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
      />
      <ImageViewerDialog src={src} alt={name} open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
