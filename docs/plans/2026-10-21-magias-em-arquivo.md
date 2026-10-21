# Magias oficiais em arquivo — plano de implementação (PR A)

> **Para quem executa:** use superpowers:subagent-driven-development (recomendado) ou
> superpowers:executing-plans, tarefa por tarefa. Passos com checkbox (`- [ ]`).

**Objetivo:** as 319 magias do SRD 5.1 saem do banco e passam a ser arquivos JSON versionados no
repositório, com chave estável por fonte; o personagem aponta para essa chave. Para quem usa, nada
muda (mesma busca, mesmos textos, mesmo grimório).

**Arquitetura:** os arquivos ficam em `content/dnd5e/srd-5.1/` (dados mecânicos + textos por
idioma), validados por schemas Zod em `shared/systems/dnd5e/content/`. Um `FileSpellCatalog` no
contexto `spells` carrega os arquivos em memória e substitui o `SupabaseSpellsRepository` (busca,
filtros, paginação, fallback de idioma). `character_spells` troca `spell_id` (UUID com FK) por
`spell_ref` (texto, `dnd5e:srd-5.1:spell:fireball`), e o contexto `characters` resolve as
referências pelo catálogo.

**Stack:** Next.js (App Router), TypeScript, Zod, Supabase/Postgres, Vitest, Playwright.

**Especificação:** `docs/plans/2026-10-15-conteudo-e-homebrew.md` (seções 1 e 3, ordem 1–3) e
`docs/plans/2026-10-15-5etools-e-traducoes.md` (fallback de idioma). Decisões da conversa de
2026-10-21 estão em "Decisões" abaixo.

**Fica para o PR B** (`2026-10-21-magias-por-edicao.md`, a escrever): importador do 5etools,
magias do SRD 5.2 (2024), etiqueta de edição, filtro e selo na lista, selo de "tradução
automática", e a migração que apaga `spells` / `spell_translations` e a seed antiga.

## Decisões

- **Uma entrada por fonte.** O Fireball de 2014 (`dnd5e:srd-5.1:spell:fireball`) e o de 2024
  (`dnd5e:srd-5.2:spell:fireball`) são entradas separadas, cada uma com seus textos e traduções.
  Na lista aparecem como dois cartões. (PR B; este PR só cria o formato com a fonte na chave.)
- **Edição é etiqueta, não identidade** (vale também para homebrew). PR B.
- **Os arquivos deste PR vêm do banco de hoje**, não do 5etools: o objetivo é trocar o
  armazenamento sem mudar nenhum texto. O 5etools entra no PR B.
- **Fallback de idioma:** sem texto no idioma pedido, usa o inglês (as 4 magias sem `pt` hoje:
  `meld-into-stone`, `commune-with-nature`, `pass-without-trace`, `protection-from-energy`, que
  hoje simplesmente somem da busca em português).
- **As tabelas `spells` e `spell_translations` ficam intocadas neste PR** (sem leitura do app); são
  apagadas no PR B, depois de um deploy confirmando que nada as lê.

## Restrições globais

- Locales do app: `en` e `pt` (não `pt-BR`).
- Chave: `<sistema>:<fonte>:<tipo>:<id>`, regex `^dnd5e:[a-z0-9.-]+:spell:[a-z0-9-]+$`, até 200
  caracteres.
- Merge na `main` aplica migrações em produção na hora (`deploy-migrations.yml`): a migração precisa
  converter os dados existentes em uma transação.
- Código do servidor só; os JSON não podem ir para o bundle do navegador.
- Textos de interface via next-intl; o pre-commit roda os guardas (`hardcoded-text`, tokens,
  game-icons).
- Um PR, commits por tópico, descrição em português.

## Foco da revisão

1. **Busca com acento e maiúsculas:** "bola de fogo", "BOLA", "relampago" (sem acento) acham "Bola
   de Fogo"/"Relâmpago". Hoje o `ilike` não ignora acento; o catálogo novo ignora (Tarefa 3).
