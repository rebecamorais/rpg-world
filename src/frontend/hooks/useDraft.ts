'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

/** A change to the draft: the fields to set, or a function of the current draft that returns them. */
export type DraftPatch<T> = Partial<T> | ((draft: T) => Partial<T>);

type Edits<T> = Partial<T> | null;

type DraftAction<T> =
  | { type: 'update'; patch: DraftPatch<T>; base: T }
  | { type: 'commit'; saved: Edits<T> }
  | { type: 'discard' };

function reducer<T>(edits: Edits<T>, action: DraftAction<T>): Edits<T> {
  switch (action.type) {
    case 'update': {
      const current = { ...action.base, ...edits };
      const patch = typeof action.patch === 'function' ? action.patch(current) : action.patch;
      return { ...edits, ...patch };
    }
    case 'commit':
      // Keeps what the user typed while the save was in flight
      return edits === action.saved ? null : edits;
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

  const discard = useCallback(() => dispatch({ type: 'discard' }), []);

  return { draft, isDirty: edits !== null, update, commit, discard };
}
