'use client';

import * as React from 'react';

import { cn } from '@frontend/lib/utils';

type ImageStatus = 'pending' | 'loaded' | 'error';

const AvatarContext = React.createContext<{
  status: ImageStatus;
  setStatus: (status: ImageStatus) => void;
}>({ status: 'pending', setStatus: () => {} });

/**
 * A picture with a fallback, without Radix's Avatar. Radix only puts the `<img>` on the page once a
 * hidden preload says it loaded: the server's HTML has no image at all, so every page load shows the
 * fallback first and swaps it once the JS runs. Here the `<img>` is in the HTML, on top of the
 * fallback: the browser fetches it right away, and a cached one shows with no flash.
 */
function Avatar({ className, ...props }: React.ComponentProps<'span'>) {
  const [status, setStatus] = React.useState<ImageStatus>('pending');
  const value = React.useMemo(() => ({ status, setStatus }), [status]);

  return (
    <AvatarContext.Provider value={value}>
      <span
        data-slot="avatar"
        className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg', className)}
        {...props}
      />
    </AvatarContext.Provider>
  );
}

// Uploaded images get a new versioned URL on every upload, so the src is used as is and the
// browser can keep the proxy's long-lived cache.
function AvatarImage({
  className,
  src,
  alt,
  onLoad,
  onError,
  ...props
}: React.ComponentProps<'img'>) {
  const { status, setStatus } = React.useContext(AvatarContext);
  const ref = React.useRef<HTMLImageElement>(null);

  // The image may have loaded (or failed) before hydration, when React wasn't listening yet
  React.useLayoutEffect(() => {
    const img = ref.current;
    if (!src) {
      setStatus('error');
    } else if (img?.complete) {
      setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
    } else {
      setStatus('pending');
    }
  }, [src, setStatus]);

  if (!src || status === 'error') return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- user images through our own proxy
    <img
      ref={ref}
      src={src}
      alt={alt}
      data-slot="avatar-image"
      className={cn('absolute inset-0 aspect-square h-full w-full', className)}
      onLoad={(event) => {
        setStatus('loaded');
        onLoad?.(event);
      }}
      onError={(event) => {
        setStatus('error');
        onError?.(event);
      }}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<'span'>) {
  const { status } = React.useContext(AvatarContext);
  if (status === 'loaded') return null;

  return (
    <span
      data-slot="avatar-fallback"
      className={cn('bg-muted flex h-full w-full items-center justify-center', className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