2. **Idioma sem tradução:** as 4 magias sem `pt` aparecem em português com o texto em inglês, na
   busca e no grimório (Tarefas 3 e 4).
3. **Personagem com magia que sumiu do catálogo:** referência sem entrada não quebra o grimório;
   a magia é omitida (Tarefa 4).
4. **Aprender magia inexistente pela API:** chave bem formada mas desconhecida responde 404 com
   `character_error_spell_not_found`, não 500 (Tarefa 4).
5. **Ordem estável na paginação:** mesmas magias por página entre chamadas e sem repetir entre
   páginas (nível, depois nome no idioma, depois id) (Tarefa 3).

---

## Arquivos

| Arquivo                                                            | Papel                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `shared/content/content-key.ts`                                    | montar e ler a chave `sistema:fonte:tipo:id`                |
| `shared/systems/dnd5e/content/spell.schema.ts`                     | schemas Zod dos dados e dos textos de magia                 |
| `scripts/export-spells.ts`                                         | exporta o banco atual para os JSON (uso único; sai no PR B) |
| `content/dnd5e/srd-5.1/spells.json`                                | dados mecânicos, ordenados por `id`                         |
| `content/dnd5e/srd-5.1/i18n/{en,pt}/spells.json`                   | textos por idioma, `{ [id]: SpellText }`                    |
| `content/dnd5e/content.unit.test.ts`                               | valida os arquivos no CI                                    |
| `src/backend/contexts/spells/infrastructure/file-spell-catalog.ts` | catálogo em memória                                         |
| `src/backend/contexts/spells/infrastructure/srd-spells.ts`         | importa os JSON e monta o catálogo (singleton)              |
| `database/migrations/20261021120000_character_spells_ref.sql`      | `spell_id` → `spell_ref`                                    |

---

### Tarefa 1: Chave de conteúdo e schemas de magia

**Arquivos:**

- Criar: `shared/content/content-key.ts`, `shared/content/content-key.unit.test.ts`
- Criar: `shared/systems/dnd5e/content/spell.schema.ts`,
  `shared/systems/dnd5e/content/spell.schema.unit.test.ts`

**Interfaces:**

- Produz:
  - `spellKey(source: string, id: string): string` → `dnd5e:${source}:spell:${id}`
  - `parseSpellKey(key: string): { source: string; id: string } | null` (null se não casar a regex)
  - `spellKeySchema` (Zod string com a regex e `max(200)`)
  - `spellDataSchema` com os campos de `spells` em camelCase: `id`, `level` (0–9), `school`,
    `classes: string[]`, `components: ('V'|'S'|'M')[]`, `castingTime`, `castingValue`,
    `rangeUnit`, `rangeValue`, `durationUnit`, `durationValue` (todos `nullable`),
    `concentration`, `ritual`, `isScaling` (boolean), `materialCost` (int ≥ 0),
    `damageType` (string nullable), `spellCategory` (`'buff' | 'control' | 'utility'`,
    nullable: os valores que existem no banco), `bgStyleId` (string nullable)
  - `spellTextSchema`: `name` (min 1), `description` (min 1), `higherLevel` e `material`
    (nullable)
  - tipos `SpellData = z.infer<typeof spellDataSchema>`, `SpellText = z.infer<…>`

- [ ] **Passo 1: testes que falham**

```ts
it('monta e lê a chave', () => {
  expect(spellKey('srd-5.1', 'fireball')).toBe('dnd5e:srd-5.1:spell:fireball');
  expect(parseSpellKey('dnd5e:srd-5.2:spell:fireball')).toEqual({
    source: 'srd-5.2',
    id: 'fireball',
  });
});
it.each([
  'fireball',
  'dnd5e:srd-5.1:item:rope',
  'dnd5e:srd 5.1:spell:x',
  'e2e00000-0000-4000-8000-000000000001',
])('recusa %s', (key) => expect(parseSpellKey(key)).toBeNull());
it('aceita uma magia completa e recusa nível 10', () => {
  expect(spellDataSchema.safeParse(fireballData).success).toBe(true);
  expect(spellDataSchema.safeParse({ ...fireballData, level: 10 }).success).toBe(false);
});
```

