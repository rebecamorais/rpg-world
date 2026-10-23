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

import { GAME_ICON_NAMES } from '@frontend/constants/game-icon-names.generated';
import gameIconSprite from '@frontend/constants/game-icons.svg';
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
 * - 'game': Game Icons for immersive RPG elements, drawn from one SVG sprite (`npm run icons`
 *   regenerates it). Their paths stay out of the JS bundle; Next serves the sprite with a hashed,
 *   immutable URL, so the browser keeps it.
 * No hooks: renders on the server too.
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
    if (!GAME_ICON_NAMES.has(name)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[AppIcon] Game icon "${name}" is not in the sprite. Run \`npm run icons\`.`);
      }
      return null;
    }

    // Lucide-only props have no meaning on the sprite
    const { absoluteStrokeWidth: _, ...svgProps } = props;

    return (
      <svg
        aria-hidden="true"
        width={resolvedSize}
        height={resolvedSize}
        className={cn('inline-block', className)}
        {...svgProps}
      >
        <use href={`${gameIconSprite.src}#${name}`} />
      </svg>
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
