'use client';

import { useEffect } from 'react';

import { useProfile } from '@/frontend/hooks/useProfile';

const DEFAULT_PRIMARY_COLOR = '#663399';

/**
 * Reads the user's `primaryColor` from their profile and applies it
 * as the `--primary` CSS variable on the document root.
 * This makes the chosen color propagate to every Tailwind `primary-*` utility.
 */
export default function ThemeProvider() {
  const { profile } = useProfile();

  useEffect(() => {
    const color = profile?.primaryColor ?? DEFAULT_PRIMARY_COLOR;
    document.documentElement.style.setProperty('--primary', color);
  }, [profile?.primaryColor]);

  // Renders nothing — purely a side-effect component
  return null;
}
