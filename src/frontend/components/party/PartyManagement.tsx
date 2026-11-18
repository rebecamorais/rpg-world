'use client';

import { FormEvent, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { SectionCard } from '@frontend/components/ui/section-card';
import { SelectField } from '@frontend/components/ui/select-field';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { EDITIONS, type Edition } from '@shared/systems/dnd5e/content/editions';

import { personName } from './PartyRequests';
import { useMemberAnswers } from './useMemberAnswers';

const noSubscription = () => () => {};

/** The site's origin, known only in the browser (empty while rendering on the server). */
const useOrigin = () =>
  useSyncExternalStore(
    noSubscription,
    () => window.location.origin,
    () => '',
  );

/** Who the GM just removed, and where the focus goes once their row is gone (null: the heading). */
type Removed = { userId: string; next: string | null };

/** The GM's controls: invite, the link, players, name and rules edition. Deleting is in PartyDangerZone. */
export function PartyManagement({ party }: { party: PartyView }) {
  const t = useTranslations('parties.manage');
  const confirm = useConfirm();
  const ids = {
    invite: useId(),
    link: useId(),
    name: useId(),
    edition: useId(),
    editionHint: useId(),
  };
  const origin = useOrigin();
  const { invite, rotateCode, rename, setEdition } = useParty(party.id);
  const { pending, answer } = useMemberAnswers(party.id);
  const [username, setUsername] = useState('');
  const [name, setName] = useState(party.name);
  const linkField = useRef<HTMLInputElement>(null);
  const playersHeading = useRef<HTMLHeadingElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const [removed, setRemoved] = useState<Removed | null>(null);
  // The removal the focus already moved for: once is enough
  const focusedFor = useRef<Removed | null>(null);

  const link = `${origin}/parties/join/${party.gm?.inviteCode ?? ''}`;
  const players = party.people.filter((p) => p.status === 'active');

  // The removed row is gone: the focus would fall to the page's start, so it goes to the next
  // "Remove" (the one before, at the end of the list), or to the heading when nobody is left
  useEffect(() => {
    if (!removed || focusedFor.current === removed) return;
    if (party.people.some((p) => p.userId === removed.userId)) return;
    focusedFor.current = removed;
    const next = removed.next ? removeButtons.current.get(removed.next) : undefined;
    (next ?? playersHeading.current)?.focus();
  }, [removed, party.people]);

  const removePlayer = async (userId: string, label: string) => {
    const key = party.journalDocId ? 'removeConfirmJournal' : 'removeConfirm';
    const ok = await confirm({
      title: t('removeTitle', { name: label }),
      description: t(key, { name: label }),
      confirmLabel: t('remove'),
      destructive: true,
    });
    if (!ok) return;
    const index = players.findIndex((p) => p.userId === userId);
    const next = players[index + 1] ?? players[index - 1];
    const gone = await answer(userId, 'remove', {
      success: t('removed', { name: label }),
      gone: t('alreadyGone', { name: label }),
    });
    if (gone) setRemoved({ userId, next: next?.userId ?? null });
  };

  const sendInvite = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const status = await invite.mutateAsync(username);
      toast.success(status === 'active' ? t('joined') : t('invited'));
      setUsername('');
    } catch {
      // useParty already shows the error
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('copied'));
    } catch {
      // No clipboard permission (or no clipboard): the link is selected, to copy by hand
      linkField.current?.select();
      toast.error(t('copyFailed'));
    }
  };

  const rotate = async () => {
    const ok = await confirm({
      title: t('rotateTitle'),
      description: t('rotateConfirm'),
      confirmLabel: t('rotate'),
      destructive: true,
    });
    if (!ok) return;
    rotateCode.mutate(undefined, { onSuccess: () => toast.success(t('rotated')) });
  };

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    rename.mutate(name, { onSuccess: () => toast.success(t('renamed')) });
  };

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="Users">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-6">
        {/* #invite: where "Invite players" on an empty table lands */}
        <form id="invite" onSubmit={sendInvite} className="flex scroll-mt-24 flex-col gap-2">
          <Label htmlFor={ids.invite}>{t('inviteLabel')}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={ids.invite}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('invitePlaceholder')}
              autoComplete="off"
              // A username: no spelling squiggles, no capital first letter on phones
              spellCheck={false}
              autoCapitalize="none"
              maxLength={60}
              className="max-w-xs"
            />
            {/* Outline, as the other forms here (rename, journal): one weight on the page */}
            <Button
              type="submit"
              variant="outline"
              disabled={!username.trim()}
              loading={invite.isPending}
            >
              {t('inviteSubmit')}
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.link}>{t('link')}</Label>
          <p className="text-caption text-muted-foreground">{t('linkHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Input
              ref={linkField}
              id={ids.link}
              value={link}
              readOnly
              className="max-w-md font-mono text-xs"
            />
            <Button type="button" variant="outline" onClick={copy}>
              {t('copy')}
            </Button>
            <Button type="button" variant="ghost" onClick={rotate} loading={rotateCode.isPending}>
              {t('rotate')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            ref={playersHeading}
            tabIndex={-1}
            className="text-label text-muted-foreground outline-none"
          >
            {t('members')}
          </h3>
          {players.length === 0 && <p className="text-muted-foreground">{t('noMembers')}</p>}
          <ul className="flex flex-col gap-2">
            {players.map((person) => {
              const label = personName(person, t('unnamed'));
              return (
                <li
                  key={person.userId}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{label}</span>
                  {/* Every row has the same button: the label names who it removes */}
                  <Button
                    ref={(button) => {
                      if (button) removeButtons.current.set(person.userId, button);
                      else removeButtons.current.delete(person.userId);
                    }}
                    size="sm"
                    variant="destructive-ghost"
                    loading={pending.has(person.userId)}
                    aria-label={t('removeFrom', { name: label })}
                    onClick={() => removePlayer(person.userId, label)}
                  >
                    {t('remove')}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        <form onSubmit={saveName} className="flex flex-col gap-2">
          <Label htmlFor={ids.name}>{t('nameLabel')}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={ids.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              maxLength={60}
              className="max-w-xs"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={!name.trim() || name === party.name}
              loading={rename.isPending}
            >
              {t('rename')}
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.edition}>{t('editionLabel')}</Label>
          <p id={ids.editionHint} className="text-caption text-muted-foreground">
            {t('editionHint')}
          </p>
          <SelectField
            id={ids.edition}
            aria-describedby={ids.editionHint}
            value={party.edition}
            onValueChange={(edition) =>
              setEdition.mutate(edition as Edition, {
                onSuccess: () => toast.success(t('editionSaved')),
              })
            }
            options={EDITIONS.map((edition) => ({
              value: edition,
              label: t(edition === '2014' ? 'edition2014' : 'edition2024'),
            }))}
            className="max-w-xs"
          />
        </div>
      </SectionCard.Body>
    </SectionCard>
  );
}
