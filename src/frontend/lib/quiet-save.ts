import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { MERGED_BY_KEY } from './character-changes';
import { SaveBatcher, mergeChanges } from './save-batcher';

type Changes = Partial<DnD5eCharacter>;

const mergedByKey = (key: string) => (MERGED_BY_KEY as readonly string[]).includes(key);

/** `character` with `changes` on top, the maps the server merges key by key merged the same way. */
export function applyChanges(character: DnD5eCharacter, changes: Changes): DnD5eCharacter {
  const next: Record<string, unknown> = { ...character };
  for (const [key, value] of Object.entries(changes)) {
    const before = next[key];
    next[key] =
      mergedByKey(key) && value && typeof value === 'object'
        ? { ...(before as object | undefined), ...value }
        : value;
  }
  return next as unknown as DnD5eCharacter;
}

/**
 * `current` with what `changes` set put back as `saved` has it: a save that failed stops showing
 * on screen, and nothing else changes. In the merged maps only the keys sent go back (a failed tap
 * on one resource box leaves the others as they are).
 */
export function revertChanges(
  current: DnD5eCharacter,
  saved: DnD5eCharacter,
  changes: Changes,
): DnD5eCharacter {
  const next: Record<string, unknown> = { ...current };
  const before = saved as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(changes)) {
    if (mergedByKey(key) && value && typeof value === 'object') {
      const map: Record<string, unknown> = { ...(next[key] as object | undefined) };
      const savedMap = (before[key] ?? {}) as Record<string, unknown>;
      for (const entry of Object.keys(value)) {
        if (entry in savedMap) map[entry] = savedMap[entry];
        else delete map[entry];
      }
      next[key] = map;
    } else if (key in before) {
      next[key] = before[key];
    } else {
      delete next[key];
    }
  }
  return next as unknown as DnD5eCharacter;
}

/**
 * `changes` without what `later` also writes (whole fields, or single keys of the merged maps).
 * A failed save must not put back a field a later save still on its way is writing: if that one
 * succeeds, the screen would end on the older value.
 */
export function withoutLaterKeys(changes: Changes, later: Changes): Changes {
  const kept: Record<string, unknown> = {};
  const after = later as Record<string, unknown>;
  for (const [key, value] of Object.entries(changes)) {
    if (!(key in after)) {
      kept[key] = value;
    } else if (mergedByKey(key) && value && typeof value === 'object') {
      const laterMap = (after[key] ?? {}) as Record<string, unknown>;
      const rest = Object.entries(value).filter(([entry]) => !(entry in laterMap));
      if (rest.length > 0) kept[key] = Object.fromEntries(rest);
    }
  }
  return kept as Changes;
}

/**
 * The sheet as the API sends it. `revision` goes up only when the sheet's draft fields are saved
 * (the Save button); the background saves of play don't move it.
 */
export type Revisioned = DnD5eCharacter & { revision?: number };

/** What a successful PUT answers: the sheet's new revision, once the server tracks it. */
export interface SaveResult {
  revision?: number;
}

interface QuietSaverOptions {
  /** Sends the changes (a PUT). */
  send: (changes: Changes) => Promise<SaveResult | undefined>;
  /** The sheet as shown now (the query cache). */
  read: () => Revisioned | undefined;
  /** Changes the sheet as shown. */
  write: (update: (now: Revisioned | undefined) => Revisioned | undefined) => void;
  /** Called once per failed request, with what it carried. */
  onFail: (error: unknown, changes: Changes) => void;
}

/**
 * The background saves of what changes during play. Each change shows at once and goes to the
 * server one request at a time (SaveBatcher). It keeps the server's copy under the saves still
 * on their way: a failed save puts its fields back as the server has them (not as the screen
 * showed them), so offline the screen never shows what the server doesn't have.
 */
export class QuietSaver {
  private confirmed: Revisioned | undefined;
  private pending = 0;
  /** Requests on their way, oldest first, and what waits for the next one. */
  private inFlight: Changes[] = [];
  private queued: Changes | null = null;
  private readonly batcher: SaveBatcher;

  constructor(private readonly options: QuietSaverOptions) {
    // Errors are handled in deliver, with the changes at hand
    this.batcher = new SaveBatcher(
      (changes) => this.deliver(changes),
      () => {},
    );
  }

  /** Shows `next` at once and saves `changes`; rejects when that save fails. */
  push(next: DnD5eCharacter, changes: Changes): Promise<void> {
    // With nothing else on its way, what is shown is what the server has
    if (this.pending === 0) this.confirmed = this.options.read();
    this.pending += 1;
    // Mirrors the batcher's waiting batch; set before push, which may start sending at once
    this.queued = this.queued ? mergeChanges(this.queued, changes) : changes;
    // `next` may come from a render before a Save landed: keep the newer revision of the cache
    this.options.write((now) => keepRevision(next as Revisioned, now));
    return this.batcher.push(changes).finally(() => {
      this.pending -= 1;
    });
  }

  settled(): Promise<void> {
    return this.batcher.settled();
  }

  flush(): void {
    this.batcher.flush();
  }

  private async deliver(changes: Changes): Promise<void> {
    // The batcher hands over its whole waiting batch: nothing waits anymore
    this.queued = null;
    this.inFlight.push(changes);
    try {
      await this.options.send(changes);
      // The revision in the answer is not taken: these saves don't move it, so a bigger one means
      // a Save (ours or another device's) landed, and only the Save button may adopt it
      const base = this.confirmed;
      if (base) this.confirmed = applyChanges(base, changes);
    } catch (error) {
      const later = [...this.inFlight.slice(this.inFlight.indexOf(changes) + 1), this.queued]
        .filter((batch): batch is Changes => !!batch)
        .reduce<Changes>(mergeChanges, {});
      // What a later save still writes stays as that save sends it; "Try again" leaves it alone too
      const failed = withoutLaterKeys(changes, later);
      const base = this.confirmed;
      if (base) this.options.write((now) => now && revertChanges(now, base, failed));
      this.options.onFail(error, failed);
      throw error;
    } finally {
      this.inFlight.splice(this.inFlight.indexOf(changes), 1);
    }
  }
}

/** `next`, with the cache's revision when that one is newer: a revision never goes back. */
function keepRevision(next: Revisioned, now: Revisioned | undefined): Revisioned {
  const kept = now?.revision;
  if (typeof kept !== 'number' || (typeof next.revision === 'number' && next.revision >= kept)) {
    return next;
  }
  return { ...next, revision: kept };
}

/**
 * What the failed saves sharing one error toast carried. Each new failure replaces the toast and
 * its "Try again", so that one must send the earlier failures too.
 */
export class FailedChanges {
  private changes: Changes = {};

  add(changes: Changes): void {
    this.changes = mergeChanges(this.changes, changes);
  }

  /** A newer save of a field wins over the failed value "Try again" would send for it. */
  supersede(changes: Changes): void {
    this.changes = withoutLaterKeys(this.changes, changes);
  }

  /** What to send again, emptied. */
  take(): Changes {
    const all = this.changes;
    this.changes = {};
    return all;
  }
}
