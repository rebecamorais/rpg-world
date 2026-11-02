# Itens comuns e mochila: plano de implementação

> **Para agentes:** use superpowers:subagent-driven-development ou superpowers:executing-plans,
> tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhar.

**Objetivo:** catálogo de itens comuns do SRD em arquivo, inventário do personagem em tabela
(algibeira com as moedas e mochila com itens), salvando na hora, e a tag `{@item}` clicável.

**Arquitetura:** o catálogo segue o das condições (importador → `content/dnd5e/<livro>/items.json`

- `i18n/<locale>/items.json` → `FileItemCatalog` em memória → `GET /api/items`). O inventário fica
  em `character_containers` e `character_items`, com RLS de dono e leitura do mestre, e é servido
  pelo contexto de personagens (como o grimório), com rotas próprias. A tela usa React Query com
  atualização otimista.

**Tecnologias:** Next.js (App Router), Supabase (Postgres + RLS), zod, TanStack Query, next-intl,
Vitest, Playwright.

**Design:** `docs/plans/2026-11-02-itens-e-mochila.md` (ler junto).

## Restrições gerais

- Branch `feat/algibeira`; um commit por assunto; PR único no fim, descrição em pt e en.
- 5etools na versão de `scripts/content/5etools-source.ts` (`v2.38.0`). Só `srd` (5.1) / `srd52`
  (5.2) e sem raridade (`rarity` ausente ou `'none'`).
- Chave de item: `dnd5e:<livro>:item:<id>`; id em kebab-case do nome inglês (mesma regra de
  `toConditionId`).
- `kind` de lugar: `'coin_pouch' | 'backpack' | 'chest'`. Uma `coin_pouch` por personagem, que não
  se apaga.
- `quantity` inteiro de 1 a 9999; até 20 lugares e 500 entradas por personagem; moedas inteiras de
  0 a 1.000.000.000 (o teto que a ficha já usava).
- Preço em PC no arquivo; na tela, a maior moeda em que fecha inteiro, sem PE.
- Textos de interface só por next-intl (en e pt); cores só por tokens (testes de guarda do pre-commit).
- Migração nova com `npx supabase migration new <nome> --workdir database/db-dev < /dev/null`;
  tipos com `npm run infra` (passo de tipos) depois de aplicar.

## Pontos de atenção na revisão

1. **Personagem criado por qualquer caminho** (criar, duplicar, seed, migração) tem algibeira e
   mochila; duplicar copia moedas e itens para os lugares da cópia, não para os do original.
2. **Item que saiu do catálogo** (ref que o arquivo não tem mais): a mochila mostra a linha com o id
   e deixa remover; não quebra a lista nem a rota de leitura.
3. **Duas abas mexendo na quantidade**: `setQuantity` grava o valor absoluto; `addItem` de um item
   que já está no lugar soma no banco (sem ler-e-gravar no cliente).
4. **Pagar com a lista desatualizada**: o servidor recusa moedas negativas; a tela desfaz o
   otimista e avisa.
5. **Mestre lendo a ficha pela mesa**: vê algibeira e mochila, nenhum botão funciona, e as rotas
   de escrita respondem 403 para ele.

Cada ponto tem o teste na tarefa dona, marcado "(Ponto N)".

---

### Tarefa 1: Importador de itens e arquivos

**Arquivos:**

- Criar: `shared/systems/dnd5e/content/item.schema.ts` (+ `.unit.test.ts`)
- Criar: `scripts/content/5etools-items.ts` (+ `.unit.test.ts`), `scripts/content/import-5etools-items.ts`
- Modificar: `package.json` (`"content:items": "npx tsx scripts/content/import-5etools-items.ts"`)
- Gerar: `content/dnd5e/srd-5.{1,2}/items.json`, `i18n/en/items.json`, `i18n/pt/items.json` (`{}`)

**Interfaces (produz):**

