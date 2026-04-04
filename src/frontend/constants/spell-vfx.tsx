import React from 'react';

export const SPELL_BACKGROUNDS: Record<string, (color: string) => React.ReactNode> = {
  'ethereal-glow': (color: string) => (
    <div
      className="absolute inset-0 -z-10 h-full w-full bg-slate-950 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,var(--vfx-color)_100%)]"
      style={{ '--vfx-color': color } as React.CSSProperties}
    />
  ),

  'grid-mesh': (color: string) => (
    <div className="absolute inset-0 -z-10 h-full w-full bg-slate-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      <div
        className="absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full opacity-20 blur-[100px]"
        style={{ backgroundColor: color }}
      />
    </div>
  ),

  'void-dots': (color: string) => (
    <div className="absolute inset-0 -z-10 h-full w-full bg-[#000000]">
      <div
        className="absolute inset-0 bg-[size:20px_20px] opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
        }}
      />
    </div>
  ),

  'classic-aura': (color: string) => (
    <div className="absolute inset-0 -z-10 h-full w-full bg-slate-950">
      <div
        className="absolute inset-0 -z-10 h-full w-full opacity-30"
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, transparent 100%)`,
        }}
      />
      <div
        className="absolute -top-[50px] -left-[50px] -z-10 h-[250px] w-[250px] rounded-full opacity-10 blur-[80px]"
        style={{ backgroundColor: color }}
      />
    </div>
  ),
};
