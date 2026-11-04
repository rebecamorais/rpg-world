'use client';

import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

/**
 * Where deleting the account lands: the home is prebuilt, so the notice reads `?accountDeleted`
 * in the browser (the page puts it inside a Suspense boundary, the rest stays prebuilt).
 */
export function AccountDeletedNotice() {
  const t = useTranslations('accountDeletion');
  const deleted = useSearchParams().has('accountDeleted');
  if (!deleted) return null;

  return (
    <p
      role="status"
      className="border-success-muted bg-success-surface text-success-flare mb-8 rounded-md border px-4 py-3 text-sm"
    >
      {t('deleted')}
    </p>
  );
}
