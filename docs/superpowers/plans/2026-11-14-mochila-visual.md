# Mochila visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A mochila (e o baú da mesa) ganha cor por grupo, imagem por item (Game Icons por padrão), duas visualizações (lista agrupada e grade), remoção pelo "−" e um cartão discreto de "em inglês".

**Architecture:** Lógica pura (grupos, ícones, ordem de imagem) num módulo `item-visuals.ts`; cor por grupo via tokens CSS e um `.item-context` que deriva `--item-flare/surface/muted` como o `.spell-context`; componentes pequenos (`ItemImage`, `QuantityStepper`, `UntranslatedNotice`, `GroupedItemList`, `ItemGrid`) compostos pelo `ItemList` existente, que ganha o alternador de visualização.

**Tech Stack:** Next.js (App Router), React 19, Tailwind v4 tokens em `app/globals.css`, next-intl, Vitest + Testing Library, Playwright, `@iconify-json/game-icons` via sprite (`npm run icons`).

**Spec:** `docs/superpowers/specs/2026-11-13-mochila-visual-design.md`

## Global Constraints

- Código, nomes, comentários em inglês; textos de UI só via `messages/pt.json` e `messages/en.json` (o guard `hardcoded-text.unit.test.ts` falha com texto fixo). `es`/`sv` ficam para o Crowdin.
- Nenhuma cor crua nos componentes (guard `src/frontend/styles/design-tokens.unit.test.ts`): só tokens. Cores novas em `app/globals.css`, temas escuro e claro.
- Game Icons novos exigem `npm run icons` e commit do sprite (`src/frontend/constants/game-icons.svg`) e de `game-icon-names.generated.ts`. O script só inclui nomes que aparecem como string literal em `src/` ou `app/` (fora de testes).
- Sem dependência nova. Sem mudança no banco, na API ou no backend.
- Na ficha só leitura do mestre (`SheetFieldset`, `<fieldset disabled>`), qualquer controle que o mestre precisa usar (abrir detalhes, alternar visualização, selecionar quadrado da grade) **não** pode ser `<button>`: usar `<span role="button" tabIndex={0}>` com Enter/Espaço, como o gatilho atual em `ItemRow.tsx:42-56`. Quantidade e remover continuam `<Button>` (ficam desativados de propósito).
- Rótulos acessíveis existentes usados pelo e2e continuam iguais: `increase` ("One more {name}" em en), `quantity`, `decrease`, `remove`, `details`.
- Sem barra de carga; peso total no rodapé como hoje, mais peso por grupo na lista.
- Commits com mensagem bilíngue `tipo(escopo): pt / en` e a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Um PR no fim, corpo em pt + en.

## Review Focus

1. **Mestre na ficha só leitura**: alterna visualização, seleciona quadrado e abre detalhes; − / + / lixeira desativados. → testes nas Tasks 6 e 7.
2. **Item fora do catálogo (`item: null`)**: cai em "Outros", ícone de desconhecido, sem detalhes de regra; "−" em 1 vira lixeira e remove com desfazer. → testes nas Tasks 5, 6 e 7.
3. **`localStorage` indisponível ou com valor lixo** (modo privado, valor `"banana"`): abre na lista, sem erro. → teste na Task 4.
4. **Remover o item selecionado na grade**: o painel de detalhes fecha (não fica apontando para entrada inexistente), e o desfazer o devolve. → teste na Task 7.
5. **Ícone inexistente no sprite**: qualquer nome no mapa que não exista no Game Icons faria `AppIcon` renderizar nada. → teste na Task 1 valida todos os nomes contra a coleção.

---

### Task 1: Grupos, ícones e crédito do Game Icons

**Files:**

- Create: `src/frontend/components/character/inventory/item-visuals.ts`
- Test: `src/frontend/components/character/inventory/item-visuals.unit.test.ts`
- Modify: `NOTICE.md` (nova seção "Game Icons")
- Regenerate: `src/frontend/constants/game-icons.svg`, `src/frontend/constants/game-icon-names.generated.ts`

