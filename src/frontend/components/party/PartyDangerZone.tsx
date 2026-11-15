'use client';

import { useId } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

/** Deleting the party, apart at the end of the settings so it is never clicked on the way. */
export function PartyDangerZone({ party, onDeleted }: { party: PartyView; onDeleted: () => void }) {
  const t = useTranslations('parties.manage');
  const confirm = useConfirm();
  const titleId = useId();
  const { remove } = useParty(party.id);

  const deleteParty = async () => {
    const ok = await confirm({
      title: t('deleteParty'),
      description: t('deleteConfirm'),
      confirmLabel: t('deleteParty'),
      destructive: true,
    });
    if (!ok) return;
    // mutateAsync, not mutate's callbacks: the party reload that follows answers "not found" and
    // unmounts this panel before a callback would run
    try {
      await remove.mutateAsync();
      toast.success(t('deleted'));
      onDeleted();
    } catch {
      // useParty already shows the error
    }
  };

  return (
    <SectionCard role="region" aria-labelledby={titleId} className="border-danger-muted">
      <SectionCard.Header className="bg-danger-surface">
        {/* Icon as a child, not `icon`: the prop paints it in the character colour */}
        <SectionCard.Title id={titleId} className="text-danger-flare">
          <AppIcon name="TriangleAlert" size={14} className="shrink-0" aria-hidden="true" />
          {t('dangerZone')}
        </SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col items-start gap-4">
        <p className="text-body text-muted-foreground">{t('deleteHint')}</p>
        <Button
          type="button"
          variant="destructive"
          onClick={deleteParty}
          loading={remove.isPending}
        >
          <AppIcon name="Trash2" size={16} aria-hidden="true" />
          {t('deleteParty')}
        </Button>
      </SectionCard.Body>
    </SectionCard>
  );
}
