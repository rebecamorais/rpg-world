import Link from 'next/link';

import { cn } from '@/frontend/lib/utils';

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
        'hover:bg-[#663399]/10 hover:text-[#663399]',
        isActive ? 'bg-[#663399]/10 font-bold text-[#663399]' : 'text-zinc-400',
        isSubItem &&
          'ml-4 rounded-none border-l border-zinc-800 py-1 hover:border-[#663399]',
      )}
    >
      {label}
    </Link>
  );
}
