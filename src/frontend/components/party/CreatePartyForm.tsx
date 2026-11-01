'use client';

import { FormEvent, useId, useState } from 'react';

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
  const router = useRouter();
  const [name, setName] = useState('');
  const { createParty, isCreating } = useParties();
  const atLimit = gmCount >= MAX_GM_PARTIES;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const { id: partyId } = await createParty(name);
      toast.success(t('success'));
      router.push(`/parties/${partyId}`);
    } catch {
      // useParties already shows the error
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
          maxLength={60}
          required
          disabled={atLimit}
          className="max-w-sm"
        />
        <Button type="submit" disabled={atLimit || !name.trim()} loading={isCreating}>
          {t('submit')}
        </Button>
      </div>
      {atLimit && (
        <p className="text-label text-muted-foreground">{t('limit', { max: MAX_GM_PARTIES })}</p>
      )}
    </form>
  );
}
