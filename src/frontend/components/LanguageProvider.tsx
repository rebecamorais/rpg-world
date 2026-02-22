'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';

import { NextIntlClientProvider } from 'next-intl';

import enMessages from '../../../messages/en.json';
import ptMessages from '../../../messages/pt.json';

const dictionaries: Record<
  string,
  Record<string, string | Record<string, string>>
> = {
  en: enMessages,
  pt: ptMessages,
};

const loadDictionary = async (locale: string) => {
  return dictionaries[locale] || dictionaries['en'];
};

export default function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('NEXT_LOCALE') || 'en';
    }
    return 'en';
  });
  const [messages, setMessages] = useState<
    Record<string, string | Record<string, string>>
  >({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check local storage
    const savedLocale = localStorage.getItem('NEXT_LOCALE') || 'en';

    // 2. Load the dictionary dynamically without breaking Webpack
    loadDictionary(savedLocale)
      .then((dict) => {
        setMessages(dict);
        setIsReady(true);
      })
      .catch((err) => {
        console.error('Error loading dictionary', err);
        setIsReady(true);
      });
  }, []);

  const changeLocale = useCallback(async (newLocale: string) => {
    try {
      const dict = await loadDictionary(newLocale);
      setMessages(dict);
      setLocale(newLocale);
      localStorage.setItem('NEXT_LOCALE', newLocale);

      // Update html lang attribute for accessibility
      document.documentElement.lang = newLocale;
    } catch (err) {
      console.error('Failed to swap dictionary', err);
    }
  }, []);

  useEffect(() => {
    // Provide the global callback to allow components to switch the language
    if (typeof window !== 'undefined') {
      (
        window as unknown as { __changeLocale: (v: string) => void }
      ).__changeLocale = changeLocale;
    }
  }, [changeLocale]);

  if (!isReady) {
    // Avoid flash of untranslated content
    return <div className="bg-background text-foreground min-h-screen" />;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
