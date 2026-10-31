'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useCharacters } from '@frontend/hooks/useCharacters';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { MyPartyCharacters } from './MyPartyCharacters';
import { PartyManagement } from './PartyManagement';
import { PartyRequests } from './PartyRequests';
import { PartyRoster } from './PartyRoster';
import { RolePlayCard } from './RolePlayCard';

function GmView({ party }: { party: PartyView }) {
  const t = useTranslations('parties.page');
  const router = useRouter();
  const { acceptMember, removeMember } = useParty(party.id);
  const cards = party.gm?.rolePlay ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PartyRequests
        people={party.people}
        onApprove={(userId) => acceptMember.mutate(userId)}
        onRemove={(userId) => removeMember.mutate(userId)}
        isBusy={acceptMember.isPending || removeMember.isPending}
      />

      <section aria-labelledby="role-play" className="flex flex-col gap-4">
        <h2 id="role-play" className="text-heading">
          {t('rolePlay')}
        </h2>
        {cards.length === 0 ? (
          <p className="text-muted-foreground">{t('noCharactersGm')}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {cards.map((card) => (
              <li key={card.characterId}>
                <RolePlayCard partyId={party.id} card={card} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <PartyManagement party={party} onDeleted={() => router.push('/parties')} />
    </div>
  );
}

function PlayerView({ party }: { party: PartyView }) {
  const t = useTranslations('parties');
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { characters } = useCharacters();
  const { setMyCharacters, removeMember } = useParty(party.id);

  const save = async (characterIds: string[]) => {
    try {
      await setMyCharacters.mutateAsync(characterIds);
      toast.success(t('mine.saved'));
    } catch {
      // useParty already shows the error
    }
  };

  const leave = () => {
    if (!currentUser || !window.confirm(t('mine.leaveConfirm'))) return;
    removeMember.mutate(currentUser.id, {
      onSuccess: () => {
        toast.success(t('mine.left'));
        router.push('/parties');
      },
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="party-characters" className="flex flex-col gap-4">
        <h2 id="party-characters" className="text-heading">
          {t('page.characters')}
        </h2>
        <PartyRoster roster={party.roster} people={party.people} />
      </section>

      <SectionCard>
        <SectionCard.Header>
          <SectionCard.Title icon="Swords">{t('mine.title')}</SectionCard.Title>
        </SectionCard.Header>
        <SectionCard.Body className="flex flex-col gap-4">
          <p className="text-muted-foreground">{t('mine.description')}</p>
          <MyPartyCharacters
            // A new list from the server (another device) starts the picker over
            key={party.myCharacterIds.join()}
            characters={characters}
            selected={party.myCharacterIds}
            onSave={save}
            isSaving={setMyCharacters.isPending}
          />
        </SectionCard.Body>
      </SectionCard>

      <Button
        variant="ghost"
        onClick={leave}
        loading={removeMember.isPending}
        className="text-danger-flare self-start"
      >
        {t('mine.leave')}
      </Button>
    </div>
  );
}

/** A party: the GM's Role Play view and controls, or what a player sees and brings. */
export function PartyPage({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.page');
  const { party, isLoading } = useParty(partyId);

  if (isLoading) return <LoadingState thematic />;

  if (!party) {
    return (
      <EmptyState
        icon="Shield"
        title={t('notFoundTitle')}
        description={t('notFoundDescription')}
        className="w-full max-w-lg"
        action={
          <Link href="/parties" className="text-primary-flare text-sm underline">
            {t('backToParties')}
          </Link>
        }
      />
    );
  }

  return (
    <PageContainer
      title={party.name}
      eyebrow={party.role === 'gm' ? t('gmEyebrow') : t('playerEyebrow')}
    >
      {party.role === 'gm' ? <GmView party={party} /> : <PlayerView party={party} />}
    </PageContainer>
  );
}