- [ ] **Passo 2:** `npx vitest run --config ./test/vitest.config.unit.ts shared/content shared/systems/dnd5e/content` → FALHA (módulos não existem)
- [ ] **Passo 3:** implementar os dois arquivos
- [ ] **Passo 4:** mesmo comando → PASSA
- [ ] **Passo 5:** commit `feat(conteúdo): chave estável e schemas de magia`

### Tarefa 2: Exportar as magias do banco para arquivos

**Arquivos:**

- Criar: `scripts/export-spells.ts`
- Criar (gerados): `content/dnd5e/srd-5.1/spells.json`, `content/dnd5e/srd-5.1/i18n/en/spells.json`,
  `content/dnd5e/srd-5.1/i18n/pt/spells.json`
- Criar: `content/dnd5e/content.unit.test.ts`

**Interfaces:**

- Consome: `spellDataSchema`, `spellTextSchema` (Tarefa 1).
- Produz: os três JSON. `spells.json` é `SpellData[]` ordenado por `id`; cada `i18n/<locale>/spells.json`
  é `Record<id, SpellText>` com chaves ordenadas.

- [ ] **Passo 1: teste dos arquivos (falha: não existem)**

```ts
it('toda magia passa no schema e os ids são únicos', …);          // 319 entradas
it('toda magia tem texto em inglês', …);
it('as traduções só têm ids que existem', …);
it('em português faltam só as 4 conhecidas', () => {
  expect(missingPt).toEqual(['commune-with-nature', 'meld-into-stone', 'pass-without-trace', 'protection-from-energy']);
});
```

- [ ] **Passo 2:** rodar → FALHA
- [ ] **Passo 3:** escrever `scripts/export-spells.ts`: lê `spells` + `spell_translations` com o
      service role (`DB_URL` ou a URL/chave do `supabase status --workdir database/db-dev`), mapeia
      snake_case → camelCase, valida com os schemas e grava os JSON com `JSON.stringify(…, null, 2)` +
      `\n`. Cabeçalho do script: "uso único, substituído pelo importador do 5etools no PR B".
- [ ] **Passo 4:** `npx supabase db reset --workdir database/db-dev` (banco de dev com todas as
      migrações) e `npx tsx scripts/export-spells.ts` → 319 magias, 319 textos `en`, 315 `pt`
- [ ] **Passo 5:** rodar o teste → PASSA; `npx prettier --check content` limpo
- [ ] **Passo 6:** commit `feat(conteúdo): magias do SRD 5.1 em arquivo`

### Tarefa 3: `FileSpellCatalog` no lugar do repositório Supabase

**Arquivos:**

- Criar: `src/backend/contexts/spells/infrastructure/file-spell-catalog.ts` + `.unit.test.ts`
- Criar: `src/backend/contexts/spells/infrastructure/srd-spells.ts`
- Modificar: `src/backend/contexts/spells/domain/repository/spells.repo.ts` (adicionar `findByKeys`)
- Modificar: `src/backend/contexts/spells/index.ts` (`createSpellsContext()` sem cliente do banco;
  exportar `getSpellCatalog()`), `src/backend/index.ts` (chamada)
- Apagar: `supabase-spells.repository.ts` e `supabase-spells.repository.integration.test.ts`

**Interfaces:**

