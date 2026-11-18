'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { GmCombatPanel } from '@frontend/components/combat/GmCombatPanel';
import { PlayerCombatPanel } from '@frontend/components/combat/PlayerCombatPanel';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCurrentUser } from '@frontend/context/UserContext';
import AppLink from '@frontend/demo/AppLink';
import { useCharacters } from '@frontend/hooks/useCharacters';
import { useEncounter } from '@frontend/hooks/useEncounter';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { MyPartyCharacters } from './MyPartyCharacters';
import { PartyGmClaim } from './PartyGmClaim';
import { PartyRequests, personName } from './PartyRequests';
import { PartyRoster } from './PartyRoster';
import { RolePlayCard } from './RolePlayCard';
import { usePartyLive } from './party-live';
import { useMemberAnswers } from './useMemberAnswers';

/** Nobody brought a character yet: invite players, or wait for the ones already in. */
function RolePlayEmpty({ party }: { party: PartyView }) {
  const t = useTranslations('parties.page');
  const hasPlayers = party.people.some((p) => p.status === 'active');

  if (hasPlayers) {
    return (
      <EmptyState
        icon="Users"
        title={t('noCharactersGmWaiting')}
        description={t('noCharactersGmWaitingHint')}
      />
    );
  }
  return (
    <EmptyState
      icon="Users"
      title={t('noCharactersGm')}
      description={t('noCharactersGmHint')}
      action={
        <Button asChild variant="outline">
          <AppLink href={`/parties/${party.id}/settings#invite`}>
            <AppIcon name="UserPlus" size={18} aria-hidden="true" />
            {t('invitePlayers')}
          </AppLink>
        </Button>
      }
    />
  );
}