**Interfaces:**

- Produces:
  - `type ItemGroup = 'weapons' | 'armor' | 'magic' | 'tools' | 'gear' | 'other'`
  - `const ITEM_GROUPS: readonly ItemGroup[]` — nessa ordem exata.
  - `function groupOf(category: ItemCategory | null): ItemGroup` — `null` (fora do catálogo) → `'other'`.
  - `const CATEGORY_ICONS: Record<ItemCategory, string>` — Game Icon por categoria.
  - `const ITEM_ICONS: Readonly<Record<string, string>>` — `id` do item (sem fonte) → Game Icon.
  - `const UNKNOWN_ITEM_ICON: string` — ícone do item fora do catálogo (ex.: `'help'`).
  - `function gameIconOf(item: Pick<ItemDto, 'id' | 'category'> | null): string` — `ITEM_ICONS[id] ?? CATEGORY_ICONS[category]`, ou `UNKNOWN_ITEM_ICON` para `null`.

Mapa de grupos (spec, decisão 10): weapons = `weapon, ammunition`; armor = `armor, shield`; magic = `focus`; tools = `tool, kit, instrument`; gear = `gear, food, trade-good`; other = `mount, vehicle, other`.

- [ ] **Step 1: Write the failing tests** in `item-visuals.unit.test.ts`:
  - `groupOf` cobre as 14 categorias de `ItemCategory` exatamente como o mapa acima (tabela `it.each`), e `groupOf(null) === 'other'`.
  - `ITEM_GROUPS` igual a `['weapons','armor','magic','tools','gear','other']`.
  - `gameIconOf({ id: 'spellbook', category: 'gear' })` é `ITEM_ICONS.spellbook`; `gameIconOf({ id: 'not-mapped', category: 'tool' })` é `CATEGORY_ICONS.tool`; `gameIconOf(null) === UNKNOWN_ITEM_ICON`.
  - Todo valor de `CATEGORY_ICONS`, `ITEM_ICONS` e `UNKNOWN_ITEM_ICON` existe na coleção: carregar `@iconify-json/game-icons/icons.json` (como `scripts/game-icons.ts:26`) e checar `icons[name] || aliases[name]`.
  - Todo valor também está em `GAME_ICON_NAMES` (prova que `npm run icons` rodou).
  - Cobertura mínima: estes ids têm entrada em `ITEM_ICONS`: `spellbook, spyglass, ink-pen, rope, hempen-rope-50-feet, silk-rope-50-feet, torch, rations, rations-1-day, backpack, bedroll, tent, waterskin, tinderbox, component-pouch, healer-s-kit, thieves-tools, shield, dagger, longsword, shortsword, greatsword, battleaxe, handaxe, mace, quarterstaff, longbow, shortbow, light-crossbow, hand-crossbow, heavy-crossbow, spear, trident, whip, sling, arrow, arrows-20, plate-armor, chain-mail, leather-armor, crystal, orb, wand, staff, holy-water, lute`.
  - Todo id em `ITEM_ICONS` existe nos `content/dnd5e/srd-5.1/items.json` ou `srd-5.2/items.json` (evita chave com erro de digitação).