- Consome: `SpellData`, `SpellText`, `spellKey` (Tarefa 1); os JSON (Tarefa 2).
- Produz:
  - `interface SpellSource { source: string; spells: SpellData[]; texts: Record<string, Record<string, SpellText>> }`
    (`texts[locale][id]`)
  - `class FileSpellCatalog implements SpellsRepo` com `constructor(sources: SpellSource[])`,
    `findAll(params?: FindSpellsParams): Promise<PaginatedSpells>` (mesma assinatura de hoje) e
    `findByKeys(keys: string[], locale?: string): Promise<SpellDto[]>` (na ordem pedida, omitindo
    chaves desconhecidas)
  - `SpellDto.id` passa a ser a chave (`dnd5e:srd-5.1:spell:fireball`); `SpellDto` é exportado
  - `getSpellCatalog(): FileSpellCatalog` (instância única com a fonte `srd-5.1`)

- [ ] **Passo 1: testes que falham** (catálogo com 4 magias de fixture, `en` e `pt`, uma sem `pt`):
  - `findAll({ locale: 'pt', search: 'bola de fogo' })` acha `Bola de Fogo`; `'BOLA'` e
    `'relampago'` também (sem acento, sem caixa)
  - filtros `level`, `school`, `class` (contido em `classes`), `damageType` iguais aos de hoje
  - ordem: nível, depois nome no idioma (`localeCompare`), depois id; `page`/`limit` com `total`
    certo; páginas 0 e 1 sem repetição
  - magia sem `pt` aparece com o texto em inglês quando `locale: 'pt'`
  - `id` devolvido é a chave completa
  - `findByKeys(['dnd5e:srd-5.1:spell:x', 'dnd5e:srd-5.1:spell:inexistente'], 'pt')` devolve só `x`
- [ ] **Passo 2:** rodar → FALHA
- [ ] **Passo 3:** implementar. Normalização da busca: `s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()`.
      Índice por fonte+id montado no construtor. `srd-spells.ts` importa os JSON com
      `import … with { type: 'json' }` (ou `import x from '…json'`), valida com os schemas uma vez
      e exporta a instância; só é importado pelo backend.
- [ ] **Passo 4:** rodar → PASSA; `npm run test:unit` inteiro → PASSA
      (`get-all-spells.use-case.unit.test.ts` continua igual)
- [ ] **Passo 5:** conferir que o bundle do navegador não inclui os JSON: `npx next build` e
      `grep -rl "Acid Arrow" .next/static` → nada
- [ ] **Passo 6:** commit `feat(magias): busca no catálogo em arquivo, com fallback de idioma`

### Tarefa 4: `character_spells` aponta para a chave

**Arquivos:**

- Criar: `database/migrations/20261021120000_character_spells_ref.sql`
- Modificar: `lib/types/database.ts` (regenerar com
  `npx supabase gen types typescript --workdir database/db-dev --local`)
- Modificar: `src/backend/contexts/characters/domain/repository/character-spell.repo.ts`,
  `infrastructure/repositories/supabase-character-spell.repository.ts`,
  `application/spells/get-character-spells.use-case.ts`,
  `application/spells/toggle-character-spell.use-case.ts`, `index.ts`,
  `domain/CharacterError.ts` (+ `messages/{en,pt}.json`)
- Modificar: `src/backend/contexts/characters/interfaces/characters.schemas.ts`
  (`toggleSpellSchema.id: spellKeySchema`)
- Testes: `application/spells/character-spells.use-case.unit.test.ts`,
  `infrastructure/repositories/rls.integration.test.ts`

**Interfaces:**

- Consome: `getSpellCatalog().findByKeys`, `findByKeys` para validar (Tarefa 3); `spellKeySchema`
  (Tarefa 1).
- Produz:
  - `CharacterSpellRepo.findByCharacterId(characterId): Promise<{ ref: string; isPrepared: boolean; createdAt?: string }[]>`
    (sem `locale`); `learn/forget/togglePrepared(characterId, ref, …)` com `ref` no lugar do id
  - `GetCharacterSpellsUseCase(characterRepo, spellRepo, catalog: Pick<SpellsRepo, 'findByKeys'>)`
    devolve `CharacterSpellRelation[]` (`id` = chave), mesmos campos de hoje; referências fora do
    catálogo são omitidas
  - `ToggleCharacterSpellUseCase(characterRepo, spellRepo, catalog)`: em `learn`, chave fora do
    catálogo → `CharacterError(SPELL_NOT_FOUND)` (`character_error_spell_not_found`, kind
    `not_found`)

