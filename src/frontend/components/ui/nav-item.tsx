import Link from 'next/link';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
  isSubItem?: boolean;
  icon?: string;
}

export function NavItem({ href, label, isActive, isSubItem, icon }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'focus-ring flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-character-surface hover:text-character-flare',
        isActive ? 'bg-character-surface text-character-flare font-bold' : 'text-muted-foreground',
        isSubItem && 'hover:border-character border-border ml-4 rounded-none border-l py-1',
      )}
    >
      {icon && <AppIcon name={icon} size={16} className="shrink-0" />}
      {label}
    </Link>
  );
}
