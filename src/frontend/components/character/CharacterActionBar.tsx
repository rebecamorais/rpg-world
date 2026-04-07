'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

interface CharacterActionBarProps {
  characterName: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  showSave?: boolean;
}

export default function CharacterActionBar({
  characterName: _,
  hasUnsavedChanges,
  isSaving,
  onSave,
  showSave = true,
}: CharacterActionBarProps) {
  const tCommon = useTranslations('common');

  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <Link href="/characters" className="text-muted-foreground hover:text-foreground text-sm">
          {tCommon('back')}
        </Link>
        {hasUnsavedChanges && (
          <span className="rounded bg-amber-500/20 px-2 py-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
            {tCommon('unsavedChanges')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {showSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="bg-primary rounded px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {isSaving ? tCommon('saving') : tCommon('saveChanges')}
          </button>
        )}
      </div>
    </div>
  );
}