- [ ] **Passo 1: migração** (uma transação):
  1. `ALTER TABLE character_spells ADD COLUMN spell_ref TEXT;`
  2. `UPDATE … SET spell_ref = 'dnd5e:srd-5.1:spell:' || s.external_index FROM spells s WHERE s.id = spell_id;`
  3. `DELETE` das linhas sem correspondência (não deve haver; a FK garantia), `SET NOT NULL`,
     `CHECK (spell_ref ~ '^dnd5e:[a-z0-9.-]+:spell:[a-z0-9-]+$')`
  4. trocar a PK para `(character_id, spell_ref)` e `DROP COLUMN spell_id`
  - Aplicar no dev e no teste: `npx supabase migration up --workdir database/db-dev` e
    `--workdir database/db-test`; regenerar `lib/types/database.ts`
- [ ] **Passo 2: testes que falham** (unit, com repositório e catálogo falsos):
  - grimório devolve a magia resolvida pelo catálogo, com `isPrepared`, e omite referência
    desconhecida
  - `learn` com chave desconhecida → rejeita com `character_error_spell_not_found`
  - `learn` com chave conhecida → chama `spellRepo.learn(characterId, chave)`
  - `toggleSpellSchema` recusa UUID e aceita a chave
  - `rls.integration.test.ts`: o intruso aprende `dnd5e:srd-5.1:spell:fireball` no personagem
    de outro → rejeita
- [ ] **Passo 3:** rodar unit → FALHA
- [ ] **Passo 4:** implementar (repositório Supabase só lê/escreve `character_spells`; o caso de
      uso junta com o catálogo; `index.ts` injeta `getSpellCatalog()`)
- [ ] **Passo 5:** `npm run test:unit` e `npm run test:integration` → PASSAM
- [ ] **Passo 6:** commit `feat(magias): grimório aponta para a chave do catálogo`

### Tarefa 5: Seeds, e2e e conferência no app

**Arquivos:**

- Modificar: `database/db-dev/seeds/02-seed-mage-character.sql` (`spell_ref` literal no lugar do
  `SELECT … FROM spells`)
- Modificar: `e2e/support/global-setup.ts` (não insere mais em `spells`; `SPELLS` vira
  `{ fireball: { id: 'dnd5e:srd-5.1:spell:fireball', name: 'Fireball' }, … }`)
- Modificar: `e2e/spells.spec.ts`, `e2e/navigation.mobile.spec.ts`,
  `e2e/visual/screens.visual.spec.ts` — o catálogo agora é o real (319 magias, 12 por página):
  buscar por nome exato onde o teste conta resultados ("Fireball" também acha "Delayed Blast
  Fireball"), e a tela visual do catálogo filtrada para ficar estável
- Modificar: `scripts/capture-showcase.ts` só se usar UUID de magia

- [ ] **Passo 1:** `npx supabase db reset --workdir database/db-dev` → seed roda sem erro; Alatar
      continua com as magias dele
- [ ] **Passo 2:** `npm run test:e2e` → PASSA; `npm run test:visual -- --update-snapshots=all`
      (as telas da ficha também mudaram no #80) e conferir os PNG gerados
- [ ] **Passo 3:** no `next dev`: buscar "bola de fogo" e "relampago" em português, aprender e
      esquecer uma magia, preparar, recarregar a ficha do Alatar; abrir uma das 4 magias sem `pt`
- [ ] **Passo 4:** commit `test(magias): e2e e seeds com o catálogo em arquivo`
- [ ] **Passo 5:** atualizar `docs/plans/2026-10-20-roadmap.md` (itens 5 e 6 em andamento) e os
      planos de conteúdo e 5etools com o que foi feito; commit `docs(planos): magias em arquivo`
