'use client';

import { useState } from 'react';

import { BookOpen, Trash2 } from 'lucide-react';

import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Input } from '@/frontend/components/ui/input';

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
  const [newSpell, setNewSpell] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpell.trim()) return;
    onLearnSpell(newSpell.trim());
    setNewSpell('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="text-primary h-5 w-5" />
            Grimório de Magias
          </DialogTitle>
          <DialogDescription>
            Gerencie as magias conhecidas pelo seu personagem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="my-2 flex gap-2">
          <Input
            placeholder="Nome da magia (ex: fireball)"
            value={newSpell}
            onChange={(e) => setNewSpell(e.target.value)}
          />
          <Button type="submit">Aprender</Button>
        </form>

        <div className="flex-1 overflow-y-auto pr-2">
          {learnedSpells.length === 0 ? (
            <p className="text-muted-foreground mt-8 text-center text-sm">
              Nenhuma magia aprendida ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {learnedSpells.map((spell, i) => (
                <li
                  key={i}
                  className="border-border bg-card flex items-center justify-between rounded-md border p-3"
                >
                  <span className="font-medium">{spell}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onForgetSpell(spell)}
                    className="text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
