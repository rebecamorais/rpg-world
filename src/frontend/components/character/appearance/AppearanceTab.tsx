'use client';

import { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { SaveCharacterButton } from '@frontend/components/character/sheet/SaveControls';
import ImageUpload from '@frontend/components/shared/ImageUpload';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { SectionCard } from '@frontend/components/ui/section-card';
import {
  useCharacterActions,
  useCharacterMeta,
  useLoadedCharacter,
} from '@frontend/context/CharacterContext';
import AppLink from '@frontend/demo/AppLink';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

import { AccentColorPicker } from './AccentColorPicker';
import { AppearancePreview } from './AppearancePreview';
import { SheetBackgroundSettings } from './SheetBackgroundSettings';

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title>{title}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        <p className="text-caption text-muted-foreground">{hint}</p>
        {children}
      </SectionCard.Body>
    </SectionCard>
  );
}

/**
 * How the sheet looks. Opened by the gear on the sheet and left out of its menu. The page exists
 * only under the owner's route, so whoever only reads a sheet never reaches it.
 */
export function AppearanceTab() {
  const t = useTranslations('characterAppearance');
  const { id } = useCharacterMeta();
  const { avatarUrl, system } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const { pagesPath } = useSheetSource(id, system);

  return (
    <PageContainer
      title={t('title')}
      description={t('description')}
      titleClassName="text-character-flare"
      eyebrow={
        <AppLink href={pagesPath} className="focus-ring hover:text-foreground underline">
          {t('back')}
        </AppLink>
      }
      actions={<SaveCharacterButton />}
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Phones: on top and pinned, so each choice is seen while scrolling the controls */}
        <div className="sticky top-2 z-10 lg:order-last">
          <AppearancePreview />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Section title={t('colorTitle')} hint={t('colorHint')}>
            <AccentColorPicker />
          </Section>
          <Section title={t('imageTitle')} hint={t('imageHint')}>
            <div className="self-start">
              <ImageUpload
                currentUrl={avatarUrl}
                target="character"
                targetId={id}
                onUploadSuccess={(url) => update({ avatarUrl: url })}
                keepFullImage
              />
            </div>
          </Section>
          <Section title={t('backgroundTitle')} hint={t('backgroundHint')}>
            <SheetBackgroundSettings />
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