- [ ] **Step 2: Run** `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/components/character/inventory/item-visuals.unit.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement `item-visuals.ts`.** Escolha dos ícones é do implementador (nomes já verificados que existem: `broadsword, arrow-cluster, breastplate, checked-shield, crystal-wand, toolbox, knapsack, swap-bag, horse-head, chest, help, spell-book, spyglass, quill-ink, rope-coil, torch, battle-axe, crossbow, pocket-bow, plain-dagger, mace-head, war-pick, wizard-staff, crystal-ball, holy-symbol, chain-mail, leather-armor, scale-mail, lantern-flame, compass, camping-tent, water-flask, bread, meat, lockpicks, round-potion, trident, spears, whip, sling, flail, halberd, musket, dart, pan-flute, drum, flute, violin, hunting-horn, bagpipes, candles, hourglass, mirror-mirror, coins, lyre, cauldron`). Os nomes devem ser string literal no arquivo (o gerador do sprite lê literais).
- [ ] **Step 4: Run** `npm run icons`, then the test again — Expected: PASS.
- [ ] **Step 5: NOTICE.md** — nova seção `## Game Icons` com: ícones de <https://game-icons.net> por Lorc, Delapouite e colaboradores, licença CC BY 3.0 (<https://creativecommons.org/licenses/by/3.0/>), "Usado em: ícones de jogo da interface (`src/frontend/constants/game-icons.svg`), inclusive as imagens padrão dos itens."
- [ ] **Step 6: Commit** — `feat(mochila): grupos e ícones dos itens / item groups and icons`.

### Task 2: Cor por grupo (tokens)

**Files:**

- Modify: `app/globals.css`
- Test: `src/frontend/lib/theme-tokens.unit.test.ts`

**Interfaces:**

- Produces:
  - Tokens `--item-weapons, --item-armor, --item-magic, --item-tools, --item-gear, --item-other` (hex) em `:root`; o tema claro só redefine se precisar.
  - Classe `.item-context`: o componente define `--item-color` inline (`style={{ '--item-color': 'var(--item-weapons)' }}`); `.item-context` deriva `--item-flare`, `--item-surface`, `--item-muted` exatamente como `--spell-*` (adicionar `.item-context` aos três blocos de seletores das derivadas: o normal, o fallback claro e os dois do `@supports`).
  - Utilitários Tailwind via `@theme inline`: `--color-item`, `--color-item-flare`, `--color-item-surface`, `--color-item-muted` → classes `text-item-flare`, `bg-item-surface`, `border-item-muted`, `border-item`.
  - Helper TS em `item-visuals.ts`: `function itemGroupStyle(group: ItemGroup): React.CSSProperties` → `{ '--item-color': 'var(--item-<group>)' }`.

Cores: tons dessaturados da "fantasia sóbria" (referência do mockup: armas `#d0654f`, armaduras um aço frio, magia `#a77fd6`, ferramentas `#c9a45c`, equipamento `#5fa7c9`, outros `--muted-foreground`). Valores exatos ficam com o implementador.

