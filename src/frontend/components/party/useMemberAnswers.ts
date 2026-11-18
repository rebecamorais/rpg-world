import { useState } from 'react';

import { toast } from 'sonner';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useParty } from '@frontend/hooks/useParty';
import { statusOf } from '@frontend/lib/error-message';

import type { PendingAnswers } from './PartyRequests';

type Answer = 'approve' | 'remove';

/** What the toast says: it worked, or the person was no longer there to answer. */
interface Outcome {
  success: string;
  gone: string;
}

/**
 * The GM's answers to people (approve, decline, cancel an invite, remove a player), one row at a
 * time: the row waits on its own request while the others stay usable, and a toast says what
 * happened, since the row just disappears. When the person was no longer there (they left, or
 * withdrew while the page was open) the API answers 404: that says so, not "party not found".
 * Resolves to whether the row is gone (answered, or already gone).
 */
export function useMemberAnswers(partyId: string) {
  const { acceptMember, removeMember } = useParty(partyId);
  const { getErrorMessage } = useErrorMessage();
  const [pending, setPending] = useState<PendingAnswers>(() => new Map());

  const answer = async (userId: string, kind: Answer, outcome: Outcome): Promise<boolean> => {
    setPending((current) => new Map(current).set(userId, kind));
    try {
      await (kind === 'approve' ? acceptMember : removeMember).mutateAsync(userId);
      toast.success(outcome.success);
      return true;
    } catch (err) {
      // useParty reloads the party either way, so the row goes away
      if (statusOf(err) === 404) {
        toast(outcome.gone);
        return true;
      }
      toast.error(getErrorMessage(err));
      return false;
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
