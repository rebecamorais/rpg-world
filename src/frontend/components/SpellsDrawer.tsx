'use client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  learnedSpells: string[];
  onLearnSpell: (spellIndex: string) => void;
  onForgetSpell: (spellIndex: string) => void;
}

export default function SpellsDrawer({
  isOpen,
  onClose,
  learnedSpells,
  onLearnSpell,
  onForgetSpell,
}: Props) {
  return <div>{'SpellsDrawer'}</div>;
}
