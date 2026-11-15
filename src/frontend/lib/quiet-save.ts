import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { MERGED_BY_KEY } from './character-changes';
import { SaveBatcher } from './save-batcher';

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

/** The sheet as the API sends it. `revision` goes up on every save (see useCharacter). */
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
    this.options.write(() => next);
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
    try {
      const result = await this.options.send(changes);
      const base = this.confirmed;
      if (!base) return;
      this.confirmed = applyChanges(base, changes);
      // Our own save is the next revision: take it, so the Save button that comes after doesn't
      // conflict with this tap. A bigger jump means another device saved too, and that one the
      // Save button must still hear about
      const revision = result?.revision;
      if (typeof revision === 'number' && revision === (base.revision ?? NaN) + 1) {
        this.confirmed = { ...this.confirmed, revision } as Revisioned;
        this.options.write((now) => now && { ...now, revision });
      }
    } catch (error) {
      const base = this.confirmed;
      if (base) this.options.write((now) => now && revertChanges(now, base, changes));
      this.options.onFail(error, changes);
      throw error;
    }
  }
}