/** The GM's Role Play cards: who is at the table, their passives and what drives them. */
function RolePlayList({ party }: { party: PartyView }) {
  const t = useTranslations('parties.page');
  const cards = party.gm?.rolePlay ?? [];

  return (
    // Columns follow the room the section has, not the screen: the sidebar takes 256px of it
    <section aria-labelledby="party-roleplay" className="@container flex flex-col gap-4">
      <h2 id="party-roleplay" className="text-heading">
        {t('rolePlay')}
      </h2>
      {cards.length === 0 ? (
        <RolePlayEmpty party={party} />
      ) : (
        <ul className="grid grid-cols-1 gap-5 @2xl:grid-cols-2">
          {cards.map((card) => (
            <li key={card.characterId}>
              <RolePlayCard partyId={party.id} card={card} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** On the table tab while a combat is on: says so and leads to it. */
function CombatBanner({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.page');
  const tCombat = useTranslations('combat');
  const { encounter } = useEncounter(partyId);
  if (!encounter) return null;

  return (
    <AppLink
      href={`/parties/${partyId}/combat`}
      className="focus-ring border-warning-muted bg-warning/10 text-warning-flare hover:bg-warning/15 flex min-h-11 items-center justify-between gap-3 rounded-lg border px-4 py-2 transition-colors"
    >
      <span className="flex items-center gap-2 font-semibold">
        <AppIcon name="Swords" size={18} aria-hidden="true" />
        {encounter.round === 0
          ? tCombat('preparing')
          : `${tCombat('title')} · ${tCombat('round', { round: encounter.round })}`}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm">
        {/* On a phone the arrow says it; the words stay for screen readers */}
        <span className="max-sm:sr-only">{t('goToCombat')}</span>
        <AppIcon name="ChevronRight" size={16} aria-hidden="true" />
      </span>
    </AppLink>
  );
}

/**
 * The table tab. The GM: join requests to answer, then the Role Play cards. A player: who is at
 * the table. Both see when a combat is on.
 */
export function PartyTableTab({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.page');
  const tRequests = useTranslations('parties.requestsSection');
  const unnamed = useTranslations('parties.manage')('unnamed');
  const { party } = useParty(partyId);
  const { pending, answer } = useMemberAnswers(partyId);
  // The empty table's own way into the player's menu: one dialog, mounted whatever the roster is
  const [mineOpen, setMineOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  if (!party) return null;

  if (party.role === 'gm') {
    // The name is read now: once answered, the person leaves the list the toast talks about
    const find = (userId: string) => party.people.find((p) => p.userId === userId);
    const nameOf = (userId: string) => {
      const person = find(userId);
      return person ? personName(person, unnamed) : unnamed;
    };
    return (
      <div className="flex flex-col gap-6">
        <PartyRequests
          people={party.people}
          onApprove={(userId) =>
            answer(userId, 'approve', {
              success: tRequests('approved', { name: nameOf(userId) }),
              gone: tRequests('alreadyAnswered', { name: nameOf(userId) }),
            })
          }
          onRemove={(userId) =>
            answer(userId, 'remove', {
              success: tRequests(find(userId)?.status === 'invited' ? 'canceled' : 'declined', {
                name: nameOf(userId),
              }),
              gone: tRequests('alreadyAnswered', { name: nameOf(userId) }),
            })
          }
          pending={pending}
        />
        <CombatBanner partyId={party.id} />
        <RolePlayList party={party} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {party.hasGm ? <CombatBanner partyId={party.id} /> : <PartyGmClaim party={party} />}
      <section aria-labelledby="party-characters" className="flex flex-col gap-4">
        <h2 id="party-characters" ref={heading} tabIndex={-1} className="text-heading outline-none">
          {t('characters')}
        </h2>
        <PartyRoster
          roster={party.roster}
          people={party.people}
          myCharacterIds={party.myCharacterIds}
          // The empty table leads straight to picking who to bring
          emptyAction={<Button onClick={() => setMineOpen(true)}>{t('chooseCharacters')}</Button>}
        />
      </section>
      {/* Outside the roster's empty state: saving fills the table, and that would unmount it
          open. Its button is gone by then, so the focus goes to the list's heading. */}
      <MyPartyMenu
        party={party}
        open={mineOpen}
        onOpenChange={setMineOpen}
        onCloseAutoFocus={(event) => {
          if (party.roster.length > 0) {
            event.preventDefault();
            heading.current?.focus();
          }
        }}
      />
    </div>
  );
}

/** The combat tab: the GM's initiative tracker, or the order and turn as a player sees them. */
export function PartyCombatTab({ partyId }: { partyId: string }) {
  const t = useTranslations('combat');
  const { party } = useParty(partyId);
  const { encounter, isLoading } = useEncounter(partyId);
  const live = usePartyLive();
  if (!party) return null;

  if (party.role === 'gm') return <GmCombatPanel party={party} live={live} />;
  if (!party.hasGm) return <PartyGmClaim party={party} />;
  if (isLoading) return <LoadingState thematic />;
  if (!encounter) return <EmptyState icon="Swords" title={t('noCombatPlayer')} />;
  return <PlayerCombatPanel partyId={party.id} edition={party.edition} live={live} />;
}

/**
 * A player's own business with the party, out of the way of play: who they bring, and leaving.
 * With `open` it is opened from outside and has no button of its own (the empty table's).
 */
export function MyPartyMenu({
  party,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: {
  party: PartyView;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations('parties');
  const confirm = useConfirm();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { characters } = useCharacters();
  const { getErrorMessage } = useErrorMessage();
  const { setMyCharacters, removeMember } = useParty(party.id);
  // Opened from outside (`open`), or by its own button
  const [ownOpen, setOwnOpen] = useState(false);
  const isOpen = open ?? ownOpen;
  const setOpen = onOpenChange ?? setOwnOpen;

  // Saved, it closes: the toast says it worked, and the dialog has nothing left to do
  const save = async (characterIds: string[]) => {
    try {
      await setMyCharacters.mutateAsync(characterIds);
      toast.success(t('mine.saved'));
      setOpen(false);
    } catch {
      // useParty already shows the error
    }
  };

  // Nobody else could open a party without a GM: its last player leaving deletes it
  const lastPlayer = !party.hasGm && party.people.filter((p) => p.status === 'active').length <= 1;

  const leave = async () => {
    if (!currentUser) return;
    const ok = await confirm({
      title: t(lastPlayer ? 'mine.leaveTitleLastPlayer' : 'mine.leaveTitle'),
      description: t(lastPlayer ? 'mine.leaveConfirmLastPlayer' : 'mine.leaveConfirm'),
      confirmLabel: t('mine.leave'),
      destructive: true,
    });
    if (!ok) return;
    // mutateAsync, not mutate's callbacks: the party reload that follows answers "not found" and
    // unmounts this dialog before a callback would run
    try {
      await removeMember.mutateAsync(currentUser.id);
      toast.success(t('mine.left'));
      router.push('/parties');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <AppIcon name="User" size={18} aria-hidden="true" />
            {t('mine.open')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{t('mine.title')}</DialogTitle>
          <DialogDescription>{t('mine.description')}</DialogDescription>
        </DialogHeader>
        <MyPartyCharacters
          // A new list from the server (another device) starts the picker over
          key={party.myCharacterIds.join()}
          characters={characters}
          selected={party.myCharacterIds}
          onSave={save}
          isSaving={setMyCharacters.isPending}
        />
        {/* Apart from Save, below a rule: leaving is not one more way to save the list */}
        <div className="border-border border-t pt-4">
          <Button
            // Deleting the whole party is red all over (acoes-destrutivas.md)
            variant={lastPlayer ? 'destructive' : 'destructive-ghost'}
            onClick={leave}
            loading={removeMember.isPending}
          >
            {t('mine.leave')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Not found, or not the person's party (the API answers the same for both). */
export function PartyNotFound() {
  const t = useTranslations('parties.page');

  return (
    <EmptyState
      icon="Shield"
      // The page's only heading: nothing else on it names it
      titleAs="h1"
      title={t('notFoundTitle')}
      description={t('notFoundDescription')}
      className="w-full max-w-lg"
      action={
        <AppLink href="/parties" className="text-primary-flare text-sm underline">
          {t('backToParties')}
        </AppLink>
      }
    />
  );
}

/**
 * The demo's party: the GM's Role Play cards only. The app's party is the tabbed frame
 * (PartyFrame) around PartyTableTab and the other tabs.
 */
export function PartyPage({ partyId }: { partyId: string }) {
  const t = useTranslations('parties');
  const { party, isLoading } = useParty(partyId);

  if (isLoading) return <LoadingState thematic />;
  if (!party) return <PartyNotFound />;

  return (
    <PageContainer title={party.name} eyebrow={t('page.gmEyebrow')}>
      <RolePlayList party={party} />
    </PageContainer>
  );
}
