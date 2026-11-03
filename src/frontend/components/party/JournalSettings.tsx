'use client';

import { FormEvent, useId, useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { googleDocUrl, parseGoogleDocId } from '@shared/google-docs';

/** The GM pastes, swaps or removes the Google Docs link of the party journal. */
export function JournalSettings({ party }: { party: PartyView }) {
  const t = useTranslations('parties.journal');
  const fieldId = useId();
  const { setJournal } = useParty(party.id);
  const [url, setUrl] = useState(party.journalDocId ? googleDocUrl(party.journalDocId) : '');

  const docId = parseGoogleDocId(url);
  const tags = {
    b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    i: (chunks: React.ReactNode) => <em>{chunks}</em>,
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    setJournal.mutate(url, { onSuccess: () => toast.success(t('saved')) });
  };

  const removeJournal = () => {
    if (!window.confirm(t('removeConfirm'))) return;
    setJournal.mutate(null, {
      onSuccess: () => {
        setUrl('');
        toast.success(t('removed'));
      },
    });
  };

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="BookOpen">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        <form onSubmit={save} className="flex flex-col gap-2">
          <Label htmlFor={fieldId}>{t('linkLabel')}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={fieldId}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('linkPlaceholder')}
              autoComplete="off"
              className="max-w-md"
            />
            <Button
              type="submit"
              disabled={!docId || docId === party.journalDocId}
              loading={setJournal.isPending}
            >
              {t('save')}
            </Button>
            {party.journalDocId && (
              <Button type="button" variant="ghost" onClick={removeJournal}>
                {t('remove')}
              </Button>
            )}
          </div>
        </form>
        <ol className="text-label text-muted-foreground flex list-decimal flex-col gap-1 pl-5">
          <li>{t.rich('stepShare', tags)}</li>
          <li>{t.rich('stepOpen', tags)}</li>
          <li>{t.rich('stepInvited', tags)}</li>
        </ol>
      </SectionCard.Body>
    </SectionCard>
  );
}
