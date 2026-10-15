'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

/*
 * Which fields of a form hold text that isn't a valid value yet. Fields report themselves
 * (see NumberInput); the form reads `hasErrors` to hold its save until they're fixed.
 * Outside a provider, reporting does nothing.
 */

interface FieldValidity {
  hasErrors: boolean;
  report: (field: string, invalid: boolean) => void;
}

const FieldValidityContext = createContext<FieldValidity | null>(null);

export function FieldValidityProvider({ children }: { children: ReactNode }) {
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(() => new Set());

  const report = useCallback((field: string, isInvalid: boolean) => {
    setInvalid((prev) => {
      if (prev.has(field) === isInvalid) return prev;
      const next = new Set(prev);
      if (isInvalid) next.add(field);
      else next.delete(field);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ hasErrors: invalid.size > 0, report }), [invalid, report]);
  return <FieldValidityContext.Provider value={value}>{children}</FieldValidityContext.Provider>;
}

/** Whether any field in the surrounding form is invalid (false outside a provider). */
export function useHasFieldErrors(): boolean {
  return useContext(FieldValidityContext)?.hasErrors ?? false;
}

/** Reports this field's validity to the surrounding form while it is mounted. */
export function useReportFieldValidity(invalid: boolean) {
  const field = useId();
  const report = useContext(FieldValidityContext)?.report;

  useEffect(() => {
    report?.(field, invalid);
  }, [report, field, invalid]);

  // Unmounting (a dialog closing, a tab change) never leaves the form blocked
  useEffect(() => () => report?.(field, false), [report, field]);
}
