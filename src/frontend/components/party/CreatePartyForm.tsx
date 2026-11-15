'use client';

import { FormEvent, useId, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { useParties } from '@frontend/hooks/useParties';

import { MAX_GM_PARTIES } from '@backend/contexts/parties/domain/Party';

/** Name and create; held at the GM limit, saying why. */
export function CreatePartyForm({ gmCount }: { gmCount: number }) {
  const t = useTranslations('parties.create');
  const id = useId();
  const limitId = useId();
  const router = useRouter();
  const [name, setName] = useState('');
  // Created, and on its way to the new party: the form stays shut until the page changes.
  // Before, the button came back as soon as the POST answered, and repeated Enters made copies
  const [created, setCreated] = useState(false);
  // State lands on the next render; two Enters in a row would both pass a state check
  const busy = useRef(false);
  const { createParty, isCreating } = useParties();
  const atLimit = gmCount >= MAX_GM_PARTIES;
  const locked = isCreating || created;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy.current || !name.trim()) return;
    busy.current = true;
    try {
      const { id: partyId } = await createParty(name);
      setCreated(true);
      setName('');
      toast.success(t('success'));
      router.push(`/parties/${partyId}`);
    } catch {
      // useParties already shows the error; the name stays to try again
      busy.current = false;
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Label htmlFor={id}>{t('label')}</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={id}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('placeholder')}
          autoComplete="off"
          maxLength={60}
          required
          disabled={atLimit}
          readOnly={locked}
          aria-describedby={atLimit ? limitId : undefined}
          className="max-w-sm"
        />
        <Button type="submit" disabled={atLimit || (!name.trim() && !locked)} loading={locked}>
          {t('submit')}
        </Button>
      </div>
      {atLimit && (
        <p id={limitId} className="text-caption text-muted-foreground">
          {t('limit', { max: MAX_GM_PARTIES })}
        </p>
      )}
    </form>
  );
}
