'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { useCurrentUser } from '@/frontend/context/UserContext';
import { useCharacters } from '@/frontend/hooks/useCharacters';

export default function CharacterList() {
  const { currentUser } = useCurrentUser();
  const t = useTranslations('characters');
  const { characters, isLoading, error } = useCharacters(currentUser);

  if (!currentUser) return null;

  if (error) {
    return (
      <div className="text-destructive p-6 text-center">
        <p>{t('loadError', { message: error.message })}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground p-6 text-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-lg border p-6 text-center">
        <p>{t('emptyState')}</p>
        <Link
          href="/characters/new"
          className="text-foreground mt-3 inline-block text-sm font-medium hover:underline"
        >
          {t('createFirst')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">{t('title')}</h2>
        <Link
          href="/characters/new"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          {t('newButton')}
        </Link>
      </div>
      <ul className="divide-border divide-y">
        {characters.map((c) => (
          <li key={c.id}>
            <Link
              href={`/system/${c.system}/character/${c.id}`}
              className="hover:bg-muted -mx-2 block rounded px-2 py-3"
            >
              <span className="text-foreground font-medium">{c.name}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                {t('level', { level: c.level })}
                {c.characterClass ? ` · ${c.characterClass}` : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
