-- Marca do tipo de ficha: 'pc' (personagem jogável) ou 'npc' (ficha do mestre, ex.: inimigo).
-- As fichas de inimigo das mesas (fase 2) não aparecem em "Meus personagens" nem podem ser
-- levadas para uma mesa como personagem de jogador. Todas as fichas atuais são 'pc'.
ALTER TABLE public.characters
  ADD COLUMN kind text NOT NULL DEFAULT 'pc' CHECK (kind IN ('pc', 'npc'));
