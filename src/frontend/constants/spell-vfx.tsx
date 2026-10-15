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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,var(--spell-color),transparent_60%)] opacity-20" />
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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_0%,var(--spell-color),transparent_50%)] opacity-10" />
    </div>
  ),

  'dots-space': () => (
    <div className="bg-background absolute top-0 -z-10 h-full w-full bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:24px_24px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--spell-color)_0%,transparent_70%)] opacity-20" />
    </div>
  ),

  'force-shockwave': () => (
    <div className="bg-background absolute inset-0 -z-10 h-full w-full overflow-hidden">
      {/* Static rings: the background only shows on the open card, behind the rules text */}
      <div className="border-spell absolute top-0 right-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full border opacity-40" />
      <div className="border-spell absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full border opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,var(--spell-color),transparent_40%)] opacity-20" />
    </div>
  ),
};
