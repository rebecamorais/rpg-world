# Magias por edição (SRD 5.2 pelo 5etools) — plano de implementação (PR B)

**Status:** entregue no #97 (2026-10-22). Ficou para depois:

- Truques de 2024: o "Cantrip Upgrade" aparece sob o rótulo "Em níveis superiores"; trocar o
  rótulo quando a magia é truque.
- Plant Growth: só o primeiro tempo de conjuração (1 ação), sem o de 8 horas; o formato guarda um
  tempo só.
- Reações e ações bônus sem a condição de uso (Counterspell, Feather Fall…); o formato não tem
  campo para isso.

> **Para quem executa:** use superpowers:subagent-driven-development (recomendado) ou
> superpowers:executing-plans, tarefa por tarefa. Passos com checkbox (`- [ ]`).

**Objetivo:** as 339 magias do SRD 5.2 (2024) entram no catálogo ao lado das 319 do SRD 5.1
(2014), importadas do 5etools; a lista de magias ganha filtro e etiqueta de edição, e as tabelas
`spells` / `spell_translations` saem do banco.

**Arquitetura:** um script (`scripts/content/import-5etools-spells.ts`) baixa o JSON do 5etools
numa versão fixada, fica só com o que tem `srd52`, converte para o formato do PR A e grava
`content/dnd5e/srd-5.2/`. O `FileSpellCatalog` passa a receber a edição de cada fonte, filtra por
ela e marca no DTO a edição e se o texto caiu para o inglês. A lista abre na edição inferida do
grimório.

**Stack:** Next.js (App Router), TypeScript, Zod, Supabase/Postgres, Vitest, Playwright.

**Especificação:** `docs/plans/2026-10-15-5etools-e-traducoes.md` (status de 2026-10-21),
`docs/plans/2026-10-21-magias-em-arquivo.md` ("Fica para o PR B") e as decisões abaixo.

## Decisões (conversa de 2026-10-22)

- **Fonte:** 5etools `v2.38.0` (`5etools-mirror-3/5etools-src`), arquivo
  `data/spells/spells-xphb.json`, só entradas com `srd52`; classes de
  `data/generated/gendata-spell-source-lookup.json` (`xphb.<slug>.class.XPHB`).
- **Id:** slug do nome do SRD. Quando `srd52` é texto, ele é o nome no SRD (`"Melf's Acid Arrow"`
  → `srd52: "Acid Arrow"` → `acid-arrow`); senão, o `name`. 317 dos 339 ids coincidem com o 5.1.
- **Edição do personagem = inferida do grimório:** a edição da maioria das magias aprendidas;
  empate ou grimório vazio → `2024`. Sem campo novo na ficha.
- **pt do 2024:** não existe tradução em nenhuma fonte e não há tradução automática (plano do
  Crowdin). As magias de 2024 aparecem em inglês, com um selo "Em inglês" sempre que a descrição
  não veio no idioma pedido (vale para as 4 magias de 2014 sem `pt` também). O selo de "tradução
  automática" sai do escopo. `content/dnd5e/srd-5.2/i18n/pt/spells.json` nasce `{}` para o
  Crowdin preencher.
- **Edição é etiqueta:** `srd-5.1` → `2014`, `srd-5.2` → `2024`. A chave não muda.
- **Campos visuais nossos** (`spellCategory`, `bgStyleId`) não existem no 5etools: id que existe
  no 5.1 copia os do 5.1; id novo fica `utility` com `grid-mesh` se causa dano, `dots-space` se
  não (mesma distribuição do 5.1).
- **Migrações antigas ficam:** o arquivo de seed de 2026-03 já foi aplicado em produção; apagar o
  arquivo quebraria o histórico do `supabase db push`. Uma migração nova apaga as tabelas.

## Restrições globais

- Locales do app: `en` e `pt`. Chave `dnd5e:<fonte>:spell:<id>` (regex do PR A, sem mudança).
- O importador nunca roda no site; o site só lê `content/`. Rodar de novo com a mesma versão
  gera os mesmos arquivos (ordenados por `id`, JSON com 2 espaços e `\n` final) e nunca toca em
  `i18n/pt`.
- Só SRD: entrada sem `srd52` não entra.
- Merge na `main` aplica migrações em produção na hora.
- Textos de interface via next-intl (`messages/en.json` e `messages/pt.json`); pre-commit roda os
  guardas.
- Um PR, commits por tópico, descrição em português, com `Closes #92` e `Refs #91` (o #91 inclui
  homebrew, que fica para depois).

## Foco da revisão

