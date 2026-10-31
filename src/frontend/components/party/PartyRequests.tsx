'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { SectionCard } from '@frontend/components/ui/section-card';

import type { PartyPerson } from '@backend/contexts/parties/domain/PartyView';

export const personName = (person: PartyPerson, unnamed: string) =>
  person.username ? `@${person.username}` : unnamed;

/** The GM's pending answers: join requests to approve, and invites sent that can be withdrawn. */
export function PartyRequests({
  people,
  onApprove,
  onRemove,
  isBusy,
}: {
  people: PartyPerson[];
  onApprove: (userId: string) => void;
  onRemove: (userId: string) => void;
  isBusy: boolean;
}) {
  const t = useTranslations('parties.requestsSection');
  const unnamed = useTranslations('parties.manage')('unnamed');
  const requested = people.filter((p) => p.status === 'requested');
  const invited = people.filter((p) => p.status === 'invited');

  if (requested.length === 0 && invited.length === 0) return null;

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="Mailbox">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        {requested.length > 0 && (
          <ul className="flex flex-col gap-2">
            {requested.map((person) => (
              <li key={person.userId} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{personName(person, unnamed)}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isBusy}
                    onClick={() => onRemove(person.userId)}
                  >
                    {t('decline')}
                  </Button>
                  <Button size="sm" disabled={isBusy} onClick={() => onApprove(person.userId)}>
                    {t('approve')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {invited.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-label text-muted-foreground">{t('invitedTitle')}</h3>
            <ul className="flex flex-col gap-2">
              {invited.map((person) => (
                <li
                  key={person.userId}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{personName(person, unnamed)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isBusy}
                    onClick={() => onRemove(person.userId)}
                  >
                    {t('cancel')}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard.Body>
    </SectionCard>
  );
}
