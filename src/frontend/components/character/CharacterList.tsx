'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Badge } from '@frontend/components/ui/badge';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useCharacters } from '@frontend/hooks/useCharacters';
import { cn } from '@frontend/lib/utils';

import type { CharacterSummary } from '@shared/types/character';

export default function CharacterList() {
  const { currentUser } = useCurrentUser();
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const { characters, isLoading, error } = useCharacters();

  // Deletion logic
  const [characterToDelete, setCharacterToDelete] = useState<CharacterSummary | null>(null);
  const [confirmName, setConfirmName] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await rpgWorldApi.delete(`/api/characters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success(t('deleteSuccess'));
      setCharacterToDelete(null);
      setConfirmName('');
    },
    onError: (err: Error) => {
      toast.error(err.message || t('deleteError'));
    },
  });

  const handleDelete = () => {
    if (characterToDelete) {
      deleteMutation.mutate(characterToDelete.id);
    }
  };

  if (!currentUser) return null;

  if (error) {
    return (
      <div className="text-destructive p-6 text-center">
        <p>{t('loadError', { message: error.message })}</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState thematic />;
  }

  if (characters.length === 0) {
    return (
      <div className="border-muted bg-card/30 flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center backdrop-blur-sm">
        <div className="relative mb-6">
          <div className="bg-primary/20 absolute -inset-1 animate-pulse rounded-full blur-xl" />
          <div className="bg-muted relative flex h-24 w-24 items-center justify-center rounded-full shadow-inner">
            <AppIcon name="UserPlus" size={48} className="text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-foreground mb-3 text-2xl font-bold tracking-tight">
          {t('emptyState')}
        </h3>
        <p className="text-muted-foreground mx-auto mb-10 max-w-md text-base leading-relaxed">
          {t('createFirstDescription') ||
            'Comece sua jornada épica hoje. Crie seu primeiro personagem e prepare-se para a aventura.'}
        </p>
        <Button
          asChild
          size="lg"
          className="shadow-primary/20 h-12 rounded-full px-10 text-base font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Link href="/characters/new">
            <AppIcon name="Plus" size={20} className="mr-2" />
            {t('createFirst')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-foreground text-4xl font-black tracking-tighter">{t('title')}</h2>
          <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
            {characters.length === 1
              ? '1 personagem pronto para aventura'
              : `${characters.length} personagens prontos para aventura`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {/* Create Character Action Card */}
        <Link
          href="/characters/new"
          className="group border-muted bg-card/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-primary/10 relative flex h-full min-h-[160px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-500 hover:shadow-2xl"
        >
          <div className="from-primary/10 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="bg-muted group-hover:bg-primary group-hover:shadow-primary/30 relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-90 group-hover:shadow-lg">
            <AppIcon
              name="Plus"
              size={28}
              className="text-muted-foreground group-hover:text-primary-foreground transition-colors duration-500"
            />
          </div>
          <span className="text-muted-foreground group-hover:text-primary relative text-lg leading-tight font-bold tracking-tight transition-colors duration-500">
            {t('createNew')}
          </span>
        </Link>

        {/* Existing Character Cards */}
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onDelete={() => setCharacterToDelete(character)}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!characterToDelete}
        onOpenChange={(open) => !open && setCharacterToDelete(null)}
      >
        <DialogContent
          className="character-context border-red-500/20 bg-slate-950/95 text-white backdrop-blur-xl"
          style={{ '--character-color': 'var(--red)' } as React.CSSProperties}
        >
          <DialogHeader>
            <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
            <DialogDescription className="space-y-4">
              <span className="block">
                {t('deleteDialogDescription', { name: characterToDelete?.name || '' })}
              </span>
              <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t.markup('deleteConfirmInstruction', {
                      name: characterToDelete?.name || '',
                      bold: (chunks) => `<strong>${chunks}</strong>`,
                    }),
                  }}
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={t('deleteConfirmPlaceholder')}
              className="bg-muted focus-visible:ring-primary/30"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setCharacterToDelete(null)}>
              {tCommon('cancel')}
            </Button>
            <Button
              destroy
              onClick={handleDelete}
              disabled={confirmName !== characterToDelete?.name || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? tCommon('loading') : tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CharacterCard({
  character,
  onDelete,
}: {
  character: CharacterSummary;
  onDelete: () => void;
}) {
  const tCommon = useTranslations('common');

  return (
    <div className="group relative h-full">
      <Link href={`/system/${character.system}/character/${character.id}`} className="block h-full">
        <Card
          className={cn(
            'relative h-full overflow-hidden border-2 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-2xl',
            'bg-card/50 backdrop-blur-md',
          )}
          style={{
            borderColor: character.accentColor ? `${character.accentColor}33` : 'transparent',
            boxShadow: character.accentColor
              ? `0 10px 30px -15px ${character.accentColor}44`
              : 'none',
          }}
        >
          {/* Accent Color Indicator (Top Bar) */}
          <div
            className="absolute top-0 left-0 h-1.5 w-full opacity-70 transition-opacity group-hover:opacity-100"
            style={{ backgroundColor: character.accentColor || 'hsl(var(--primary))' }}
          />

          <CardContent className="flex h-full flex-col p-6">
            <div className="mb-4 flex flex-col items-start gap-1.5">
              <div className="flex max-w-full items-center gap-2">
                <h3
                  className="text-foreground truncate text-2xl font-black transition-colors"
                  style={{ color: character.accentColor }}
                >
                  {character.name}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-muted shrink-0 px-2 py-0.5 text-xs font-black tracking-widest uppercase opacity-80"
                  style={{
                    borderLeft: character.accentColor
                      ? `2px solid ${character.accentColor}`
                      : 'none',
                  }}
                >
                  Nv {character.level}
                </Badge>
              </div>
              <p className="text-muted-foreground line-clamp-1 text-sm font-semibold tracking-wide uppercase opacity-70">
                {character.class || 'Aventureiro'}
              </p>
            </div>

            <div className="border-muted/30 mt-auto flex items-center justify-between border-t pt-4">
              <div className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-widest uppercase opacity-60 transition-opacity group-hover:opacity-100">
                <AppIcon
                  name="Swords"
                  size={16}
                  style={{ color: character.accentColor || 'var(--primary)' }}
                />
                <span>{character.system.replace('_', ' ')}</span>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
                style={{
                  backgroundColor: character.accentColor
                    ? `${character.accentColor}1A`
                    : 'var(--primary-10)',
                  borderColor: character.accentColor
                    ? `${character.accentColor}33`
                    : 'var(--primary-20)',
                  color: character.accentColor || 'var(--primary)',
                }}
              >
                <AppIcon name="ChevronRight" size={20} />
              </div>
            </div>
          </CardContent>

          {/* Hover Glow Effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
            style={{
              background: `radial-gradient(circle at top right, ${character.accentColor || 'var(--primary)'}, transparent 70%)`,
            }}
          />
        </Card>
      </Link>

      {/* Delete Action Overlay - Top Right */}
      <div className="absolute top-4 right-4 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <Button
          destroy
          size="icon"
          title={tCommon('delete')}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="h-9 w-9 rounded-xl shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <AppIcon name="Trash2" size={18} />
        </Button>
      </div>
    </div>
  );
}
