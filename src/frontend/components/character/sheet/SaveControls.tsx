'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  useCharacterActions,
  useCharacterMeta,
  useCharacterState,
} from '@frontend/context/CharacterContext';

interface SaveButtonProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

/** "Save changes" of a sheet tab: enabled only with unsaved edits. */
export function SaveButton({ isDirty, isSaving, onSave }: SaveButtonProps) {
  const t = useTranslations('common');

  return (
    <Button
      variant="character"
      size="sm"
      onClick={onSave}
      disabled={!isDirty}
      loading={isSaving}
      className="text-label h-8 px-4"
    >
      {isSaving ? t('saving') : t('saveChanges')}
    </Button>
  );
}

/** Save button of the Status tab, wired to the character draft. */
export function SaveCharacterButton() {
  const { isDirty } = useCharacterState();
  const { isSaving } = useCharacterMeta();
  const { save } = useCharacterActions();

  return <SaveButton isDirty={isDirty} isSaving={isSaving} onSave={save} />;
}
