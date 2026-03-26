'use client';

import * as React from 'react';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { useFileUploader } from '@frontend/context/FileUploaderContext';
import { cn } from '@frontend/lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  autoTimestamp?: boolean;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, autoTimestamp = true, ...props }, ref) => {
  const { lastUploadTimestamp } = useFileUploader();

  const timestampedSrc = React.useMemo(() => {
    if (!src || !autoTimestamp || typeof src !== 'string') return src;
    // Don't append if it's a data URL or already has a similar timestamp (optional)
    if (src.startsWith('data:')) return src;

    return `${src}${src.includes('?') ? '&' : '?'}t=${lastUploadTimestamp}`;
  }, [src, autoTimestamp, lastUploadTimestamp]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full', className)}
      src={timestampedSrc}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'bg-muted flex h-full w-full items-center justify-center rounded-full',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
