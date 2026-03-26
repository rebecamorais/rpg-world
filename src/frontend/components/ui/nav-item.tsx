import Link from 'next/link';

import { LucideIcon } from 'lucide-react';

import { cn } from '@frontend/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
  isSubItem?: boolean;
  icon?: LucideIcon;
}

export function NavItem({ href, label, isActive, isSubItem, icon: Icon }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        'hover:bg-primary/10 hover:text-primary',
        isActive ? 'bg-primary/10 text-primary font-bold' : 'text-zinc-400',
        isSubItem && 'hover:border-primary ml-4 rounded-none border-l border-zinc-800 py-1',
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {label}
    </Link>
  );
}
