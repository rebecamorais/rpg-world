'use client';

import { createContext, useContext } from 'react';

import Link from 'next/link';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

/** False while the desktop menu is a strip of icons; everywhere else navigation is at full size. */
export const SidebarExpandedContext = createContext(true);

export function useSidebarExpanded() {
  return useContext(SidebarExpandedContext);
}

/** Fades a row's text with the menu; it stays in the row, so it keeps naming the link. */
export function navLabelClass(expanded: boolean) {
  return cn('min-w-0 truncate transition-opacity duration-200', !expanded && 'opacity-0');
}

/** A row of the menu. Collapsed, it narrows to its icon, which stays in the same place. */
export function navRowClass(expanded: boolean, isActive?: boolean) {
  return cn(
    'focus-ring flex min-h-10 items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition-[width,margin,background-color,color] duration-200',
    'hover:bg-character-surface hover:text-character-flare',
    isActive ? 'bg-character-surface text-character-flare font-bold' : 'text-muted-foreground',
    expanded ? 'w-full' : 'w-10',
  );
}

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
  isSubItem?: boolean;
  icon?: string;
}

export function NavItem({ href, label, isActive, isSubItem, icon }: NavItemProps) {
  const expanded = useSidebarExpanded();

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        navRowClass(expanded, isActive),
        isSubItem &&
          expanded &&
          'hover:border-character border-border ml-4 w-auto rounded-none border-l py-1',
      )}
    >
      {icon && <AppIcon name={icon} size={16} className="shrink-0" />}
      <span className={navLabelClass(expanded)}>{label}</span>
    </Link>
  );
}
