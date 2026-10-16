import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';

/**
 * Preview deployments send no e-mail: the confirmation or reset link comes back from the
 * server action and is shown here instead.
 */
export function PreviewLinkNotice({ link }: { link: string }) {
  const t = useTranslations('auth.previewLink');

  return (
    <div
      role="note"
      className="border-warning-muted bg-warning-surface flex flex-col gap-3 rounded-lg border p-4"
    >
      <p className="text-label text-warning-flare">{t('title')}</p>
      <p className="text-caption text-muted-foreground">{t('description')}</p>
      <Button asChild variant="outline" className="w-full">
        <a href={link}>{t('open')}</a>
      </Button>
    </div>
  );
}
