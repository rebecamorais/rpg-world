'use client';

import React from 'react';

import { cn } from '@frontend/lib/utils';

export interface StatBadgeProps {
  icon: React.ReactNode;
  label?: string;
  children: React.ReactNode;
  reverse?: boolean;
}

export const StatBadge = ({ icon, label, children, reverse }: StatBadgeProps) => (
  <div className="group/badge hover:border-character-muted/80 hover:bg-character-surface/10 hover:shadow-character-muted/30 m-0 flex items-center justify-center gap-2 rounded-full border border-zinc-800/50 bg-zinc-950/40 px-4 py-2 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_15px_var(--character-muted)]">
    <div className="text-character-flare flex-shrink-0 transition-all duration-300 group-hover/badge:brightness-125">
      {icon}
    </div>
    <div className={cn('flex items-baseline gap-2', reverse && 'flex-row-reverse')}>
      {label && (
        <span className="text-muted-foreground/50 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-opacity group-hover/badge:opacity-100">
          {label}
        </span>
      )}
      <div className="transition-colors duration-300 group-hover/badge:text-white">{children}</div>
    </div>
  </div>
);
