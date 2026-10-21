'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import Cropper, { type Area } from 'react-easy-crop';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { CropArea } from '@frontend/lib/crop-image';

interface ImageCropDialogProps {
  /** URL of the picked image; the dialog is open while it is set. */
  source: string | null;
  onCancel: () => void;
  /** `area` is in the original image's pixels; null if the cropper never measured it. */
  onConfirm: (area: CropArea | null) => void;
}

/** Square crop with drag and zoom, shown before the image is uploaded. */
export function ImageCropDialog({ source, onCancel, onConfirm }: ImageCropDialogProps) {
  return (
    <Dialog open={!!source} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        {/* Mounted per image, so zoom and position start over each time */}
        {source ? <CropBody source={source} onCancel={onCancel} onConfirm={onConfirm} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function CropBody({ source, onCancel, onConfirm }: ImageCropDialogProps & { source: string }) {
  const t = useTranslations('avatarUpload');
  const tCommon = useTranslations('common');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('cropTitle')}</DialogTitle>
        <DialogDescription>{t('cropDescription')}</DialogDescription>
      </DialogHeader>

      <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-md">
        <Cropper
          image={source}
          crop={crop}
          zoom={zoom}
          maxZoom={5}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>

      <label className="text-label flex items-center gap-3">
        {t('zoom')}
        <input
          type="range"
          min={1}
          max={5}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="accent-primary flex-1"
        />
      </label>

      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          {tCommon('cancel')}
        </Button>
        <Button onClick={() => onConfirm(area)}>{t('save')}</Button>
      </DialogFooter>
    </>
  );
}
