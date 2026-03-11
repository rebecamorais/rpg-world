import Link from 'next/link';

import { cn } from '@frontend/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
  isSubItem?: boolean;
}

export function NavItem({ href, label, isActive, isSubItem }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        'hover:bg-primary/10 hover:text-primary',
        isActive ? 'bg-primary/10 text-primary font-bold' : 'text-zinc-400',
        isSubItem && 'hover:border-primary ml-4 rounded-none border-l border-zinc-800 py-1',
      )}
    >
      {label}
    </Link>
  );
}
