'use client';

import { useState } from 'react';

import { getImageProps } from 'next/image';

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

/**
 * One <picture> per slide, so the browser downloads only the screen that fits the viewport:
 * mobile below `sm`, desktop from `sm` up. The first slide is fetched eagerly, it is the
 * largest thing above the fold.
 */
function ShowcaseImage({ slide, locale, alt }: { slide: Slide; locale: string; alt: string }) {
  const first = slide === SLIDES[0];
  const desktop = screenshot(locale, slide, 'desktop');
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...desktop, alt, sizes: '(min-width: 1024px) 760px, 100vw' });
  const {
    props: { srcSet: mobileSrcSet, ...img },
  } = getImageProps({
    ...screenshot(locale, slide, 'mobile'),
    alt,
    sizes: '100vw',
    loading: first ? 'eager' : 'lazy',
    fetchPriority: first ? 'high' : 'auto',
  });

  return (
    <picture>
      <source
        media="(min-width: 640px)"
        srcSet={desktopSrcSet}
        width={desktop.width}
        height={desktop.height}
      />
      <img {...img} srcSet={mobileSrcSet} alt={alt} className="h-auto w-full" />
    </picture>
  );
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
            <span className="text-caption text-muted-foreground tabular-nums" aria-live="polite">
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

        {SLIDES.map((slide) => (
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
              <ShowcaseImage slide={slide} locale={locale} alt={t(`slides.${slide}.alt`)} />
            </figure>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
