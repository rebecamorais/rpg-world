'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { GmCombatPanel } from '@frontend/components/combat/GmCombatPanel';
import { PlayerCombatPanel } from '@frontend/components/combat/PlayerCombatPanel';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useCharacters } from '@frontend/hooks/useCharacters';
import { useEncounter } from '@frontend/hooks/useEncounter';
import { useParty } from '@frontend/hooks/useParty';
import { usePartyChannel } from '@frontend/hooks/usePartyChannel';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { MyPartyCharacters } from './MyPartyCharacters';
import { PartyJournal } from './PartyJournal';
import { PartyRequests } from './PartyRequests';
import { PartyRoster } from './PartyRoster';
import { RolePlayCard } from './RolePlayCard';

type GmMode = 'roleplay' | 'combat' | 'journal';

/** Role Play, Combat or Journal, kept in `?mode=`; without one, Combat while a combat is going on. */
function useGmMode(partyId: string) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { encounter, isLoading } = useEncounter(partyId);
  const asked = searchParams.get('mode');
  const mode: GmMode =
    asked === 'combat' || asked === 'roleplay' || asked === 'journal'
      ? asked
      : encounter
        ? 'combat'
        : 'roleplay';

  // The native history API updates searchParams right away, without asking the server again
  const setMode = (next: string) =>
    window.history.replaceState(null, '', `${pathname}?mode=${next}`);
  return { mode, setMode, isLoading };
}

function GmView({ party, live }: { party: PartyView; live: boolean }) {
  const t = useTranslations('parties.page');
  const tCombat = useTranslations('combat');
  const tJournal = useTranslations('parties.journal');
  const { acceptMember, removeMember } = useParty(party.id);
  const { mode, setMode, isLoading } = useGmMode(party.id);
  const cards = party.gm?.rolePlay ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PartyRequests
        people={party.people}
        onApprove={(userId) => acceptMember.mutate(userId)}
        onRemove={(userId) => removeMember.mutate(userId)}
        isBusy={acceptMember.isPending || removeMember.isPending}
      />

      {!isLoading && (
        <Tabs value={mode} onValueChange={setMode} className="flex flex-col gap-4">
          <TabsList className="self-start">
            <TabsTrigger value="roleplay">{tCombat('modeRolePlay')}</TabsTrigger>
            <TabsTrigger value="combat">{tCombat('modeCombat')}</TabsTrigger>
            <TabsTrigger value="journal">{tJournal('tab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="roleplay" className="flex flex-col gap-4">
            <h2 className="sr-only">{t('rolePlay')}</h2>
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
          </TabsContent>

          <TabsContent value="combat">
            <GmCombatPanel party={party} live={live} />
          </TabsContent>

          <TabsContent value="journal" className="flex flex-col gap-4">
            <h2 className="sr-only">{tJournal('title')}</h2>
            <PartyJournal docId={party.journalDocId} role={party.role} partyId={party.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function PlayerView({ party, live }: { party: PartyView; live: boolean }) {
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
      <PlayerCombatPanel partyId={party.id} edition={party.edition} live={live} />

      <section aria-labelledby="party-journal" className="flex flex-col gap-4">
        <h2 id="party-journal" className="text-heading">
          {t('journal.title')}
        </h2>
        <PartyJournal docId={party.journalDocId} role={party.role} partyId={party.id} />
      </section>

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

/** Not found, or not the person's party (the API answers the same for both). */
export function PartyNotFound() {
  const t = useTranslations('parties.page');

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

/** A party: the GM's Role Play and Combat modes, or what a player sees and brings. */
export function PartyPage({ partyId }: { partyId: string }) {
  const t = useTranslations('parties');
  const { party, isLoading } = useParty(partyId);
  const { live } = usePartyChannel(partyId);

  if (isLoading) return <LoadingState thematic />;
  if (!party) return <PartyNotFound />;

  return (
    <PageContainer
      title={party.name}
      eyebrow={party.role === 'gm' ? t('page.gmEyebrow') : t('page.playerEyebrow')}
      actions={
        party.role === 'gm' && (
          <Button asChild variant="outline">
            <Link href={`/parties/${party.id}/settings`}>
              <AppIcon name="Settings2" size={18} aria-hidden="true" />
              {t('settings.open')}
            </Link>
          </Button>
        )
      }
    >
      {party.role === 'gm' ? (
        <GmView party={party} live={live} />
      ) : (
        <PlayerView party={party} live={live} />
      )}
    </PageContainer>
  );
}