- `itemDataSchema`: `{ id, category, value?: number /* PC */, weight?: number /* lb */,
strength?: number, stealthDisadvantage?: true, ac?: number, damage?: { dice: string, type:
string }, versatile?: string, properties?: string[], range?: string }`
- `ItemCategory = 'weapon' | 'armor' | 'shield' | 'gear' | 'tool' | 'kit' | 'ammunition' |
'focus' | 'instrument' | 'mount' | 'vehicle' | 'food' | 'trade-good' | 'other'`
- `itemTextSchema`: `{ name: string (min 1), description?: string }`;
  `itemTranslationSchema` = parcial de `{ name, description }`.
- `toItemId(item)`, `toItemData(item): ItemData`, `toItemText(item): ItemText`, `isCommonSrdItem(item, book)`.

- [ ] **Passo 1: testes do esquema** (`item.schema.unit.test.ts`): aceita a Armadura de Placas
      (`{ id: 'plate-armor', category: 'armor', value: 150000, weight: 65, ac: 18, strength: 15,
stealthDisadvantage: true }`); recusa id com maiúscula, categoria fora da lista, `value`
      negativo.
- [ ] **Passo 2: testes da conversão** (`5etools-items.unit.test.ts`), com objetos do 5etools
      copiados dos arquivos:
  - `toItemData(plate)` dá o objeto do passo 1 (`strength: "15"` vira `15`; `type: 'HA|XPHB'` vira
    `armor`).
  - Espada longa (XPHB): `damage: { dice: '1d8', type: 'slashing' }`, `versatile: '1d10'`,
    `properties` com os códigos sem a fonte (`['V']`), categoria `weapon`.
  - Corda de cânhamo e Mochila: `gear`; Kit de Estudioso: `kit`; Escudo: `shield`, `ac: 2`.
  - `isCommonSrdItem` recusa Poção de Cura (`rarity: 'common'`, é mágica) e aceita item sem
    `rarity`; recusa item sem a marca do livro.
  - `toItemText` usa `renderEntries` das magias e mantém as tags; item sem `entries` não tem
    `description`.
  - `toItemId` de "Arrows (20)" é `arrows-20`.
- [ ] **Passo 3:** rodar `npx vitest run --config ./test/vitest.config.unit.ts scripts/content/5etools-items shared/systems/dnd5e/content/item.schema` → FALHA (módulos não existem).
- [ ] **Passo 4:** implementar esquema e conversão. Mapa de `type` (sem a fonte depois do `|`):
      `M`/`R` → weapon, `LA`/`MA`/`HA` → armor, `S` → shield, `A`/`AF` → ammunition, `AT`/`GS`/`T` →
      tool, `INS` → instrument, `SCF` → focus, `MNT`/`TAH` → mount, `VEH`/`SHP`/`AIR` → vehicle,
      `FD` → food, `TG`/`$` → trade-good, `G` → gear (ou `kit` quando o item tem `packContents`),
      sem `type` → gear, resto → other.
- [ ] **Passo 5:** rodar os testes → PASSA.
- [ ] **Passo 6:** script de importação igual ao `import-5etools-conditions.ts`: lê
      `items-base.json` (`baseitem`) e `items.json` (`item`), junta, filtra por livro (`XPHB`+`srd52`
      → `srd-5.2`, `PHB`+`srd` → `srd-5.1`) e `isCommonSrdItem`, ordena por id, **falha se dois itens
      derem o mesmo id**, grava dados e en, cria pt vazio só se não existir. Rodar `npm run
content:items`; conferir no log ~230 por livro.
- [ ] **Passo 7: commit** `feat(items): itens comuns do SRD em arquivo`.

### Tarefa 2: Nomes em português

**Arquivos:** `content/dnd5e/srd-5.{1,2}/i18n/pt/items.json`

- [ ] **Passo 1:** preencher `{ "<id>": { "name": "…" } }` para todos os ids dos dois livros. Usar
      os nomes do Livro do Jogador em português quando forem conhecidos ("Corda de Cânhamo",
      "Armadura de Placas", "Kit de Estudioso"), o mesmo nome para o mesmo id nos dois livros.
