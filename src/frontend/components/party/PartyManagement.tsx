'use client';

import { FormEvent, useId, useState, useSyncExternalStore } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { personName } from './PartyRequests';

const noSubscription = () => () => {};

/** The site's origin, known only in the browser (empty while rendering on the server). */
const useOrigin = () =>
  useSyncExternalStore(
    noSubscription,
    () => window.location.origin,
    () => '',
  );

/** The GM's controls: invite, the link, players, name and deleting the party. */
export function PartyManagement({ party, onDeleted }: { party: PartyView; onDeleted: () => void }) {
  const t = useTranslations('parties.manage');
  const ids = { invite: useId(), link: useId(), name: useId() };
  const origin = useOrigin();
  const { invite, rotateCode, removeMember, rename, remove } = useParty(party.id);
  const [username, setUsername] = useState('');
  const [name, setName] = useState(party.name);

  const link = `${origin}/parties/join/${party.gm?.inviteCode ?? ''}`;
  const players = party.people.filter((p) => p.status === 'active');

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
    await navigator.clipboard.writeText(link);
    toast.success(t('copied'));
  };

  const rotate = () => {
    if (!window.confirm(t('rotateConfirm'))) return;
    rotateCode.mutate(undefined, { onSuccess: () => toast.success(t('rotated')) });
  };

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    rename.mutate(name, { onSuccess: () => toast.success(t('renamed')) });
  };

  const deleteParty = () => {
    if (!window.confirm(t('deleteConfirm'))) return;
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('deleted'));
        onDeleted();
      },
    });
  };

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="Settings2">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-6">
        <form onSubmit={sendInvite} className="flex flex-col gap-2">
          <Label htmlFor={ids.invite}>{t('inviteLabel')}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={ids.invite}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('invitePlaceholder')}
              autoComplete="off"
              maxLength={60}
              className="max-w-xs"
            />
            <Button type="submit" disabled={!username.trim()} loading={invite.isPending}>
              {t('inviteSubmit')}
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.link}>{t('link')}</Label>
          <p className="text-label text-muted-foreground">{t('linkHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Input id={ids.link} value={link} readOnly className="max-w-md font-mono text-xs" />
            <Button type="button" variant="outline" onClick={copy}>
              {t('copy')}
            </Button>
            <Button type="button" variant="ghost" onClick={rotate} loading={rotateCode.isPending}>
              {t('rotate')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-label text-muted-foreground">{t('members')}</h3>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={removeMember.isPending}
                    onClick={() => {
                      if (window.confirm(t('removeConfirm', { name: label }))) {
                        removeMember.mutate(person.userId);
                      }
                    }}
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

        <Button
          type="button"
          variant="destructive"
          onClick={deleteParty}
          loading={remove.isPending}
          className="self-start"
        >
          {t('deleteParty')}
        </Button>
      </SectionCard.Body>
    </SectionCard>
  );
}
