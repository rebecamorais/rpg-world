'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

/** A change to the draft: the fields to set, or a function of the current draft that returns them. */
export type DraftPatch<T> = Partial<T> | ((draft: T) => Partial<T>);

/** The fields a patch sets on `draft`. */
export const resolvePatch = <T>(patch: DraftPatch<T>, draft: T): Partial<T> =>
  typeof patch === 'function' ? patch(draft) : patch;

type Edits<T> = Partial<T> | null;

type DraftAction<T> =
  | { type: 'update'; patch: DraftPatch<T>; base: T }
  | { type: 'commit'; saved: Edits<T> }
  | { type: 'saved'; patch: DraftPatch<T>; saved: Partial<T>; base: T }
  | { type: 'discard' };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function reducer<T>(edits: Edits<T>, action: DraftAction<T>): Edits<T> {
  switch (action.type) {
    case 'update': {
      const patch = resolvePatch(action.patch, { ...action.base, ...edits });
      return { ...edits, ...patch };
    }
    case 'commit': {
      if (edits === action.saved || !edits) return null;
      // Keeps what the user typed while the save was in flight. Compared by value: a background
      // save landing meanwhile rebuilds the edits object without changing what is in it
      const saved: Partial<T> = action.saved ?? {};
      const rest: Partial<T> = {};
      for (const [key, value] of Object.entries(edits) as [keyof T, T[keyof T]][]) {
        if (!(key in saved) || !same(value, saved[key])) rest[key] = value;
      }
      return Object.keys(rest).length > 0 ? rest : null;
    }
    case 'saved': {
      if (!edits) return edits;
      // A saved field that was also edited keeps the edit, with the patch applied on top of it
      // (a hit die tap keeps the unsaved die). It stops being an edit once it matches what was saved
      const rebased = resolvePatch(action.patch, { ...action.base, ...edits });
      const rest: Partial<T> = {};
      for (const [key, value] of Object.entries(edits) as [keyof T, T[keyof T]][]) {
        if (!(key in action.saved)) rest[key] = value;
        else if (!same(rebased[key], action.saved[key])) rest[key] = rebased[key];
      }
      return Object.keys(rest).length > 0 ? rest : null;
    }
    case 'discard':
      return null;
  }
}

/**
 * Local edits on top of server data. The draft is derived (server data + edits), so a refetch
 * shows up right away without overwriting what the user changed, and `update` / `commit` /
 * `discard` keep the same identity across renders.
 */
export function useDraft<T extends object>(server: T | undefined) {
  const [edits, dispatch] = useReducer(reducer<T>, null);

  const draft = useMemo(() => (server ? ({ ...server, ...edits } as T) : null), [server, edits]);

  // Read by the stable callbacks below; refs are only written after render
  const serverRef = useRef(server);
  const editsRef = useRef(edits);
  useEffect(() => {
    serverRef.current = server;
    editsRef.current = edits;
  });

  /** Ignored until the server data arrives. */
  const update = useCallback((patch: DraftPatch<T>) => {
    if (serverRef.current) dispatch({ type: 'update', patch, base: serverRef.current });
  }, []);

  /**
   * Saves with `persist` (the whole draft, and just the edits on top of `base`) and, once it
   * resolves, drops the edits that were saved. The caller's mutation should put the saved data in
   * the query cache, which becomes the draft.
   */
  const commit = useCallback(
    async (persist: (draft: T, edits: Partial<T>, base: T) => Promise<unknown>) => {
      const base = serverRef.current;
      const saved = editsRef.current;
      if (!base) return;
      await persist({ ...base, ...saved } as T, saved ?? {}, base);
      dispatch({ type: 'commit', saved });
    },
    [],
  );

  /**
   * Saves `patch` right away, applied to the server data and not to the draft, so the other edits
   * stay pending. `persist` gets the server data with the patch applied, the fields the patch set,
   * and the server data it started from. Once it resolves, those fields stop being edits: the
   * server copy has them now (an edited field keeps the rest of its edit, see 'saved').
   */
  const saveFields = useCallback(
    async (
      patch: DraftPatch<T>,
      persist: (saved: T, fields: Partial<T>, base: T) => Promise<unknown>,
    ) => {
      const base = serverRef.current;
      if (!base) return;
      const fields = resolvePatch(patch, base);
      await persist({ ...base, ...fields } as T, fields, base);
      dispatch({ type: 'saved', patch, saved: fields, base });
    },
    [],
  );

  const discard = useCallback(() => dispatch({ type: 'discard' }), []);

  return { draft, isDirty: edits !== null, update, commit, saveFields, discard };
}