- [ ] **Passo 2: teste de conteúdo** em `src/backend/contexts/items/infrastructure/srd-items.unit.test.ts`
      (criado na Tarefa 3; pode nascer aqui): todo id de cada livro tem `name` pt não vazio; nenhum id
      pt sobra sem item.
- [ ] **Passo 3: commit** `i18n(items): nomes dos itens em português`. No PR, pedir revisão dos
      nomes.

### Tarefa 3: Catálogo e rota `GET /api/items`

**Arquivos:**

- Modificar: `shared/content/content-key.ts` (`itemKey(source, id)`)
- Criar: `src/backend/contexts/items/{index.ts, domain/item.ts,
infrastructure/file-item-catalog.ts, infrastructure/srd-items.ts,
interfaces/items.api.ts, interfaces/items.schemas.ts}` (+ testes unit de catálogo)
- Criar: `app/api/items/route.ts` (+ `route.unit.test.ts`)
- Modificar: `src/backend/shared/providers/contexts.ts` (`get items()`), `src/backend/index.ts`
  (`itemsApi`), `test/helpers/mock-api.ts` (`itemsApi.list`)

**Interfaces (produz):**

- `ItemDto { key, id, edition, category, name, description: string | null, value: number | null,
weight: number | null, strength: number | null, stealthDisadvantage: boolean, ac: number | null,
damage: { dice: string; type: string } | null, versatile: string | null, properties: string[],
range: string | null, untranslated: boolean }`
- `ItemCatalog { list(locale?: string): ItemDto[]; find(key: string): ItemDto | null;
findByKeys(keys: string[], locale?: string): ItemDto[] }`
- `getItemCatalog(): FileItemCatalog` (lazy, como `getConditionCatalog`).

- [ ] **Passo 1: testes** de `FileItemCatalog` com duas fontes pequenas montadas no teste:
      `list('pt')` traz o nome pt e `untranslated: true` quando falta descrição pt; `list('fr')` cai
      no en; `find(itemKey('srd-5.2','rope-hempen'))` acha; `find` de chave inexistente → `null`;
      `findByKeys` mantém a ordem e pula as desconhecidas; ordenação por edição, depois nome.
- [ ] **Passo 2: teste da rota:** `GET /api/items?locale=pt` chama `itemsApi.list('pt')` e
      responde 200; locale inválido → 400 (mesmo esquema de `listConditionsQuerySchema`).
- [ ] **Passo 3:** rodar → FALHA. **Passo 4:** implementar, copiando a forma do contexto de
      condições. **Passo 5:** rodar → PASSA.
- [ ] **Passo 6: commit** `feat(items): catálogo de itens e rota de listagem`.

### Tarefa 4: Tabelas, RLS e lugares padrão

**Arquivos:**

- Criar: `database/migrations/<ts>_character_inventory.sql`
- Modificar: `database/db-dev/seeds/02-seed-mage-character.sql` (tirar `coins` do `system_data`;
  depois do insert do Alatar, `UPDATE character_containers SET coins = '{"cp":0,"sp":50,"ep":0,"gp":120,"pp":0}'
WHERE character_id = '<Alatar>' AND kind = 'coin_pouch'`)
- Regenerar: `lib/types/database.ts`
- Criar: `src/backend/contexts/characters/infrastructure/inventory-rls.integration.test.ts`

**O SQL decide:**

- `character_containers(id uuid pk default gen_random_uuid(), character_id uuid not null
references characters on delete cascade, kind text not null check (kind in
('coin_pouch','backpack','chest')), name text check (char_length(name) <= 60), position int not
null default 0, coins jsonb not null default '{"cp":0,"sp":0,"ep":0,"gp":0,"pp":0}' check (cada
uma das cinco chaves é inteiro de 0 a 1000000000), created_at timestamptz default now())`;
  índice único parcial `(character_id) where kind = 'coin_pouch'`.
- `character_items(id uuid pk, character_id uuid not null references characters on delete cascade,
container_id uuid not null references character_containers on delete cascade, item_ref text not
null check (char_length(item_ref) <= 120), quantity int not null check (quantity between 1 and
9999), created_at timestamptz default now())`; único `(container_id, item_ref)`;
  check de que o lugar é do mesmo personagem (trigger, já que é outra tabela).