- [ ] **Step 1: Write the failing test** em `theme-tokens.unit.test.ts`, dentro do `describe.each(THEMES)`: para cada grupo, `--item-<group>` resolve para hex no tema e tem contraste ≥ 3:1 sobre `--card` e `--background` (borda/ícone, contraste não textual). Se algum tom ficar abaixo, o implementador ajusta o tom, não o limite.
- [ ] **Step 2: Run** `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/lib/theme-tokens.unit.test.ts` — Expected: FAIL (`--item-weapons is not declared`).
- [ ] **Step 3: Add tokens, `.item-context` derivadas e `@theme inline`** em `globals.css`; adicionar `itemGroupStyle` e um teste curto dele em `item-visuals.unit.test.ts`.
- [ ] **Step 4: Run** os dois testes e `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/styles` — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(mochila): cores dos grupos de itens / item group colours`.

### Task 3: `ItemImage` e a pasta de arte própria

**Files:**

- Create: `src/frontend/components/character/inventory/ItemImage.tsx`
- Create: `src/frontend/components/character/inventory/item-art/index.ts`
- Test: `src/frontend/components/character/inventory/ItemImage.unit.test.tsx`

**Interfaces:**

- Consumes: `gameIconOf`, `groupOf`, `itemGroupStyle` (Tasks 1–2).
- Produces:
  - `item-art/index.ts`: `export const ITEM_ART: Readonly<Record<string, string>> = {}` — `id` do item → URL de um SVG importado (`import spellbook from './spellbook.svg'` → `spellbook.src`). Começa vazio, com comentário explicando o contrato (SVG sem cor fixa, gerado pelo Claude Code e aprovado pela dona, como no Grimoire).
  - `function ItemImage(props: { item: Pick<ItemDto,'id'|'category'> | null; imageUrl?: string | null; size?: number; className?: string; art?: Readonly<Record<string,string>> }): JSX.Element` — `art` default `ITEM_ART` (injetável para teste). Ordem: `imageUrl` (`<img alt="">`, `object-cover`) › `art[item.id]` (`<span>` com `mask-image: url(...)`, `bg-current`, para herdar a cor) › `AppIcon variant="game" name={gameIconOf(item)}`. Sempre decorativo (`aria-hidden` / `alt=""`): o nome do item vem do texto ao lado.
  - Envolve com a cor do grupo: o próprio `ItemImage` não pinta; quem usa aplica `text-item-flare` dentro de um `.item-context`.

- [ ] **Step 1: Write the failing tests:**
  - com `imageUrl="https://x/y.png"` renderiza `<img src="https://x/y.png">` mesmo havendo arte e ícone;
  - com `art={{ spellbook: '/a.svg' }}` e item `spellbook`, renderiza o elemento com `mask-image` contendo `/a.svg` e nenhum `<svg><use>`;
  - sem os dois, renderiza `<use href="…#<gameIconOf(item)>">`;
  - `item={null}` renderiza o `UNKNOWN_ITEM_ICON`.
- [ ] **Step 2: Run** o teste — Expected: FAIL.
- [ ] **Step 3: Implement** `ItemImage.tsx` e `item-art/index.ts`.
- [ ] **Step 4: Run** o teste — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(mochila): imagem do item com ícone, arte e espaço para upload / item image with icon, art and upload slot`.

### Task 4: `QuantityStepper`, `UntranslatedNotice` e preferência de visualização

Três peças pequenas e independentes que as Tasks 6–7 compõem.

**Files:**

- Create: `src/frontend/components/character/inventory/QuantityStepper.tsx` (+ `.unit.test.tsx`)
- Create: `src/frontend/components/content/UntranslatedNotice.tsx` (+ `.unit.test.tsx`)
- Create: `src/frontend/hooks/useInventoryView.ts` (+ `.unit.test.ts`)
- Modify: `src/frontend/components/character/inventory/ItemDetails.tsx` (usar `UntranslatedNotice`; testes em `ItemDetails.unit.test.tsx`)
- Modify: `messages/pt.json`, `messages/en.json`

**Interfaces:**

- Produces:
  - `function QuantityStepper(props: { name: string; quantity: number; onQuantity: (n: number) => void; onRemove: () => void }): JSX.Element` — mesmo visual de `ItemRow.tsx:76-105`. Em `quantity <= 1` o botão esquerdo é a lixeira (`Trash2`, `text-danger-flare`, `aria-label={t('remove', { name })}`) e chama `onRemove`; acima de 1 é "−" (`aria-label={t('decrease', { name })}`) e chama `onQuantity(quantity - 1)`. "+" desativado em `MAX_QUANTITY` (mover a constante 9999 para cá e exportar). `<output aria-label={t('quantity',{name})}>`.
  - `function UntranslatedNotice(props: { compact?: boolean }): JSX.Element` — `role="note"`, `bg-info-surface border border-info-muted text-info-flare rounded-md`, ícone `Info` (adicionar ao `SYSTEM_ICONS` em `icon.tsx` se faltar), texto `t('untranslatedNotice')` e link `t('untranslatedHelp')` para `CROWDIN_PROJECT` (`src/frontend/constants/site.ts`) com `target="_blank" rel="noopener noreferrer"`. `compact` reduz padding e fonte (para o popover).
  - Mensagens novas em `characters`: pt `"untranslatedNotice": "Descrição em inglês por enquanto."`, `"untranslatedHelp": "Ajude a traduzir"`; en `"Description in English for now."`, `"Help translate"`. As chaves antigas `untranslatedBadge/Hint` ficam (as magias ainda usam).
  - `type InventoryView = 'list' | 'grid'`; `const INVENTORY_VIEW_KEYS = { backpack: 'rpg-world:inventory-view:backpack', chest: 'rpg-world:inventory-view:chest' } as const`; `function useInventoryView(storageKey: string): [InventoryView, (v: InventoryView) => void]` — padrão `'list'`; lê/escreve `localStorage` dentro de try/catch; valor desconhecido vira `'list'`; sem hidratação errada (usar `useSyncExternalStore` com snapshot de servidor `'list'`, no estilo de `src/frontend/hooks/useTheme.ts`).
  - Mensagens novas em `characters.inventory`: `view` ("Visualização"/"View"), `viewList` ("Lista"/"List"), `viewGrid` ("Grade"/"Grid"); grupos `characters.inventory.group.{weapons,armor,magic,tools,gear,other}` = pt "Armas", "Armaduras e escudos", "Magia", "Ferramentas e kits", "Equipamento", "Outros" / en "Weapons", "Armor and shields", "Magic", "Tools and kits", "Gear", "Other" — usados pela Task 6 (o peso do grupo usa o `fmt.weight` existente, sem mensagem nova).

