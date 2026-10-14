import React from 'react';

/*
 * Spell card backgrounds. They render inside `.spell-context` (SpellCard), so the spell's own
 * color is available as the `spell` token (bg-spell, border-spell, var(--spell-color)).
 */
export const SPELL_BACKGROUNDS: Record<string, () => React.ReactNode> = {
  'ethereal-glow': () => (
    <div className="bg-background absolute inset-0 -z-10 h-full w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--spell-color)_100%)]" />
  ),

  'grid-mesh': () => (
    <div className="bg-background absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:14px_24px]">
      <div className="bg-spell absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full opacity-20 blur-[100px]" />
    </div>
  ),

  'void-dots': () => (
    <div className="bg-background absolute inset-0 -z-10 h-full w-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle,var(--spell-color)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
    </div>
  ),

  'classic-aura': () => (
    <div className="bg-background absolute inset-0 -z-10 h-full w-full">
      <div className="from-spell-surface absolute inset-0 -z-10 h-full w-full bg-gradient-to-br to-transparent opacity-30" />
      <div className="bg-spell absolute -top-[50px] -left-[50px] -z-10 h-[250px] w-[250px] rounded-full opacity-10 blur-[80px]" />
    </div>
  ),

  'dots-space': () => (
    <div className="bg-background absolute top-0 -z-10 h-full w-full bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:24px_24px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--spell-color)_0%,transparent_70%)] opacity-20" />
    </div>
  ),

  'force-shockwave': () => (
    <div className="bg-background absolute inset-0 -z-10 h-full w-full overflow-hidden">
      {/* Heavy Shockwaves with staggered delays */}
      <div className="animate-shockwave border-spell absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40" />
      <div className="animate-shockwave border-spell absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 [animation-delay:500ms]" />
      <div className="animate-shockwave border-spell absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 [animation-delay:1000ms]" />

      {/* Center Glow */}
      <div className="bg-spell absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[40px]" />
    </div>
  ),
};