- Trigger `after insert on characters`: cria `coin_pouch` (position 0) e `backpack` (position 1).
- Trigger `before delete on character_containers`: recusa apagar `coin_pouch` (exceto em cascata
  do personagem: conferir `characters` ainda existe).
- Limites (trigger `before insert`): 20 lugares e 500 entradas por personagem.
- Backfill: algibeira e mochila para todo personagem existente sem elas.
- RLS: dono `FOR ALL` (como `owner_can_manage_character_spell`); mestre `FOR SELECT USING
(character_id IN (SELECT private.gm_readable_character_ids()))`. Grants iguais aos de
  `character_spells` em `20261020130000_least_privilege_grants.sql`.
- `duplicate_character`: depois das magias, copiar moedas da algibeira original para a da cópia,
  copiar os demais lugares do original (exceto a mochila padrão, que já existe: casar a primeira
  `backpack` com a primeira) mapeando ids, e copiar `character_items` com o `container_id`
  mapeado.

- [ ] **Passo 1: testes de integração** (`inventory-rls.integration.test.ts`, mesmo preparo do
      `gm-reads-rls`):
  - personagem novo tem exatamente uma `coin_pouch` e uma `backpack` (Ponto 1);
  - dono põe item na mochila e muda moedas; mestre da mesa lê lugares e itens e não consegue
    inserir, mudar nem apagar (Ponto 5); colega de mesa e estranho não leem nada;
  - apagar a algibeira falha; inserir segunda algibeira falha; apagar o personagem apaga tudo;
  - `quantity` 0 e 10000 falham; moedas negativas falham;
  - item num lugar de outro personagem falha;
  - `duplicate_character` copia moedas e itens para os lugares da cópia, e o original não muda
    (Ponto 1).
- [ ] **Passo 2:** rodar `npm run test:integration -- inventory-rls` → FALHA.
- [ ] **Passo 3:** escrever a migração, aplicar no banco de teste e no de dev, regenerar tipos,
      atualizar o seed.
- [ ] **Passo 4:** rodar → PASSA; rodar também `gm-reads-rls` e os testes de duplicar.
- [ ] **Passo 5: commit** `feat(inventory): tabelas de lugares e itens do personagem`.

### Tarefa 5: Inventário no contexto de personagens e rotas

**Arquivos:**

- Criar: `src/backend/contexts/characters/domain/repository/inventory.repo.ts`,
  `infrastructure/repositories/supabase-inventory.repository.ts`,
  `application/inventory/inventory.use-cases.ts` (+ `.unit.test.ts`)
- Modificar: `application/CharacterContext.ts`, `index.ts`, `interfaces/characters.api.ts`,
  `interfaces/characters.schemas.ts`, `domain/CharacterError.ts` (`ITEM_NOT_FOUND`,
  `CONTAINER_NOT_FOUND`, `NOT_ENOUGH_COINS` se precisar)
- Criar rotas: `app/api/characters/[id]/inventory/route.ts` (GET),
  `.../inventory/items/route.ts` (POST), `.../inventory/items/[itemId]/route.ts` (PATCH, DELETE),
  `.../inventory/coins/route.ts` (PUT), `app/api/parties/[partyId]/characters/[id]/inventory/route.ts`
  (GET do mestre); cada uma com `route.unit.test.ts`
- Modificar: `test/helpers/mock-api.ts`

**Interfaces (produz):**

- `InventoryDto { containers: { id, kind, name: string | null, position, coins: Coins }[];
items: { id, containerId, ref, quantity, item: ItemDto | null }[] }` (`item: null` quando a ref
  saiu do catálogo, Ponto 2)