- [ ] **Step 1: Write the failing tests:**
  - `QuantityStepper`: com 1, existe botão "Remove Rope" e não existe "Decrease quantity of Rope"; clicar chama `onRemove` (não `onQuantity`). Com 3, "−" chama `onQuantity(2)`; "+" chama `onQuantity(4)`; com 9999 "+" desativado.
  - `UntranslatedNotice`: `getByRole('note')` contém o texto e um link com `href` = `CROWDIN_PROJECT`.
  - `ItemDetails` com `untranslated: true` mostra `role="note"`; sem, não mostra; `nested` passa `compact`.
  - `useInventoryView`: padrão `'list'`; `set('grid')` persiste e uma nova montagem lê `'grid'`; chaves diferentes não se misturam; `localStorage.getItem` lançando erro → `'list'` sem exceção; valor `"banana"` → `'list'`.
- [ ] **Step 2: Run** os testes — Expected: FAIL.
- [ ] **Step 3: Implement** os três, as mensagens, e trocar o `<p>` de `ItemDetails.tsx:56-62` por `<UntranslatedNotice compact={nested} />`.
- [ ] **Step 4: Run** os testes e `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/components/content` — Expected: PASS (inclui o guard de texto fixo).
- [ ] **Step 5: Commit** — `feat(mochila): quantidade com lixeira, aviso de tradução e preferência de visualização / quantity with trash, translation notice and view preference`.

### Task 5: Agrupar as entradas

**Files:**

- Modify: `src/frontend/components/character/inventory/item-visuals.ts` (+ teste)

**Interfaces:**

- Consumes: `InventoryItem` de `@frontend/hooks/useInventory`, `groupOf`, `ITEM_GROUPS`.
- Produces: `function groupEntries(entries: InventoryItem[]): { group: ItemGroup; entries: InventoryItem[]; weight: number }[]` — na ordem de `ITEM_GROUPS`, só grupos com entradas, entradas na ordem recebida; `weight` = soma de `(item?.weight ?? 0) * quantity`.