1. **Mesmo nome nas duas edições:** buscar "Fireball" com edição "todas" mostra dois cartões,
   cada um com a sua etiqueta, e aprender um não marca o outro como aprendido (Tarefas 2 e 4).
2. **Texto do 5etools sem marcação vazando:** nenhuma descrição gerada contém `{@` nem `}` solto;
   tabelas e listas viram linhas legíveis (Tarefa 1, teste sobre os arquivos gerados).
3. **Selo "Em inglês" só quando cabe:** magia de 2014 traduzida não mostra; Fireball 2024 em `pt`
   mostra; nada mostra em `en` (Tarefa 2).
4. **Filtro inicial:** grimório com 3 magias de 2014 e 1 de 2024 abre em 2014; vazio abre em 2024;
   "Limpar filtros" volta para todas as edições (Tarefa 4).
5. **Edição inválida na API:** `?edition=1999` responde 400, não lista vazia nem 500 (Tarefa 2).

---

## Arquivos

| Arquivo                                                     | Papel                                            |
| ----------------------------------------------------------- | ------------------------------------------------ |
| `scripts/content/5etools-spells.ts`                         | conversão pura 5etools → `SpellData`/`SpellText` |
| `scripts/content/5etools-spells.unit.test.ts`               | testes da conversão                              |
| `scripts/content/import-5etools-spells.ts`                  | baixa a versão fixada e grava os arquivos        |
| `content/dnd5e/srd-5.2/spells.json`, `i18n/{en,pt}/…`       | conteúdo gerado                                  |
| `content/dnd5e/content.unit.test.ts`                        | valida as duas fontes                            |
| `shared/systems/dnd5e/content/editions.ts`                  | fonte → edição, edição de uma chave              |
| `src/backend/contexts/spells/…` (catálogo, repo, schemas)   | filtro `edition`, `edition` e `untranslated`     |
| `src/frontend/…` (hook, diálogo, cartão, tipos)             | filtro, etiqueta e selo                          |
| `database/migrations/20261022120000_drop_spells_tables.sql` | apaga `spells` e `spell_translations`            |
| `NOTICE.md`, termos (`messages/*`)                          | atribuição do SRD 5.2                            |

---

### Tarefa 1: Importador e conteúdo do SRD 5.2

**Arquivos:**

- Criar: `scripts/content/5etools-spells.ts`, `scripts/content/5etools-spells.unit.test.ts`,
  `scripts/content/import-5etools-spells.ts`, `content/dnd5e/srd-5.2/**`
- Modificar: `test/vitest.config.unit.ts` (incluir `scripts/**/*.unit.test.ts`),
  `package.json` (`"content:spells": "npx tsx scripts/content/import-5etools-spells.ts"`),
  `content/dnd5e/content.unit.test.ts`, `NOTICE.md`

**Interfaces:**

- Produz:
  - `toSpellId(entry: FiveToolsSpell): string`
  - `toSpellData(entry, classes: string[], previous?: SpellData): SpellData`
  - `toSpellText(entry): SpellText`
  - `renderEntries(entries: unknown[]): string` e `stripTags(text: string): string`
  - arquivos `content/dnd5e/srd-5.2/spells.json` (339), `i18n/en/spells.json`,
    `i18n/pt/spells.json` (`{}`)

Mapeamentos (`toSpellData`):

| 5etools                                                          | nosso                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `school` `A C D E V I N T`                                       | abjuration, conjuration, divination, enchantment, evocation, illusion, necromancy, transmutation |
| `time[0].unit` `bonus`                                           | `bonus_action` (resto igual); `castingValue = number`                                            |
| `range` `point`+`feet`/`miles`                                   | `feet`/`mile` + `amount`                                                                         |
| `range` `point`+`self`/`touch`/`sight`/`unlimited`               | o mesmo nome, valor `null`                                                                       |
| `range` de área (`emanation`, `cone`, `sphere`, `line`, `cube`…) | `self`, `null`                                                                                   |
| `duration[0]` `timed` (`round/minute/hour/day`)                  | unidade + `amount`; `concentration` dela                                                         |
| `duration[0]` `instant` / `permanent` / `special`                | `instantaneous` / `special` / `special`                                                          |
| `components.m` texto ou `{ text, cost }`                         | `M`; `materialCost = cost / 100` (cobre → PO), senão 0                                           |
| `meta.ritual`                                                    | `ritual`                                                                                         |
| `damageInflict`                                                  | id do 5.1: o do 5.1 (inclusive `null`), salvo se não estiver na lista; id novo: o primeiro       |
| `isScaling`                                                      | `false` (como no 5.1)                                                                            |

