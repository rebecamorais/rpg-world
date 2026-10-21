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
  Ellipsis,
  ExternalLink,
  Eye,
  Files,
  Fingerprint,
  Footprints,
  Heart,
  History,
  Hourglass,
  Languages,
  Loader2,
  LogOut,
  LucideProps,
  Mailbox,
  Maximize2,
  Menu,
  Minus,
  Palette,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  Scroll,
  Search,
  Settings2,
  Shield,
  Skull,
  Sparkles,
  Sword,
  Swords,
  Trash2,
  TriangleAlert,
  User,
  UserPlus,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

import GAME_ICONS from '@frontend/constants/game-icons.generated.json';
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
  Ellipsis,
  ExternalLink,
  Eye,
  Files,
  Fingerprint,
  Footprints,
  Heart,
  History,
  Languages,
  Hourglass,
  Loader2,
  LogOut,
  Mailbox,
  Maximize2,
  Menu,
  Minus,
  Palette,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  Settings2,
  Shield,
  Skull,
  Sparkles,
  Sword,
  Swords,
  Trash2,
  TriangleAlert,
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
 * - 'game': Uses Game Icons via Iconify for immersive RPG elements. Their SVG data is bundled
 *   (`npm run icons` regenerates `game-icons.generated.json`), so nothing is fetched at runtime.
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
    const icon = GAME_ICONS[name as keyof typeof GAME_ICONS];
    if (!icon) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[AppIcon] Game icon "${name}" is not bundled. Run \`npm run icons\`.`);
      }
      return null;
    }

    // Only pass compatible props to Iconify
    const { absoluteStrokeWidth: _, ...iconifyProps } = props as Record<string, unknown>;

    return (
      <Iconify
        icon={icon}
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
