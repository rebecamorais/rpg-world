import Link from 'next/link';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
  isSubItem?: boolean;
  icon?: string;
  /** The icon alone, in the collapsed menu: the label names the link and shows on hover. */
  iconOnly?: boolean;
}

export function NavItem({ href, label, isActive, isSubItem, icon, iconOnly }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={cn(
        'focus-ring flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-character-surface hover:text-character-flare',
        isActive ? 'bg-character-surface text-character-flare font-bold' : 'text-muted-foreground',
        isSubItem && 'hover:border-character border-border ml-4 rounded-none border-l py-1',
        iconOnly && 'w-10 justify-center px-0',
      )}
    >
      {icon && <AppIcon name={icon} size={16} className="shrink-0" />}
      {!iconOnly && label}
    </Link>
  );
}
