BEGIN;

-- 1. Cria a coluna de categoria
ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS spell_category TEXT DEFAULT 'utility';

-- 2. Define categorias para Buffs (Proteção, Fortalecimento)
UPDATE public.spells SET spell_category = 'buff', damage_type = NULL, bg_style_id = 'grid-mesh' 
WHERE external_index IN (
  'aid', 'bless', 'haste', 'shield', 'mage-armor', 'resistance', 'guidance', 
  'protection-from-evil-and-good', 'shield-of-faith', 'heroism', 'enhance-ability', 
  'invisibility', 'greater-invisibility', 'stoneskin', 'fly', 'death-ward', 
  'holy-aura', 'freedom-of-movement', 'true-seeing', 'beacon-of-hope'
);

-- 3. Define categorias para Utility (Conveniência, Exploração, Divinação)
UPDATE public.spells SET spell_category = 'utility', damage_type = NULL, bg_style_id = 'dots-space' 
WHERE external_index IN (
  'detect-magic', 'identify', 'light', 'mage-hand', 'prestidigitation', 'mending', 
  'message', 'animal-friendship', 'comprehend-languages', 'unseen-servant', 
  'augury', 'find-traps', 'detect-thoughts', 'knock', 'levitate', 'locate-object', 
  'rope-trick', 'spider-climb', 'tongues', 'scrying', 'teleport-circle', 'purify-food-and-drink',
  'detect-poison-and-disease', 'speak-with-animals', 'speak-with-dead', 'speak-with-plants'
);

-- 4. Define categorias para Control (Alteração de estado, Debuffs, Terreno)
UPDATE public.spells SET spell_category = 'control', damage_type = NULL, bg_style_id = 'ethereal-glow' 
WHERE external_index IN (
  'hold-person', 'sleep', 'charm-person', 'hypnotic-pattern', 'bane', 'command', 
  'entangle', 'grease', 'fog-cloud', 'blindness-deafness', 'calm-emotions', 
  'suggestion', 'slow', 'confusion', 'dominate-person', 'hold-monster',
  'web', 'fear', 'silence', 'polymorph', 'banishment', 'otto-irresistible-dance'
);

-- 5. Fallback: Garante que tudo que não tem dano nem categoria seja utility
UPDATE public.spells SET spell_category = 'utility', bg_style_id = 'dots-space' 
WHERE (damage_type IS NULL OR damage_type = '') AND (spell_category IS NULL OR spell_category = 'utility');

COMMIT;