- [ ] **Step 1: Write the failing test:** com corda (gear), adaga (weapon), item `null` e bordão (weapon) nessa ordem → `[weapons: [adaga, bordão], gear: [corda], other: [null]]`, pesos somados com quantidade; lista vazia → `[]`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(mochila): agrupa itens por tipo / group items by type`.

### Task 6: Lista agrupada

**Files:**

- Create: `src/frontend/components/character/inventory/GroupedItemList.tsx`
- Modify: `src/frontend/components/character/inventory/ItemRow.tsx`
- Test: `src/frontend/components/character/inventory/Backpack.unit.test.tsx`

**Interfaces:**

- Consumes: `groupEntries`, `itemGroupStyle`, `ItemImage`, `QuantityStepper`.
- Produces: `function GroupedItemList(props: { entries: InventoryItem[]; onQuantity: (id: string, n: number) => void; onRemove: (entry: InventoryItem) => void }): JSX.Element` — para cada grupo, um `<section aria-labelledby>` com cabeçalho (`.item-context`, `text-item-flare`, `text-label`, nome do grupo à esquerda e peso do grupo à direita) e `<ul>` de `ItemRow`.
- `ItemRow` muda: props iguais; ladrilho `ItemImage` (32px, `bg-item-surface text-item-flare rounded-md`, dentro de `.item-context` do grupo) antes do nome; usa `QuantityStepper`; a coluna de peso some abaixo de `sm` (`hidden sm:inline`); o botão "Remover" dos detalhes e a lixeira separada do item `null` saem. Item `null`: ícone de desconhecido, nome = ref, `unknownHint` embaixo.

- [ ] **Step 1: Update/write the tests** em `Backpack.unit.test.tsx` (o `ItemList` ainda renderiza a lista, então os testes passam pelo `Backpack`):
  - reescrever "remover fica nos detalhes…" → **"na quantidade 1 o − vira lixeira; remover avisa e Undo devolve"**: clicar `Remove Corda de Cânhamo` (sem abrir detalhes) chama `removeItem` e o toast com Undo chama `restoreItem`.
  - reescrever "item que saiu do catálogo…" → a lixeira é o botão esquerdo do stepper; aparece sob o título do grupo "Other"/"Outros".
  - novo: **"agrupa por tipo com peso do grupo"** — com adaga e corda, `getByRole('region', { name: 'Weapons' })` contém a adaga e `region 'Gear'` contém a corda; cada região mostra seu peso.
  - novo: detalhes abertos não têm mais botão "Remove X" fora do stepper.
  - manter "mestre (somente leitura)": detalhes abrem; − / + / lixeira desativados.
- [ ] **Step 2: Run** `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/components/character/inventory` — Expected: FAIL nos novos.
- [ ] **Step 3: Implement** `GroupedItemList`, ajustar `ItemRow`, e no `ItemList` (`Backpack.tsx:120-129`) trocar o `<ul>` por `<GroupedItemList>`.
- [ ] **Step 4: Run** de novo — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(mochila): lista agrupada com cor e ícone / grouped list with colour and icon`.

### Task 7: Grade e alternador

**Files:**

- Create: `src/frontend/components/character/inventory/ItemGrid.tsx`
- Modify: `src/frontend/components/character/inventory/Backpack.tsx` (`ItemList` ganha `viewKey`; `Backpack` passa `INVENTORY_VIEW_KEYS.backpack`)
- Modify: `src/frontend/components/party/PartyChestPage.tsx` (passa `INVENTORY_VIEW_KEYS.chest`)
- Test: `src/frontend/components/character/inventory/Backpack.unit.test.tsx`

**Interfaces:**

