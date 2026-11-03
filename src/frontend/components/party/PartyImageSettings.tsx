'use client';

import { useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useFileUploader } from '@frontend/context/FileUploaderContext';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useParty } from '@frontend/hooks/useParty';
import { CropArea, cropImage } from '@frontend/lib/crop-image';
import { partyQueryKey } from '@frontend/lib/query-keys';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

// react-easy-crop is only needed once an image is picked: kept out of the page's first load
const ImageCropDialog = dynamic(
  () => import('@frontend/components/shared/ImageCropDialog').then((m) => m.ImageCropDialog),
  { ssr: false },
);

/** The size link previews (Discord, WhatsApp, Open Graph) are made for. */
const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;

/** The GM's picture for the party: the invite link's preview. Saved as soon as it is cropped. */
export function PartyImageSettings({ party }: { party: PartyView }) {
  const t = useTranslations('parties.image');
  const queryClient = useQueryClient();
  const { getErrorMessage } = useErrorMessage();
  const { upload, isUploading } = useFileUploader();
  const { removeImage } = useParty(party.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ file: File; source: string } | null>(null);

  const clearPending = () => {
    if (pending) URL.revokeObjectURL(pending.source);
    setPending(null);
  };

  const confirmCrop = async (area: CropArea | null) => {
    if (!pending) return;
    const original = pending.file;
    clearPending();
    let file: File;
    try {
      file = await cropImage(original, area, { maxSide: PREVIEW_WIDTH });
    } catch (err) {
      toast.error(getErrorMessage(err));
      return;
    }
    try {
      await upload({ file, target: 'party', id: party.id });
    } catch {
      return; // the uploader already said why
    }
    await queryClient.invalidateQueries({ queryKey: partyQueryKey(party.id) });
    toast.success(t('saved'));
  };

  const remove = () => {
    if (!window.confirm(t('removeConfirm'))) return;
    removeImage.mutate(undefined, { onSuccess: () => toast.success(t('removed')) });
  };

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="Palette" hint={t('hint')}>
          {t('title')}
        </SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        <div
          className="bg-muted border-border flex w-full max-w-md items-center justify-center overflow-hidden rounded-md border"
          style={{ aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}` }}
        >
          {party.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- served by the image proxy
            <img src={party.imageUrl} alt={t('alt')} className="h-full w-full object-cover" />
          ) : (
            <p className="text-muted-foreground px-4 text-center text-sm">{t('empty')}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            loading={isUploading}
          >
            {isUploading ? t('uploading') : party.imageUrl ? t('change') : t('upload')}
          </Button>
          {party.imageUrl && (
            <Button
              variant="ghost"
              onClick={remove}
              disabled={removeImage.isPending}
              className="text-danger-flare"
            >
              {t('remove')}
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          aria-label={t('upload')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            // Picking the same file again (a retry) must fire change
            e.target.value = '';
            if (file) setPending({ file, source: URL.createObjectURL(file) });
          }}
        />
        <ImageCropDialog
          source={pending?.source ?? null}
          aspect={PREVIEW_WIDTH / PREVIEW_HEIGHT}
          onCancel={clearPending}
          onConfirm={confirmCrop}
        />
      </SectionCard.Body>
    </SectionCard>
  );
}
