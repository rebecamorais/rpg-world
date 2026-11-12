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
            {requested.map((person) => {
              const name = personName(person, unnamed);
              return (
                <li
                  key={person.userId}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="font-medium">{name}</span>
                  {/* Every row has the same buttons: the label names the person they answer */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      aria-label={t('declineFrom', { name })}
                      onClick={() => {
                        if (window.confirm(t('declineConfirm', { name }))) onRemove(person.userId);
                      }}
                    >
                      {t('decline')}
                    </Button>
                    <Button
                      size="sm"
                      disabled={isBusy}
                      aria-label={t('approveFrom', { name })}
                      onClick={() => onApprove(person.userId)}
                    >
                      {t('approve')}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {invited.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-label text-muted-foreground">{t('invitedTitle')}</h3>
            <ul className="flex flex-col gap-2">
              {invited.map((person) => {
                const name = personName(person, unnamed);
                return (
                  <li
                    key={person.userId}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span>{name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      aria-label={t('cancelFor', { name })}
                      onClick={() => {
                        if (window.confirm(t('cancelConfirm', { name }))) onRemove(person.userId);
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SectionCard.Body>
    </SectionCard>
  );
}
