import { useState } from 'react';

import { toast } from 'sonner';

import { useParty } from '@frontend/hooks/useParty';

import type { PendingAnswers } from './PartyRequests';

type Answer = 'approve' | 'remove';

/**
 * The GM's answers to people (approve, decline, cancel an invite, remove a player), one row at a
 * time: the row waits on its own request while the others stay usable, and a toast says what
 * happened, since the row just disappears.
 */
export function useMemberAnswers(partyId: string) {
  const { acceptMember, removeMember } = useParty(partyId);
  const [pending, setPending] = useState<PendingAnswers>(() => new Map());

  const answer = async (userId: string, kind: Answer, success: string) => {
    setPending((current) => new Map(current).set(userId, kind));
    try {
      await (kind === 'approve' ? acceptMember : removeMember).mutateAsync(userId);
      toast.success(success);
    } catch {
      // useParty already shows the error
    } finally {
      setPending((current) => {
        const next = new Map(current);
        next.delete(userId);
        return next;
      });
    }
  };

  return { pending, answer };
}
