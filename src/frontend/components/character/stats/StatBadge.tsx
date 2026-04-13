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
  <div className="group/badge hover:border-character-muted/50 hover:bg-character-surface/10 hover:shadow-character-glow/20 m-0 flex items-center justify-center gap-2 rounded-xl border border-zinc-800/40 bg-zinc-950/60 px-3 py-2 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl md:rounded-2xl md:px-4 md:py-2.5">
    <div className="text-character-flare flex shrink-0 items-center justify-center transition-all duration-500 group-hover/badge:scale-110 group-hover/badge:brightness-125">
      {icon}
    </div>
    <div className={cn('flex items-baseline gap-1.5', reverse && 'flex-row-reverse')}>
      <div className="text-foreground text-sm font-black tracking-tight transition-all duration-300 group-hover/badge:text-white sm:text-base">
        {children}
      </div>
      {label && (
        <span className="text-secondary-foreground/30 group-hover/badge:text-secondary-foreground/60 text-[9px] font-black tracking-[0.2em] whitespace-nowrap uppercase transition-all duration-500 group-hover/badge:translate-x-0.5 group-hover/badge:opacity-100">
          {label}
        </span>
      )}
    </div>
  </div>
);
