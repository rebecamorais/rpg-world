'use client';

import { useTranslations } from 'next-intl';

interface CharacterActionBarProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export default function CharacterActionBar({
  hasUnsavedChanges,
  isSaving,
  onSave,
}: CharacterActionBarProps) {
  const tCommon = useTranslations('common');

  return (
    <div className="bg-background/80 sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-4 border-b border-white/5 px-4 py-2 backdrop-blur-md">
      <span className="text-character-flare text-xs font-semibold tracking-wider uppercase transition-opacity duration-300">
        {tCommon('unsavedChanges')}
      </span>
      <button
        type="button"
        onClick={onSave}
        disabled={!hasUnsavedChanges || isSaving}
        className="bg-character rounded px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all disabled:opacity-30"
      >
        {isSaving ? tCommon('saving') : tCommon('saveChanges')}
      </button>
    </div>
  );
}