- `CharacterContext`: `getInventory(id, requesterId, locale?)`, `addItem(id, requesterId,
{ ref, containerId, quantity }, locale?) → InventoryItemDto`, `setItemQuantity(id, requesterId,
itemId, quantity) → void`, `removeItem(id, requesterId, itemId) → void`, `setCoins(id,
requesterId, containerId, coins) → void`, `getInventoryForPartyGm(partyId, id, gmId, locale?)`
- `InventoryRepo`: `find(characterId)`, `addItem(characterId, containerId, ref, quantity)` (upsert
  que soma no banco, Ponto 3), `setQuantity(characterId, itemId, quantity)`, `remove(characterId,
itemId)`, `setCoins(characterId, containerId, coins)`. As escritas devolvem `false` quando
  nenhuma linha mudou.

- [ ] **Passo 1: testes dos casos de uso** (repositório e catálogo falsos): `addItem` com ref fora
      do catálogo → `ITEM_NOT_FOUND`; com `containerId` de outro personagem → `CONTAINER_NOT_FOUND`;
      quem não é dono → erro de acesso antes de tocar no repositório (Ponto 5); `setCoins` com
      negativo é barrado pelo esquema (Ponto 4); `getInventory` com ref que sumiu devolve `item: null`
      e não quebra (Ponto 2).
- [ ] **Passo 2: testes das rotas**: cada uma valida params/body (uuid, `quantity` 1–9999,
      `coins` com as cinco chaves inteiras ≥ 0) e chama a função certa com `SESSION_USER.id`.
- [ ] **Passo 3:** rodar → FALHA. **Passo 4:** implementar. **Passo 5:** rodar → PASSA.
- [ ] **Passo 6: teste de integração** no `inventory-rls.integration.test.ts`: o upsert de
      `addItem` duas vezes soma 2 (Ponto 3).
- [ ] **Passo 7: commit** `feat(inventory): rotas do inventário`.

### Tarefa 6: Algibeira no banco

**Arquivos:**

- Modificar: tirar `coins` de `shared/systems/dnd5e/types.ts`, `DnD5eCharacter.ts`,
  `update-character.use-case.ts` (+ teste), `characters.schemas.ts` (+ teste),
  `supabase-character.repository.ts`, `src/frontend/lib/character-changes.unit.test.ts`
- Modificar: `shared/systems/dnd5e/coins.ts` (`Coins` passa a ser um tipo próprio, não derivado de
  `DnD5eCharacter`)
- Criar: `src/frontend/hooks/useInventory.ts` (+ teste)
- Modificar: `CoinPouch.tsx` (+ teste), a página do inventário (sem `SaveCharacterButton`)

**Interfaces (produz):** `useInventory(characterId)` →
`{ inventory: InventoryDto | undefined, isLoading, pouch, backpack, addItem(ref), setQuantity(itemId, n),
removeItem(itemId), restoreItem(item), setCoins(coins) }`. Query `['inventory', id, locale]`,
lendo de `useSheetSource(id).apiPath + '/inventory'`; mutações otimistas com `onError` que volta o
cache e mostra `toast.error`.

- [ ] **Passo 1:** ajustar os testes do `CoinPouch`: as moedas vêm do inventário (API falsa), Pagar
      e Receber chamam `PUT .../inventory/coins` com o resultado e a tela mostra na hora; erro do
      servidor volta os números de antes (Ponto 4). Na ficha somente leitura, botões desativados.
- [ ] **Passo 2:** rodar → FALHA. **Passo 3:** implementar. **Passo 4:** rodar o unit inteiro → PASSA.
- [ ] **Passo 5: commit** `refactor(inventory): moedas na algibeira do inventário`.

### Tarefa 7: Mochila na tela

**Arquivos:**

- Criar: `src/frontend/hooks/useItems.ts` (como `useConditions`: lista inteira, `byKey`,
  `staleTime: Infinity`)
- Criar em `src/frontend/components/character/inventory/`: `Backpack.tsx`, `ItemRow.tsx`,
  `ItemDetails.tsx`, `AddItemDialog.tsx`, `format-price.ts` (+ testes)
- Modificar: a página do inventário; `messages/en.json` e `pt.json` (`characters.inventory.*`,
  categorias)

