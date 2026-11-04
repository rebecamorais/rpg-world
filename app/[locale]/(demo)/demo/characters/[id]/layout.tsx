import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { setRequestLocale } from 'next-intl/server';

import { CharacterSheetShell } from '@frontend/components/character/sheet/CharacterSheetShell';
import { CharacterProvider } from '@frontend/context/CharacterContext';
import { DemoInspiration } from '@frontend/demo/DemoInspiration';
import { buildDemoData } from '@frontend/demo/data/build';

type Params = Promise<{ locale: string; id: string }>;

async function load({ locale, id }: { locale: string; id: string }) {
  const data = buildDemoData(locale === 'pt' ? 'pt' : 'en');
  const character = Object.hasOwn(data.characters, id) ? data.characters[id] : undefined;
  return { character, inspiration: data.inspirations[id] };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { character } = await load(await params);
  if (!character) return {};
  return {
    title: { template: `%s · ${character.name} · RPG World`, default: String(character.name) },
  };
}

export default async function DemoCharacterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const resolved = await params;
  setRequestLocale(resolved.locale);
  const { character, inspiration } = await load(resolved);
  if (!character) notFound();

  return (
    <CharacterProvider initialCharacter={character}>
      <CharacterSheetShell>
        {children}
        {inspiration && <DemoInspiration inspiration={inspiration} />}
      </CharacterSheetShell>
    </CharacterProvider>
  );
}
