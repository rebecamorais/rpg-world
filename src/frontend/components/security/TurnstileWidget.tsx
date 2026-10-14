'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

const SCRIPT_ID = 'cloudflare-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Token state for a form protected by Turnstile. Render `<TurnstileWidget key={resetKey} />`
 * and call `reset()` after a failed submission: tokens are single-use, so a new key remounts
 * the widget with a fresh challenge. The server action must verify the token with
 * `TurnstileService` before doing any work.
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const reset = useCallback(() => {
    setToken(null);
    setResetKey((key) => key + 1);
  }, []);

  return { token, setToken, resetKey, reset };
}

export function TurnstileWidget({
  onTokenChange,
}: {
  onTokenChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [unavailable, setUnavailable] = useState(false);
  const { getMessage } = useErrorMessage();

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let isMounted = true;
    let widgetId: string | null = null;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile || widgetId) return;
      try {
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
          callback: (token: string) => onTokenChangeRef.current(token),
          'expired-callback': () => onTokenChangeRef.current(null),
          'error-callback': () => onTokenChangeRef.current(null),
        });
      } catch (e) {
        console.warn('Turnstile render error:', e);
        setUnavailable(true);
      }
    };

    // Blocked by a content blocker, offline, or refused by the CSP: without this the submit
    // button would stay disabled with no explanation
    const handleScriptError = () => {
      // Drop the failed tag so the next mount (e.g. after reset) tries to load it again
      document.getElementById(SCRIPT_ID)?.remove();
      if (isMounted) setUnavailable(true);
    };

    // The script may already have been added by another form or a previous navigation
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (window.turnstile) {
      renderWidget();
    } else if (script) {
      script.addEventListener('load', renderWidget);
      script.addEventListener('error', handleScriptError);
    } else {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderWidget);
      script.addEventListener('error', handleScriptError);
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
      script?.removeEventListener('load', renderWidget);
      script?.removeEventListener('error', handleScriptError);
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {
          console.error('Error removing Turnstile widget:', e);
        }
      }
    };
  }, []);

  return (
    <div className="my-2 flex flex-col items-center gap-2">
      <div ref={containerRef} />
      {unavailable && (
        <p role="alert" className="text-danger-flare text-center text-sm">
          {getMessage('security_widget_unavailable')}
        </p>
      )}
    </div>
  );
}
