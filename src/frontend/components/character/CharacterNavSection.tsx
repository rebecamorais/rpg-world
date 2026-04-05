'use client';

import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { NavItem } from '@frontend/components/ui/nav-item';
import { useCharacter } from '@frontend/hooks/useCharacter';
import { CharacterTab } from '@frontend/types/character-sheet';

export default function CharacterNavSection({ characterId }: { characterId: string }) {
  const { character } = useCharacter(characterId);
  const pathname = usePathname();
  const t = useTranslations('characters.tabs');

  const characterName = character?.name;
  const avatarUrl = character?.avatarUrl;

  if (!characterName || !character?.system) return null;

  const basePath = `/system/${character.system}/character/${characterId}`;

  const navItems = [
    { id: CharacterTab.STATUS, label: t('status'), icon: 'Shield', href: basePath },
    { id: CharacterTab.LORE, label: t('lore'), icon: 'Files', href: `${basePath}/lore` },
    { id: CharacterTab.SPELLS, label: t('spells'), icon: 'BookOpen', href: `${basePath}/spells` },
    {
      id: CharacterTab.INVENTORY,
      label: t('inventory'),
      icon: 'Sword',
      href: `${basePath}/inventory`,
    },
  ];

  return (
    <section
      className="animate-in fade-in slide-in-from-left-2 flex flex-col gap-4 duration-300"
      style={{ '--character-color': character.accentColor } as React.CSSProperties}
    >
      <div className="flex flex-col gap-2 px-3">
        <p
          className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase"
          style={{ color: character.accentColor || undefined }}
        >
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
        {navItems.map((item) => {
          const isActive =
            item.id === CharacterTab.STATUS
              ? pathname === item.href
              : pathname?.startsWith(item.href);

          return (
            <NavItem
              key={item.id}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              isSubItem
            />
          );
        })}
      </div>
    </section>
  );
}