**Interfaces (produz):** `formatPrice(copper: number): { amount: number; coin: Coin }`;
`ItemDetails({ item }: { item: ItemDto })` (reusado pela Tarefa 8).

- [ ] **Passo 1: testes**
  - `formatPrice`: 150000 → 1500 gp; 5 → 5 cp; 50 → 5 sp (nunca PE); 1000 → 10 gp.
  - `Backpack`: vazia mostra o estado vazio com "Adicionar item"; lista nome pt, quantidade, peso e
    preço; − na quantidade 1 não vai a 0 (remover é nos detalhes); + chama `setQuantity`; peso
    total = Σ peso × quantidade, com 1 casa decimal; linha com `item: null` mostra a ref e o
    remover (Ponto 2).
  - `ItemDetails`: Armadura de Placas mostra CA 18, Força 15, desvantagem em Furtividade, 1.500 PO,
    65 lb; descrição pelo `RulesText`; sem descrição pt, mostra a en com
    `lang="en"` e o selo "não traduzido" das magias.
  - Remover mostra toast com "Desfazer", que chama `restoreItem`.
  - `AddItemDialog`: busca sem acento acha "Cânhamo" por "canhamo" e por "hempen"; filtro de
    categoria; edição começa na que mais aparece na mochila, ou 2024 com a mochila vazia; escolher
    chama `addItem(key)` e fecha.
- [ ] **Passo 2:** rodar → FALHA. **Passo 3:** implementar (busca local sobre `useItems().list`,
      normalizando acento como `FileSpellCatalog.normalize`). **Passo 4:** rodar → PASSA.
- [ ] **Passo 5:** conferir no app (dev) desktop e 390 px: adicionar Corda, + e −, detalhes,
      remover e desfazer, peso total; e pela rota da mesa como mestre (só leitura).
- [ ] **Passo 6: commit** `feat(inventory): mochila com itens do SRD`.

### Tarefa 8: Tag `{@item}`

**Arquivos:**

- Criar: `src/frontend/components/content/ItemHint.tsx` (+ teste)
- Modificar: `src/frontend/components/content/RulesText.tsx` (+ teste)
- Criar: `src/backend/contexts/items/infrastructure/item-tags.unit.test.ts` (conferência)

- [ ] **Passo 1: testes:** `RulesText` com `{@item Rope|XPHB|corda}` num texto de `srd-5.2` mostra um botão "corda" que abre os detalhes (via `ItemDetails`); tag de item
      mágico ou id desconhecido mostra o texto, sem botão; dentro de `nested`, texto.
- [ ] **Passo 2:** a tag do 5etools usa o **nome** do item (`{@item Rope|XPHB}`),
      não o id: resolver por `toItemId(nome)` no mesmo livro. Teste de conferência lista (sem falhar)
      as tags `{@item}` das magias e condições que não resolvem.
- [ ] **Passo 3:** rodar → FALHA. **Passo 4:** implementar. **Passo 5:** rodar → PASSA.
- [ ] **Passo 6: commit** `feat(items): tag de item clicável no texto de regra`.

### Tarefa 9: Ponta a ponta e fechamento

**Arquivos:** `e2e/inventory.spec.ts`; `e2e/visual/screens.visual.spec.ts` (tela do inventário)

- [ ] **Passo 1:** e2e: entrar, abrir o inventário, receber 10 PO, pagar 5 PO e ver o troco,
      adicionar "Corda", aumentar para 2, recarregar a página e ver tudo salvo.
- [ ] **Passo 2:** visual: inventário com algibeira e mochila com dois itens, desktop e celular;
      `npm run test:visual -- --update-snapshots=all`.
- [ ] **Passo 3:** rodar a sequência da CI: `npx tsc --noEmit`, `npm run lint`, `npm run knip`,
      `npm run test:coverage`, `npm run test:integration`, `npx playwright test`, `npm run test:visual`.
- [ ] **Passo 4: commit** `test(inventory): ponta a ponta e telas`; abrir o PR (pt + en), com o
      aviso de rodar a Action do Crowdin depois do merge e o pedido de revisão dos nomes pt.