Texto (`renderEntries`, `stripTags`): parágrafos separados por `\n`; `{ type: 'entries', name }`
vira `Nome. texto`; `list` vira linhas `• item`; `table` vira o cabeçalho e as linhas com `|`.
Marcações `{@tag a|b|c}`: `scaledamage`/`scaledice` → terceira parte; `chance` → `a%`; `dc` → `DC a`; `filter`, `book` e `adventure` → `a` (a terceira parte é filtro ou capítulo);
as demais → terceira parte se houver, senão a primeira (`{@variantrule Sphere [Area of
Effect]|XPHB|Sphere}` → `Sphere`, `{@damage 8d6}` → `8d6`). `higherLevel` = `entriesHigherLevel`
renderizado sem o título "Using a Higher-Level Spell Slot"; `material` = texto do `m`, com
maiúscula inicial e ponto final, como no 5.1.

- [ ] **Passo 1: testes que falham** (`5etools-spells.unit.test.ts`, com o Fireball do 5etools
      como fixture):
  - `toSpellId` → `fireball`; com `srd52: "Acid Arrow"` → `acid-arrow`
  - `toSpellData(fireball, ['sorcerer','wizard'])` → `level 3`, `evocation`, `castingTime
'action'`, `castingValue 1`, `rangeUnit 'feet'`, `rangeValue 150`, `durationUnit
'instantaneous'`, `components ['V','S','M']`, `damageType 'fire'`
  - `toSpellText(fireball).description` contém `20-foot-radius Sphere` e `8d6 Fire damage` e
    não contém `{@`; `higherLevel` = `The damage increases by 1d6 for each spell slot level
above 3.`
  - `stripTags('{@chance 50}')` → `50%`; `renderEntries` de uma tabela de 2 colunas → 3 linhas
  - `{ cost: 2500 }` → `materialCost 25`; range `emanation` → `self`; `bonus` → `bonus_action`
- [ ] **Passo 2:** `npm run test:unit -- scripts/content` → FALHA
- [ ] **Passo 3:** implementar a conversão e o script (`fetch` das duas URLs fixadas, filtra
      `srd52`, valida com os schemas do PR A antes de gravar, `previous` vem de
      `content/dnd5e/srd-5.1/spells.json`); rodar `npm run content:spells`
- [ ] **Passo 4:** `content.unit.test.ts` passa a cobrir as duas fontes: 5.2 com 339 magias, ids
      únicos, todas com texto em inglês, nenhum texto com `{@`; `pt` do 5.2 vazio e válido
- [ ] **Passo 5:** `npm run test:unit` → PASSA; rodar o script de novo → `git status` limpo
- [ ] **Passo 6:** `NOTICE.md`: seção do SRD 5.2 (texto de atribuição oficial do SRD 5.2,
      CC-BY-4.0) e nota de que os dados foram extraídos do 5etools (só o que é SRD)
- [ ] **Passo 7:** commit `feat(magias): SRD 5.2 importado do 5etools`

### Tarefa 2: Catálogo com edição

**Arquivos:**

- Criar: `shared/systems/dnd5e/content/editions.ts`
- Modificar: `src/backend/contexts/spells/infrastructure/file-spell-catalog.ts`, `srd-spells.ts`,
  `domain/repository/spells.repo.ts`, `interfaces/spells.schemas.ts`;
  `src/backend/contexts/characters/domain/repository/character-spell.repo.ts`
  (`CharacterSpellRelation` ganha `edition` e `untranslated`)
- Testes: `file-spell-catalog.unit.test.ts`, `app/api/spells/route.unit.test.ts`

**Interfaces:**

- Produz:
  - `type Edition = '2014' | '2024'`; `EDITIONS: readonly Edition[]`;
    `SOURCE_EDITION: Record<string, Edition>` (`srd-5.1` → `2014`, `srd-5.2` → `2024`);
    `editionOfKey(key: string): Edition | null`
  - `SpellSource` ganha `edition: Edition`
  - `FindSpellsParams.edition?: Edition`; `findSpellsQuerySchema.edition:
optionalQuery(z.enum(EDITIONS))`
  - `SpellDto` ganha `edition: Edition` e `untranslated: boolean` (locale ≠ `en` e a descrição
    veio do inglês)

- [ ] **Passo 1: testes que falham:**
  - catálogo com o mesmo id em duas fontes: `findAll({ search: 'fireball' })` → 2, com `edition`
    `2014` e `2024`; com `edition: '2024'` → só a de 2024
  - `untranslated`: `true` em `pt` sem descrição traduzida; `false` com tradução; `false` em `en`
  - `editionOfKey('dnd5e:srd-5.2:spell:fireball')` → `2024`; fonte desconhecida → `null`
  - rota: `?edition=1999` → 400
