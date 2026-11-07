'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import {
  useCharacterActions,
  useCharacterMeta,
  useLoadedCharacter,
} from '@frontend/context/CharacterContext';
import { useFileUploader } from '@frontend/context/FileUploaderContext';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { fullImage } from '@frontend/lib/crop-image';

/**
 * Picks the art behind the sheet. It goes to the sheet's draft, like the avatar: only Save keeps it.
 * Re-encoded in the browser, which fits it to the limit and drops the photo's GPS and other metadata.
 */
export function SheetBackgroundSettings() {
  const t = useTranslations('characterAppearance');
  const { getErrorMessage } = useErrorMessage();
  const { id } = useCharacterMeta();
  const { sheetBackgroundUrl } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const { upload } = useFileUploader();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);

  const send = async (picked: File) => {
    setIsSending(true);
    try {
      let file: File;
      try {
        file = await fullImage(picked);
      } catch (err) {
        toast.error(getErrorMessage(err));
        return;
      }
      const { url } = await upload({ file, target: 'sheetBackground', id });
      update({ sheetBackgroundUrl: url });
    } catch {
      // The uploader already told the user; the current background stays
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        id="sheet-background-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear the input so picking the same file again (e.g. after removing it) fires change
          e.target.value = '';
          if (file) void send(file);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isSending}
        onClick={() => inputRef.current?.click()}
      >
        {isSending
          ? t('backgroundSending')
          : sheetBackgroundUrl
            ? t('backgroundReplace')
            : t('backgroundAdd')}
      </Button>
      {sheetBackgroundUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSending}
          onClick={() => update({ sheetBackgroundUrl: '' })}
        >
          {t('backgroundRemove')}
        </Button>
      )}
    </div>
  );
}
