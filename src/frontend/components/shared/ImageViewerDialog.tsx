'use client';

import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { useReturnFocus } from '@frontend/hooks/useReturnFocus';
import {
  INITIAL_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  PAN_STEP,
  ZOOM_STEP,
  panBy,
  zoomTo,
} from '@frontend/lib/image-zoom';
import { cn } from '@frontend/lib/utils';

import { fullImageUrl } from '@shared/avatar-files';

/** How much one pixel of wheel movement zooms, relative to the current zoom. */
const WHEEL_SENSITIVITY = 0.002;

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-PAN_STEP, 0],
  ArrowRight: [PAN_STEP, 0],
  ArrowUp: [0, -PAN_STEP],
  ArrowDown: [0, PAN_STEP],
};

interface ImageViewerDialogProps {
  src: string | undefined;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Offers to adjust the image; only for whoever can edit it. */
  onAdjust?: () => void;
}

type Point = { x: number; y: number };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** The image and its controls. Mounted while the dialog is open, so each opening starts over. */
function ZoomStage({ src, alt, onAdjust }: { src: string; alt: string; onAdjust?: () => void }) {
  const t = useTranslations('avatarUpload');
  const fullUrl = fullImageUrl(src);
  // A whole image that can't be loaded falls back to the avatar, silently
  const [fullFailed, setFullFailed] = useState(false);
  const [view, setView] = useState(INITIAL_ZOOM);
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // The fingers (or the mouse) on the image, and how far apart two fingers were last time
  const pointers = useRef(new Map<number, Point>());
  const pinchDistance = useRef(0);

  const viewport = () => stageRef.current?.getBoundingClientRect() ?? new DOMRect();
  /** A point on the screen, measured from the center of the image's area. */
  const fromCenter = ({ x, y }: Point) => {
    const rect = viewport();
    return { x: x - rect.left - rect.width / 2, y: y - rect.top - rect.height / 2 };
  };

  // Native listener: React's onWheel is passive, and without preventDefault the page would scroll
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const focus = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
      setView((current) =>
        zoomTo(current, current.zoom * (1 - event.deltaY * WHEEL_SENSITIVITY), rect, focus),
      );
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    // The context menu swallows the release of a right click, leaving the image stuck to the cursor
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const [first, second] = [...pointers.current.values()];
    if (second) pinchDistance.current = distance(first, second);
    setIsDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);

    const [first, second] = [...pointers.current.values()];
    if (!second) {
      setView((current) => panBy(current, point.x - previous.x, point.y - previous.y, viewport()));
      return;
    }
    const apart = distance(first, second);
    const ratio = apart / pinchDistance.current;
    pinchDistance.current = apart;
    const focus = fromCenter({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 });
    setView((current) => zoomTo(current, current.zoom * ratio, viewport(), focus));
  };

  const onPointerEnd = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) setIsDragging(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const arrow = ARROWS[event.key];
    if (!arrow) return;
    event.preventDefault();
    setView((current) => panBy(current, arrow[0], arrow[1], viewport()));
  };

  const zoomBy = (step: number) =>
    setView((current) => zoomTo(current, current.zoom + step, viewport()));

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        ref={stageRef}
        role="group"
        aria-label={t('viewTitle')}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
        onKeyDown={onKeyDown}
        className={cn(
          'focus-ring bg-background aspect-square max-h-[80vh] w-full touch-none overflow-hidden rounded-lg',
          view.zoom > MIN_ZOOM && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- served by our image proxy as is */}
        <img
          src={fullUrl && !fullFailed ? fullUrl : src}
          alt={alt}
          draggable={false}
          onError={() => setFullFailed(true)}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          className={cn(
            'h-full w-full object-contain select-none',
            !isDragging && 'motion-safe:transition-transform motion-safe:duration-150',
          )}
        />
      </div>

      {/* A solid background: the controls' contrast can't depend on the image behind them.
          aria-disabled, not disabled: a disabled button would drop the keyboard focus at the limit */}
      <div className="bg-background border-border [&_[aria-disabled=true]]:text-muted-foreground flex flex-wrap items-center justify-center gap-1 rounded-lg border p-1 pointer-coarse:gap-2 [&_[aria-disabled=true]]:cursor-not-allowed">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('zoomOut')}
          aria-disabled={view.zoom <= MIN_ZOOM}
          onClick={() => zoomBy(-ZOOM_STEP)}
        >
          <AppIcon name="Minus" size={16} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('zoomIn')}
          aria-disabled={view.zoom >= MAX_ZOOM}
          onClick={() => zoomBy(ZOOM_STEP)}
        >
          <AppIcon name="Plus" size={16} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-disabled={view.zoom <= MIN_ZOOM}
          onClick={() => setView(INITIAL_ZOOM)}
        >
          {t('zoomFit')}
        </Button>
        {onAdjust && (
          <Button type="button" variant="ghost" size="sm" onClick={onAdjust}>
            {t('adjust')}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Shows an image as large as the screen allows, with zoom. */
export function ImageViewerDialog({
  src,
  alt,
  open,
  onOpenChange,
  onAdjust,
}: ImageViewerDialogProps) {
  const t = useTranslations('avatarUpload');
  const { onOpenAutoFocus, onCloseAutoFocus } = useReturnFocus();
  // Waits for the focus to come back, so the crop dialog can give it back to the same place
  const adjustOnClose = useRef(false);

  const adjust =
    onAdjust &&
    (() => {
      adjustOnClose.current = true;
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus(event);
          if (adjustOnClose.current) onAdjust?.();
          adjustOnClose.current = false;
        }}
        // The close button sits over the image: its contrast needs a background of its own
        className="[&>button]:bg-background max-w-[min(90vw,80vh)] border-none bg-transparent p-0 shadow-none [&>button]:top-2 [&>button]:right-2 [&>button]:rounded-full [&>button]:p-1.5"
      >
        <DialogTitle className="sr-only">{t('viewTitle')}</DialogTitle>
        {src ? <ZoomStage src={src} alt={alt} onAdjust={adjust} /> : null}
      </DialogContent>
    </Dialog>
  );
}