- [ ] **Passo 2:** rodar → FALHA
- [ ] **Passo 3:** implementar; `getSpellCatalog` carrega as duas fontes
- [ ] **Passo 4:** `npm run test:unit` → PASSA
- [ ] **Passo 5:** commit `feat(magias): catálogo com as duas edições e filtro por edição`

### Tarefa 3: Tabelas antigas saem do banco

**Arquivos:**

- Criar: `database/migrations/20261022120000_drop_spells_tables.sql`
- Modificar: `lib/types/database.ts` (regenerar),
  `src/backend/shared/infrastructure/data-api-grants.integration.test.ts`

- [ ] **Passo 1:** teste de integração: o teste de grants deixa de usar `spells`; o anônimo não lê
      nenhuma tabela (`profile`, `characters`, `character_lore`, `character_spells`, `feedback`)
- [ ] **Passo 2:** migração: `DROP TABLE public.spell_translations, public.spells;` (nada mais
      aponta para elas desde `20261021120000`)
- [ ] **Passo 3:** `npx supabase migration up` em `database/db-dev` e `database/db-test`;
      regenerar os tipos; `npm run test:integration` → PASSA; `npx tsc --noEmit` → sem erros
- [ ] **Passo 4:** commit `chore(banco): apaga as tabelas antigas de magias`

### Tarefa 4: Filtro, etiqueta e selo na interface

**Arquivos:**

- Criar: `src/frontend/lib/spell-edition.ts` (+ `.unit.test.ts`)
- Modificar: `src/frontend/types/spells.ts`, `src/frontend/hooks/useSpells.ts`,
  `SpellSearchDialog.tsx` (+ teste), `spell-card/parts/SpellHeader.tsx`,
  `spell-card/parts/SpellDetails.tsx`, `messages/{en,pt}.json`

**Interfaces:**

- Consome: `Edition`, `EDITIONS`, `editionOfKey` (Tarefa 2); `edition` e `untranslated` no DTO
- Produz: `inferEdition(keys: string[]): Edition`

Textos (`spellsDrawer`): `filterLabels.edition` "Edição"/"Edition", `allEditions` "Todas as
edições"/"All editions", `editions.2014` "2014", `editions.2024` "2024". `characters`:
`untranslatedBadge` "Em inglês"/"In English", com dica "Ainda sem tradução. Ajude no Crowdin."
só em `pt`.

- [ ] **Passo 1: testes que falham:**
  - `inferEdition` com 3 de 2014 e 1 de 2024 → `2014`; `[]` → `2024`; empate → `2024`
  - diálogo: abre com o seletor de edição em "2024" quando `learnedSpells` está vazio e
    `useSpells` é chamado com `edition: '2024'`; "Limpar filtros" chama com `edition: null`
- [ ] **Passo 2:** rodar → FALHA
- [ ] **Passo 3:** implementar: `Filters.edition` entra no diálogo (conta em `activeFilterCount`),
      `useSpells` manda `edition`; o cabeçalho do cartão mostra a edição como mais um `Detail`;
      `SpellDetails` mostra o selo acima da descrição quando `untranslated`
- [ ] **Passo 4:** `npm run test:unit` → PASSA
- [ ] **Passo 5:** commit `feat(magias): filtro e etiqueta de edição, selo de texto em inglês`

### Tarefa 5: e2e, app e documentação

**Arquivos:**

- Modificar: `e2e/spells.spec.ts`, `e2e/navigation.mobile.spec.ts`,
  `e2e/visual/screens.visual.spec.ts` se dependerem de nomes repetidos ou contagens
- Modificar: `docs/plans/2026-10-20-roadmap.md` (6 entregue com o PR; 5 continua em andamento por
  causa do homebrew), `2026-10-15-5etools-e-traducoes.md`, `2026-10-15-conteudo-e-homebrew.md`,
  `2026-10-21-magias-em-arquivo.md` (link para este plano)

- [ ] **Passo 1:** `npm run test:e2e` → PASSA (ajustar buscas por nome exato e escolher edição
      onde o teste aprende uma magia); `npm run test:visual -- --update-snapshots=all` e conferir
      os PNG
- [ ] **Passo 2:** no `next dev`: em `pt`, abrir a lista com o Alatar (grimório de 2014 → abre em
      2014), trocar para 2024, abrir Fireball 2024 (selo "Em inglês"), aprender, ver as duas
      etiquetas no grimório
- [ ] **Passo 3:** commits `test(magias): e2e com as duas edições` e
      `docs(planos): magias por edição`
