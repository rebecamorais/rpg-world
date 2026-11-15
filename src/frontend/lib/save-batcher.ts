import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { MERGED_BY_KEY } from './character-changes';

type Changes = Partial<DnD5eCharacter>;

/** `later` on top of `earlier`; the maps the server merges key by key are merged the same way. */
export function mergeChanges(earlier: Changes, later: Changes): Changes {
  const merged: Record<string, unknown> = { ...earlier, ...later };
  for (const key of MERGED_BY_KEY) {
    if (earlier[key] && later[key]) merged[key] = { ...earlier[key], ...later[key] };
  }
  return merged as Changes;
}

interface Batch {
  changes: Changes;
  waiters: { resolve: () => void; reject: (error: unknown) => void }[];
}

/**
 * Sends changes one request at a time: the server rewrites the sheet's data on each save, so two in
 * flight together could undo each other. What comes in while one is in flight joins a single
 * batch, sent when it ends. `flush` sends that batch at once, for a page that is going away.
 */
export class SaveBatcher {
  private inFlight = false;
  private next: Batch | null = null;

  constructor(
    private readonly send: (changes: Changes) => Promise<unknown>,
    /** Called once per failed request, whatever the number of changes in it. */
    private readonly onError: (error: unknown) => void,
  ) {}

  push(changes: Changes): Promise<void> {
    return new Promise((resolve, reject) => {
      this.next = this.next
        ? { ...this.next, changes: mergeChanges(this.next.changes, changes) }
        : { changes, waiters: [] };
      this.next.waiters.push({ resolve, reject });
      if (!this.inFlight) this.run();
    });
  }

  /** Sends what is waiting now, without waiting for the request in flight. */
  flush(): void {
    const batch = this.next;
    if (!batch) return;
    this.next = null;
    void this.deliver(batch);
  }

  private run(): void {
    const batch = this.next;
    if (!batch) return;
    this.next = null;
    this.inFlight = true;
    void this.deliver(batch).finally(() => {
      this.inFlight = false;
      this.run();
    });
  }

  private async deliver(batch: Batch): Promise<void> {
    try {
      await this.send(batch.changes);
      for (const waiter of batch.waiters) waiter.resolve();
    } catch (error) {
      this.onError(error);
      for (const waiter of batch.waiters) waiter.reject(error);
    }
  }
}
