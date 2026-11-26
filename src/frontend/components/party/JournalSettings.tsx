'use client';

import { FormEvent, useId, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useFocusAfterRemove } from '@frontend/hooks/useFocusAfterRemove';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { googleDocUrl, parseGoogleDocId } from '@shared/google-docs';

// Where the focus goes once "Remove" is gone with the link: the field, to paste another one
const REMOVE_FOCUS = 'remove';
const LINK_FOCUS = 'link';

/** The GM pastes, swaps or removes the Google Docs link of the party journal. */
export function JournalSettings({ party }: { party: PartyView }) {
  const t = useTranslations('parties.journal');
  const tErrors = useTranslations('common.errors');
  const confirm = useConfirm();
  const router = useRouter();
  const fieldId = useId();
  const errorId = useId();
  const { setJournal } = useParty(party.id);
  const [url, setUrl] = useState(party.journalDocId ? googleDocUrl(party.journalDocId) : '');
  // Not while typing the link letter by letter: after a paste, or once the field is left
  const [checked, setChecked] = useState(false);
  // "Remove" leaves with the link, and with the focus the confirmation gave back to it
  const { root: focusRoot, next: focusNext, cancel: focusCancel } = useFocusAfterRemove();

  const docId = parseGoogleDocId(url);
  // Save alone turning grey said nothing about why
  const invalid = checked && !!url.trim() && !docId;
  const tags = {
    b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    i: (chunks: React.ReactNode) => <em>{chunks}</em>,
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    setJournal.mutate(url, {
      onSuccess: () =>
        // The GM often came from the empty journal tab: one tap back to it
        toast.success(t('saved'), {
          action: {
            label: t('view'),
            onClick: () => router.push(`/parties/${party.id}/journal`),
          },
        }),
    });
  };

  const removeJournal = async () => {
    const ok = await confirm({
      title: t('removeTitle'),
      description: t('removeConfirm'),
      confirmLabel: t('remove'),
      destructive: true,
    });
    if (!ok) return;
    focusNext(REMOVE_FOCUS, [LINK_FOCUS]);
    setJournal.mutate(null, {
      onSuccess: () => {
        setUrl('');
        toast.success(t('removed'));
      },
      onError: () => focusCancel(REMOVE_FOCUS), // the link stays, and so does the focus
    });
  };

  return (
    // #journal: where "Set up the journal" on the empty tab lands
    <SectionCard ref={focusRoot} id="journal" className="scroll-mt-24">
      <SectionCard.Header>
        <SectionCard.Title icon="BookOpen">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        {/* noValidate: a bare document id is accepted too, which the browser's url check would refuse */}
        <form onSubmit={save} noValidate className="flex flex-col gap-2">
          <Label htmlFor={fieldId}>{t('linkLabel')}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={fieldId}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPaste={() => setChecked(true)}
              onBlur={() => setChecked(true)}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? errorId : undefined}
              placeholder={t('linkPlaceholder')}
              type="url"
              autoComplete="off"
              spellCheck={false}
              className="max-w-md"
              data-focus-key={LINK_FOCUS}
            />
            {/* Outline, as the other forms here (invite, rename): one weight on the page */}
            <Button
              type="submit"
              variant="outline"
              disabled={!docId || docId === party.journalDocId || setJournal.isPending}
              loading={setJournal.isPending}
            >
              {t('save')}
            </Button>
            {party.journalDocId && (
              <Button
                type="button"
                variant="destructive-ghost"
                onClick={removeJournal}
                disabled={setJournal.isPending}
                data-focus-key={REMOVE_FOCUS}
              >
                {t('remove')}
              </Button>
            )}
          </div>
          {invalid && (
            <p id={errorId} className="text-caption text-danger-flare">
              {tErrors('party_error_journal_url_invalid')}
            </p>
          )}
        </form>
        <ol className="text-caption text-muted-foreground flex list-decimal flex-col gap-1 pl-5">
          <li>{t.rich('stepShare', tags)}</li>
          <li>{t.rich('stepOpen', tags)}</li>
          <li>{t.rich('stepInvited', tags)}</li>
        </ol>
      </SectionCard.Body>
    </SectionCard>
  );
}
