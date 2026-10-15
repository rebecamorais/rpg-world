'use client';

import { useState } from 'react';

import Image from 'next/image';

import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import SHOWCASE_SIZES from '@frontend/constants/showcase.generated.json';

// Screens captured by scripts/capture-showcase.ts, in the order they are shown
const SLIDES = ['sheet', 'spellbook', 'search', 'lore'] as const;
type Slide = (typeof SLIDES)[number];

function screenshot(locale: string, slide: Slide, device: 'desktop' | 'mobile') {
  const src = `/showcase/${locale === 'pt' ? 'pt' : 'en'}/${slide}-${device}.webp`;
  return { src, ...SHOWCASE_SIZES[src as keyof typeof SHOWCASE_SIZES] };
}

/** Real screens of the app as slides: tabs to pick one, arrows to step through them. */
export function FeatureShowcase() {
  const t = useTranslations('features.showcase');
  const locale = useLocale();
  const [current, setCurrent] = useState<Slide>(SLIDES[0]);
  const index = SLIDES.indexOf(current);

  const step = (delta: number) =>
    setCurrent(SLIDES[(index + delta + SLIDES.length) % SLIDES.length]);

  return (
    <Tabs value={current} onValueChange={(value) => setCurrent(value as Slide)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-muted/40 flex h-auto flex-wrap gap-1 p-1">
            {SLIDES.map((slide) => (
              <TabsTrigger key={slide} value={slide}>
                {t(`slides.${slide}.tab`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2">
            <span className="text-caption text-muted-foreground tabular-nums" aria-hidden="true">
              {t('position', { current: index + 1, total: SLIDES.length })}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('previous')}
              onClick={() => step(-1)}
            >
              <AppIcon name="ChevronLeft" size={16} />
            </Button>
            <Button variant="outline" size="icon" aria-label={t('next')} onClick={() => step(1)}>
              <AppIcon name="ChevronRight" size={16} />
            </Button>
          </div>
        </div>

        {SLIDES.map((slide) => {
          const desktop = screenshot(locale, slide, 'desktop');
          const mobile = screenshot(locale, slide, 'mobile');
          return (
            <TabsContent
              key={slide}
              value={slide}
              className="motion-safe:animate-fade-in mt-0 grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-center"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-title">{t(`slides.${slide}.title`)}</h3>
                <p className="text-muted-foreground">{t(`slides.${slide}.description`)}</p>
              </div>
              <figure className="border-border bg-card overflow-hidden rounded-xl border shadow-2xl">
                {/* Mobile screens on small viewports, desktop screens from sm up */}
                <Image
                  src={mobile.src}
                  width={mobile.width}
                  height={mobile.height}
                  alt={t(`slides.${slide}.alt`)}
                  sizes="100vw"
                  className="h-auto w-full sm:hidden"
                  priority={slide === SLIDES[0]}
                />
                <Image
                  src={desktop.src}
                  width={desktop.width}
                  height={desktop.height}
                  alt={t(`slides.${slide}.alt`)}
                  sizes="(min-width: 1024px) 760px, 100vw"
                  className="hidden h-auto w-full sm:block"
                  priority={slide === SLIDES[0]}
                />
              </figure>
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
}
