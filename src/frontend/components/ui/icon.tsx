'use client';

import { Icon as Iconify } from '@iconify/react';
import {
  Activity,
  Backpack,
  Book,
  BookMarked,
  BookOpen,
  Bookmark,
  Bug,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Clock,
  Coffee,
  Crosshair,
  Dices,
  Droplet,
  ExternalLink,
  Eye,
  Files,
  Fingerprint,
  Footprints,
  Heart,
  History,
  Hourglass,
  Loader2,
  LogOut,
  LucideProps,
  Mailbox,
  Menu,
  Minus,
  Palette,
  Pencil,
  Plus,
  QrCode,
  Scroll,
  Search,
  Settings2,
  Shield,
  Skull,
  Sparkles,
  Sword,
  Swords,
  Trash2,
  User,
  UserPlus,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

import { cn } from '@frontend/lib/utils';

/**
 * Registry of system icons to ensure they are properly bundled and resolvable
 * in Next.js environment (avoiding tree-shaking issues with dynamic lookup).
 */
const SYSTEM_ICONS = {
  Book,
  BookMarked,
  BookOpen,
  Bookmark,
  Bug,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Clock,
  Coffee,
  Crosshair,
  Dices,
  Droplet,
  ExternalLink,
  Eye,
  Files,
  Fingerprint,
  Footprints,
  Heart,
  History,
  Hourglass,
  Loader2,
  LogOut,
  Mailbox,
  Menu,
  Minus,
  Palette,
  Pencil,
  Plus,
  QrCode,
  Search,
  Settings2,
  Shield,
  Skull,
  Sparkles,
  Sword,
  Swords,
  Trash2,
  User,
  UserPlus,
  Wand2,
  X,
  Zap,
  Activity,
  Scroll,
  Backpack,
} as const;

const ICON_SIZE_PRESETS = {
  xs: 16,
  sm: 18,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof ICON_SIZE_PRESETS | number;

export type IconName = keyof typeof SYSTEM_ICONS | string;

interface IconProps extends Omit<LucideProps, 'size'> {
  name: IconName;
  variant?: 'system' | 'game';
  size?: IconSize;
}

/**
 * AppIcon: A unified registry for application icons.
 * - 'system': Uses Lucide React icons for UI and platform elements.
 * - 'game': Uses Game Icons via Iconify (@iconify-json/game-icons) for immersive RPG elements.
 */
export function AppIcon({
  name,
  variant = 'system',
  className,
  size = 'sm',
  strokeWidth = 2.5, // Standardized stroke width
  ...props
}: IconProps) {
  // Resolve size from preset or number
  const resolvedSize =
    typeof size === 'string' ? ICON_SIZE_PRESETS[size as keyof typeof ICON_SIZE_PRESETS] : size;

  if (variant === 'game') {
    // Only pass compatible props to Iconify
    const { absoluteStrokeWidth: _, ...iconifyProps } = props as Record<string, unknown>;

    return (
      <Iconify
        icon={`game-icons:${name}`}
        className={cn('inline-block', className)}
        width={resolvedSize}
        height={resolvedSize}
        {...iconifyProps}
      />
    );
  }

  // Fallback to Lucide system icons using the static registry
  const LucideIcon =
    variant === 'system' && name in SYSTEM_ICONS
      ? SYSTEM_ICONS[name as keyof typeof SYSTEM_ICONS]
      : null;

  if (!LucideIcon) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[AppIcon] Icon "${name}" not found in local registry.`);
    }
    return null;
  }

  return (
    <LucideIcon
      className={cn(className)}
      size={resolvedSize}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
