'use client';

import { useState } from 'react';

import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/frontend/components/ui/dialog';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/frontend/components/ui/tooltip';
import { getModifier } from '@/systems/dnd5e/calculations';
import rules from '@/systems/dnd5e/rules.json';

const MIN_ATTR = 1;
const MAX_ATTR = 30;

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function AttributeCard({ label, value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const clamped = Math.min(MAX_ATTR, Math.max(MIN_ATTR, value));
  const modifier = getModifier(clamped);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempValue(clamped);
    }
  };

  const handleSave = () => {
    const raw = tempValue === null || isNaN(tempValue) ? MIN_ATTR : tempValue;
    const next = Math.min(MAX_ATTR, Math.max(MIN_ATTR, Math.floor(raw)));
    onChange(next);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group border-border bg-card hover:border-primary relative flex w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 p-3 shadow-sm transition-colors"
        >
          <div className="bg-primary/50 group-hover:bg-primary absolute top-0 h-1 w-full transition-colors" />
          <span className="text-muted-foreground mb-1 text-[10px] font-bold tracking-wider uppercase">
            {label}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center">
                {/* Modificador principal */}
                <span className="text-foreground mb-2 font-mono text-3xl font-bold">
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </span>

                {/* Valor de Exibição (Pequeno, na base oval) */}
                <div className="border-border bg-secondary pointer-events-none z-10 mt-[-10px] flex w-14 items-center justify-center rounded-full border px-2 py-0.5">
                  <span className="text-secondary-foreground text-center text-sm font-bold">
                    {clamped}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold">Cálculo do Modificador</p>
                <p className="text-muted-foreground">
                  {rules.formulas.attributeModifier}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Editar {label}</DialogTitle>
          <DialogDescription>
            Ajuste o valor base deste atributo (1 a 30).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`attr-${label}`}>Valor Base</Label>
            <Input
              id={`attr-${label}`}
              type="number"
              min={MIN_ATTR}
              max={MAX_ATTR}
              value={tempValue}
              onChange={(e) =>
                setTempValue(e.target.value === '' ? 0 : Number(e.target.value))
              }
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
