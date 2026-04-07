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
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        'hover:bg-[color-mix(in_srgb,var(--character-color,var(--primary)),transparent_90%)] hover:text-[var(--character-color,var(--primary))]',
        isActive
          ? 'bg-[color-mix(in_srgb,var(--character-color,var(--primary)),transparent_90%)] font-bold text-[var(--character-color,var(--primary))]'
          : 'text-zinc-400',
        isSubItem &&
          'ml-4 rounded-none border-l border-zinc-800 py-1 hover:border-[var(--character-color,var(--primary))]',
      )}
    >
      {icon && <AppIcon name={icon} size={16} className="shrink-0" />}
      {label}
    </Link>
  );
}
