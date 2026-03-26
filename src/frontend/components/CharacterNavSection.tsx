'use client';

import { useSearchParams } from 'next/navigation';

import { BookOpen, Files, Shield, Sword } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { NavItem } from '@frontend/components/ui/nav-item';
import { useCharacter } from '@frontend/hooks/useCharacter';

export default function CharacterNavSection({ characterId }: { characterId: string }) {
  const { character } = useCharacter(characterId);
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'status';
  const t = useTranslations('characters.tabs');

  const characterName = character?.name;
  const avatarUrl = character?.avatarUrl;

  if (!characterName) return null;

  const navItems = [
    { id: 'status', label: t('status'), icon: Shield },
    { id: 'lore', label: t('lore'), icon: Files },
    { id: 'spells', label: t('spells'), icon: BookOpen },
    { id: 'inventory', label: t('inventory'), icon: Sword },
  ];

  return (
    <section className="animate-in fade-in slide-in-from-left-2 flex flex-col gap-4 duration-300">
      <div className="flex flex-col gap-2 px-3">
        <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
          {characterName}
        </p>
        <div className="flex items-center gap-3">
          <Avatar className="ring-primary/20 h-10 w-10 rounded-lg border border-white/10 ring-2 transition-all">
            <AvatarImage src={avatarUrl} alt={characterName} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {characterName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-bold text-white/90">{characterName}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            href={`/characters/${characterId}?tab=${item.id}`}
            label={item.label}
            icon={item.icon}
            isActive={activeTab === item.id}
            isSubItem
          />
        ))}
      </div>
    </section>
  );
}
