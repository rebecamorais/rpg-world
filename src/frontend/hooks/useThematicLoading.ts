'use client';

import { useCallback, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

const ROTATION_INTERVAL_MS = 3500;

/**
 * useThematicLoading: A hook that handles localized and randomized RPG loading messages,
 * rotating them periodically while active.
 *
 * @param message - Optional override message.
 * @param thematic - Whether to use randomized thematic messages from loadingMessages namespace.
 * @returns The message string or null.
 */
export function useThematicLoading(message?: string, thematic: boolean = true) {
  // Using base translations to be more robust against namespace resolution issues
  const t = useTranslations();

  // Use state ONLY for the randomized message to avoid hydration mismatch
  const [randomMessage, setRandomMessage] = useState<string | null>(null);

  const pickRandom = useCallback(() => {
    try {
      // Accessing top-level loadingMessages. Object.values works for both arrays and objects.
      const messagesData = t.raw('loadingMessages') as Record<string, string> | string[];
      const messages = Object.values(messagesData);

      if (messages.length > 0) {
        const randomIndex = Math.floor(Math.random() * messages.length);
        setRandomMessage(messages[randomIndex]);
      }
    } catch {
      // Fail silently if there's an issue with translation structure
    }
  }, [t]);

  useEffect(() => {
    // If we have an explicit message, we don't need to do any randomization or intervals
    if (message || !thematic) return;

    // Use setTimeout(0) for the initial pick to avoid synchronous setState in effect body
    // (satisfies react-hooks/set-state-in-effect)
    const initialPickTimeout = setTimeout(pickRandom, 0);
    const rotationInterval = setInterval(pickRandom, ROTATION_INTERVAL_MS);

    return () => {
      clearTimeout(initialPickTimeout);
      clearInterval(rotationInterval);
    };
  }, [message, thematic, pickRandom]);

  // Derived state: explicit message takes precedence over randomized one
  return message || randomMessage;
}
