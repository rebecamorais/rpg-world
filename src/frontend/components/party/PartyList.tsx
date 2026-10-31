'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Button } from '@frontend/components/ui/button';
import { Card } from '@frontend/components/ui/card';
import { ErrorState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useParties } from '@frontend/hooks/useParties';

import type { PartySummary } from '@backend/contexts/parties/domain/Party';

import { CreatePartyForm } from './CreatePartyForm';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-label text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function PartyRow({ party, children }: { party: PartySummary; children?: React.ReactNode }) {
  const t = useTranslations('parties');

  return (
    <Card className="bg-card/60 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-col">
        {party.status === 'active' || party.status === 'gm' ? (
          <Link href={`/parties/${party.id}`} className="text-title focus-ring truncate rounded">
            {party.name}
          </Link>
        ) : (
          <span className="text-title truncate">{party.name}</span>
        )}
        {party.gmUsername && party.role === 'player' && (
          <span className="text-label text-muted-foreground">
            {t('gmBy', { username: party.gmUsername })}
          </span>
        )}
      </div>
      {party.pendingRequests > 0 && (
        <span className="text-label text-warning-flare flex items-center gap-1.5">
          <span className="bg-warning h-2 w-2 rounded-full" aria-hidden="true" />
          {t('pendingRequests', { count: party.pendingRequests })}
        </span>
      )}
      {children}
    </Card>
  );
}

/** The parties page: invitations first (they wait for an answer), then GM and player tables. */
export default function PartyList() {
  const t = useTranslations('parties');
  const { getErrorMessage } = useErrorMessage();
  const { parties, isLoading, error, respond, isResponding } = useParties();

  if (error) return <ErrorState title={t('loadErrorTitle')} description={getErrorMessage(error)} />;
  if (isLoading || !parties) return <LoadingState thematic />;

  return (
    <div className="flex flex-col gap-8">
      {parties.invites.length > 0 && (
        <Section title={t('invites')}>
          {parties.invites.map((party) => (
            <PartyRow key={party.id} party={party}>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isResponding}
                  onClick={() => respond({ partyId: party.id, accept: false })}
                >
                  {t('decline')}
                </Button>
                <Button
                  size="sm"
                  disabled={isResponding}
                  onClick={() => respond({ partyId: party.id, accept: true })}
                >
                  <AppIcon name="Check" size={16} aria-hidden="true" />
                  {t('accept')}
                </Button>
              </div>
            </PartyRow>
          ))}
        </Section>
      )}

      <Section title={t('asGm')}>
        {parties.asGm.length === 0 && <p className="text-muted-foreground">{t('emptyGm')}</p>}
        {parties.asGm.map((party) => (
          <PartyRow key={party.id} party={party} />
        ))}
        <CreatePartyForm gmCount={parties.asGm.length} />
      </Section>

      <Section title={t('asPlayer')}>
        {parties.asPlayer.length === 0 && (
          <p className="text-muted-foreground">{t('emptyPlayer')}</p>
        )}
        {parties.asPlayer.map((party) => (
          <PartyRow key={party.id} party={party} />
        ))}
      </Section>

      {parties.requests.length > 0 && (
        <Section title={t('requests')}>
          {parties.requests.map((party) => (
            <PartyRow key={party.id} party={party}>
              <Button
                size="sm"
                variant="ghost"
                disabled={isResponding}
                onClick={() => respond({ partyId: party.id, accept: false })}
              >
                {t('withdraw')}
              </Button>
            </PartyRow>
          ))}
        </Section>
      )}
    </div>
  );
}
