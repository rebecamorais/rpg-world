'use client';

import { useTranslations } from 'next-intl';

import { Dialog, DialogContent, DialogTitle } from '@frontend/components/ui/dialog';

interface ImageViewerDialogProps {
  src: string | undefined;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Shows an image as large as the screen allows. */
export function ImageViewerDialog({ src, alt, open, onOpenChange }: ImageViewerDialogProps) {
  const t = useTranslations('avatarUpload');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(90vw,90vh)] border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{t('viewTitle')}</DialogTitle>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by our image proxy as is
          <img src={src} alt={alt} className="max-h-[90vh] w-full rounded-lg object-contain" />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