- Consumes: tudo das Tasks 1–6, `useInventoryView`.
- Produces:
  - `ItemList` prop nova obrigatória `viewKey: string`.
  - `function ItemGrid(props: { entries: InventoryItem[]; onQuantity: (id: string, n: number) => void; onRemove: (entry: InventoryItem) => void; onAdd: () => void; canAdd: boolean }): JSX.Element` — entradas na ordem de `groupEntries` (achatada, sem títulos). Grade `grid-cols-4 sm:grid-cols-6 lg:grid-cols-8`. Cada quadrado: `span role="button" tabIndex={0}`, `aria-pressed={selected}`, `aria-label` = `t('tile', { name, quantity })`, `.item-context` com `border-item-muted` (selecionado: `border-item` + anel), `ItemImage` ~32px, `×N` no canto só se `quantity > 1`, nome truncado embaixo. Último quadrado: tracejado "+" (`<Button>` com `aria-label={tCharacters('addItem')}`, `disabled={!canAdd}`; fica desativado no mestre, correto). Painel abaixo da grade quando há seleção: nome, `QuantityStepper`, e `ItemDetails` (ou `unknownHint` se `item === null`). Se a entrada selecionada sumir de `entries`, a seleção limpa.
  - Mensagem nova `characters.inventory.tile`: pt `"{name}, {quantity} un."`, en `"{name}, {quantity}"`.
  - Alternador no `SectionCard.Header` ao lado de "+ Item": grupo `role="radiogroup" aria-label={t('view')}` com dois `span role="radio" tabIndex aria-checked` (ícones `List`/`LayoutGrid` do Lucide, adicionar ao `SYSTEM_ICONS`; `aria-label` `viewList`/`viewGrid`), setas esquerda/direita trocam. Não usar `<button>` (Global Constraints). Só aparece quando há itens.

- [ ] **Step 1: Write the failing tests:**
  - **"começa na lista e lembra a grade"**: sem storage, `radio 'List'` marcado; clicar `radio 'Grid'` mostra os quadrados (`button` com nome `Rope, 2`) e grava `localStorage['rpg-world:inventory-view:backpack'] === 'grid'`.
  - **"baú usa outra chave"**: `PartyChest` com `grid` salvo só na chave do backpack abre em lista.
  - **"grade: selecionar abre o painel com stepper e detalhes"**: clicar o quadrado da corda → `aria-pressed=true`, painel mostra "Quantity of Rope" e a descrição.
  - **"grade: remover o selecionado fecha o painel e Undo devolve"**: com quantidade 1, clicar `Remove Rope` no painel → `removeItem` chamado; re-render sem a entrada → painel some; Undo chama `restoreItem`.
  - **"grade: item fora do catálogo"** mostra `unknownHint` no painel e a lixeira remove.
  - **"mestre na grade"**: dentro de `SheetFieldset` só leitura, o alternador funciona, o quadrado abre o painel, e − / + / lixeira / "+" estão desativados.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** `ItemGrid`, alternador e `viewKey` no `ItemList`, `Backpack` e `PartyChest`.
- [ ] **Step 4: Run** `npm run test:unit` — Expected: PASS (inclui guards de token e texto fixo).
- [ ] **Step 5: Commit** — `feat(mochila): visualização em grade e alternador / grid view and toggle`.

### Task 8: Verificação de ponta a ponta e PR

**Files:**

- Modify (se preciso): `e2e/inventory.spec.ts`, `e2e/a11y.spec.ts`
- Update: snapshot visual `sheet-inventory` (`e2e/visual/screens.visual.spec.ts`)

- [ ] **Step 1: Run** `npx tsc --noEmit && npm run lint` — Expected: sem erros.
- [ ] **Step 2: Run** `npx playwright test e2e/inventory.spec.ts e2e/a11y.spec.ts e2e/parties.spec.ts` — Expected: PASS. Se o e2e de inventário falhar só por "Gold pieces", é a instabilidade conhecida da #192: reportar, não mascarar.
- [ ] **Step 3: Atualizar o snapshot visual** com `VISUAL=1 npx playwright test e2e/visual/screens.visual.spec.ts --update-snapshots -g sheet-inventory`, e olhar a imagem nova (lista agrupada, tema escuro).
- [ ] **Step 4: Olhar no navegador** (skill `run`/Playwright): mochila em lista e grade, temas escuro e claro, largura de celular (375px), baú da mesa, ficha só leitura do mestre. Screenshots no PR.
- [ ] **Step 5: Commit** dos ajustes e **push + PR** para `main` (corpo pt + en, fecha nada; menciona [#91](https://github.com/rebecamorais/rpg-world/issues/91) para o upload de imagem). Remover o `.superpowers/` não é necessário (gitignored).
