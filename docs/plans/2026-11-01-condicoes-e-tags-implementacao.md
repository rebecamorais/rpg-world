# Condições e tags no texto: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** guardar as tags do 5etools (`{@condition frightened}`) em todo texto de regra, trazer as
condições SRD 5.1 e 5.2 para arquivo, mostrá-las nas magias (texto clicável, selos, filtro) e
deixar o mestre e o jogador ligarem e desligarem condições no combate.

**Architecture:** um parser de tags em `shared/` (servidor e cliente) e um componente `RulesText`
que transforma texto em nós. As condições moram em arquivo e chegam ao cliente por
`GET /api/conditions`. No combate, a lista de condições é uma coluna `jsonb` do participante,
escrita só pela função `set_participant_conditions` e devolvida a todos por `encounter_turns`.

**Tech Stack:** Next.js (App Router), Supabase (Postgres, RLS, Broadcast), zod, TanStack Query,
next-intl, Vitest, Playwright.

**Spec:** `docs/plans/2026-11-01-condicoes-e-tags.md`

## Global Constraints

- Formato da tag: `{@tipo corpo|fonte|exibição}`, sem mudança. Todas as tags ficam no texto.
- Tag sem exibição mostra o corpo. Tag de tipo sem tela (tudo menos `condition`) é texto normal,
  com as mesmas regras de hoje do `stripTags` (`chance` → `N%`, `dc` → `DC N`, `filter`/`book`/
  `adventure` → primeira parte, `scaledamage`/`scaledice` → terceira parte).
- A referência resolve no mesmo livro do texto que a contém; a parte da fonte é ignorada.
- Chave de condição: `dnd5e:<livro>:condition:<id>`, como `dnd5e:srd-5.2:condition:frightened`.
- Edições: `'2014' | '2024'` (`EDITIONS`); `srd-5.1` → 2014, `srd-5.2` → 2024 (`SOURCE_EDITION`).
- Edição padrão da mesa: `'2024'`.
- Exaustão tem nível de 1 a 6; nenhuma outra condição tem nível.
- No máximo 20 condições por participante.
- Só en e pt nos textos de interface (`messages/en.json`, `messages/pt.json`); es e sv não.
- Comentários e nomes no estilo do código vizinho (comentários em inglês no código, em português no SQL).
- Toda tela nova: 44px de área de toque no celular, teclado e leitor de tela.
- Um commit por assunto. A migração vai para produção no merge.

## Review Focus

1. **Tag que não fecha** (`{@condition frightened` sem `}`) num texto de homebrew ou numa tradução
   mal feita: o texto aparece como está, sem quebrar a tela. Teste em `tags.unit.test.ts` (Task 1).
2. **Material que começa com tag** (`{@item ruby|…}`): o `sentence()` do importador põe maiúscula no
   `{`, não na palavra. Teste em `5etools-spells.unit.test.ts` (Task 2).
3. **Jogador mexe em personagem dele que saiu da mesa** ou que é de outro jogador: a função recusa.
   Teste em `encounter-conditions.integration.test.ts` (Task 6).
4. **Condição de uma edição que a mesa não usa** fica marcada quando o mestre troca a edição da mesa:
   o selo continua resolvendo pela chave e mostra a edição. Teste em `ConditionBadge.unit.test.tsx`
   (Task 8).
5. **Palavra comum com nome de condição** no 5.1 ("caído" como passado de cair, "cego" figurado): o
   script só marca as formas da lista e o diff é revisado. Teste com uma frase de falso positivo em
   `tag-conditions.unit.test.ts` (Task 4).

---

### Task 1: Parser de tags em `shared/`

**Files:**

- Create: `shared/content/tags.ts`
- Test: `shared/content/tags.unit.test.ts`
- Modify: `shared/content/content-key.ts` (chave genérica e de condição) e o teste dele
- Modify: `scripts/content/5etools-spells.ts` (`stripTags` passa a vir de `shared/content/tags.ts`; os testes de `stripTags` em `scripts/content/5etools-spells.unit.test.ts` vão para `tags.unit.test.ts`)

**Interfaces:**

- Produces:
  - `type TagNode = { kind: 'text'; text: string } | { kind: 'tag'; tag: string; target: string; display: string | null; text: string }`. `target` é a primeira parte do corpo em minúsculas e sem espaços nas pontas; `text` é o que `stripTags` mostraria.
  - `parseTags(text: string): TagNode[]`: só as tags de fora viram nós; o que estiver aninhado dentro do corpo vira texto puro no `text` do nó.
  - `stripTags(text: string): string`: igual ao de hoje.
  - `tagsOf(text: string): { tag: string; target: string }[]`: todas as tags, inclusive as aninhadas, na ordem em que aparecem.
  - `conditionIdsOf(...texts: (string | null | undefined)[]): string[]`: ids das tags `condition`, sem repetir, em ordem alfabética.
  - Em `content-key.ts`: `contentKey(source: string, type: string, id: string): string`, `parseContentKey(key: string): { source: string; type: string; id: string } | null`, `conditionKey(source: string, id: string): string`. `spellKey` e `parseSpellKey` continuam funcionando.

- [ ] **Step 1: Write the failing tests** em `tags.unit.test.ts`:
  - `parseTags('O alvo fica {@condition frightened||amedrontado}.')` →
    `[{kind:'text',text:'O alvo fica '}, {kind:'tag',tag:'condition',target:'frightened',display:'amedrontado',text:'amedrontado'}, {kind:'text',text:'.'}]`
  - `parseTags('{@condition Frightened|XPHB}')[0]` tem `target: 'frightened'`, `display: null`, `text: 'Frightened'`.
  - `parseTags('{@b {@dice 1d6}}')` → um nó `tag` `b` com `text: '1d6'`.
  - `parseTags('sem fechar {@condition frightened')` → um único nó `text` com o texto inteiro.
  - `parseTags('')` → `[]`.
  - `tagsOf('{@b {@condition prone}} e {@damage 8d6}')` →
    `[{tag:'condition',target:'prone'},{tag:'damage',target:'8d6'},{tag:'b',target:'prone'}]`
    (de dentro para fora, uma passada por nível, como o `stripTags` resolve).
  - `conditionIdsOf('{@condition prone}', undefined, '{@condition blinded} {@condition prone}')` → `['blinded','prone']`.
  - Os testes atuais de `stripTags` passam do arquivo do importador para cá sem mudar.
  - Em `content-key.unit.test.ts`: `conditionKey('srd-5.2','prone')` → `'dnd5e:srd-5.2:condition:prone'`; `parseContentKey('dnd5e:srd-5.1:spell:fireball')` → `{source:'srd-5.1',type:'spell',id:'fireball'}`; `parseContentKey('lixo')` → `null`.

- [ ] **Step 2: Run** `npm run test:unit -- shared/content` → FAIL (módulo não existe).
- [ ] **Step 3: Implement** `shared/content/tags.ts` e as funções novas de `content-key.ts`. Mova `stripTags` sem mudar o comportamento e importe de lá no importador.
- [ ] **Step 4: Run** `npm run test:unit -- shared/content scripts/content` → PASS.
- [ ] **Step 5: Commit** `feat(content): parser das tags do 5etools em shared`

### Task 2: Importador guarda as tags e as condições vão para arquivo

**Files:**

- Modify: `scripts/content/5etools-spells.ts` (`renderEntry`, `triggerOf`, `toSpellText` guardam o texto cru; `sentence` põe a maiúscula na primeira letra fora de tag)
- Create: `shared/systems/dnd5e/content/condition.schema.ts` + `condition.schema.unit.test.ts`
- Create: `scripts/content/5etools-conditions.ts` + `5etools-conditions.unit.test.ts`
- Create: `scripts/content/import-5etools-conditions.ts`
- Modify: `package.json`: `"content:conditions": "npx tsx scripts/content/import-5etools-conditions.ts"`
- Create (gerados): `content/dnd5e/srd-5.1/conditions.json`, `content/dnd5e/srd-5.1/i18n/en/conditions.json`, `content/dnd5e/srd-5.2/conditions.json`, `content/dnd5e/srd-5.2/i18n/en/conditions.json`, `i18n/pt/conditions.json` dos dois livros (`{}` se não houver pt)
- Modify (gerados): `content/dnd5e/srd-5.2/i18n/en/spells.json`, `content/dnd5e/srd-5.1/i18n/en/spells.json` (gatilhos), ao rodar `npm run content:spells`
- Modify: `content/dnd5e/content.unit.test.ts`

**Interfaces:**

- Produces:
  - `conditionDataSchema = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), maxLevel: z.number().int().min(1).max(6).optional() })`.
  - `conditionTextSchema = z.object({ name: z.string().min(1), description: z.string().min(1) })`.
  - `conditionTranslationSchema = conditionTextSchema` com os campos `z.string()` e `.partial()`.
  - Tipos `ConditionData`, `ConditionText`, `ConditionTranslation`.
  - `toConditionId(c: FiveToolsCondition): string`, `toConditionData(c): ConditionData`, `toConditionText(c): ConditionText`, que usa o `renderEntries` de `5etools-spells.ts` (exportado).
  - Arquivo `conditions.json`: array ordenado por id. `i18n/en/conditions.json`: objeto `id → ConditionText`.

- [ ] **Step 1: Write the failing tests:**
  - Em `5etools-spells.unit.test.ts`: `toSpellText` de uma magia com `entries: ['The target is {@condition frightened}.']` → `description` igual a esse texto, com a tag. Material `'{@item ruby|XPHB} dust'` → `'{@item ruby|XPHB} dust.'` e `'a {@item ruby}'` → `'A {@item ruby}.'`.
  - Em `5etools-conditions.unit.test.ts`: uma condição do 5etools com `name: 'Exhaustion'` e `entries` com uma lista → `toConditionData` `{ id: 'exhaustion', maxLevel: 6 }`; `'Prone'` → `{ id: 'prone' }`, sem `maxLevel`; `toConditionText` guarda tags e listas (`• …`).
  - Em `condition.schema.unit.test.ts`: `maxLevel: 7` é recusado; id com maiúscula é recusado.
- [ ] **Step 2: Run** `npm run test:unit -- scripts/content shared/systems` → FAIL.
- [ ] **Step 3: Implement** a conversão e o script. O script baixa `conditionsdiseases.json` do mesmo `VERSION`/`BASE` do importador de magias (extraia as duas constantes e `fetchJson` para `scripts/content/5etools-source.ts` e use nos dois), lê o array `condition`, separa `source === 'XPHB' && srd52` (5.2) e `source === 'PHB' && srd` (5.1), grava en e cria `i18n/pt/conditions.json` com `{}` se não existir. Para o pt da 5.1, procure condições no repositório Foundry VTT Brasil (`gitlab.com/fvtt-brasil/dnd5e`), de onde veio o pt das magias 5.1. Se houver, grave nos ids certos e cite a fonte no commit. Se não houver, fica `{}` e o Crowdin preenche.
- [ ] **Step 4: Run** `npm run content:conditions` e `npm run content:spells`. Confira no diff que o en das magias 5.2 ganhou tags e que nada além do texto mudou (dados iguais).
- [ ] **Step 5: Atualize `content.unit.test.ts`:**
  - Os testes "nenhum texto em inglês tem marcação do 5etools" e "resto de marcação sem chaves" passam a olhar `stripTags(value)`: depois de tirar as tags não sobra `{`, `}` nem `{@`.
  - Novo `describe.each` das condições dos dois livros: passam no schema, ids únicos, 15 condições em cada livro, todas com texto en, traduções só com ids que existem, `exhaustion` com `maxLevel: 6`.
  - Novo: toda tag `condition` em magias e condições aponta para uma condição do mesmo livro.
  - Novo: para cada entrada e campo de cada tradução não vazia (magias e condições, todos os idiomas em `i18n/`), `tagsOf(tradução)` e `tagsOf(en)` têm os mesmos pares `tag`+`target`, com a mesma contagem (a ordem pode mudar).
- [ ] **Step 6: Run** `npm run test:unit -- content scripts shared` → PASS.
- [ ] **Step 7: Commit** `feat(content): condições do SRD em arquivo e tags guardadas no texto`

### Task 3: Catálogo de condições, condições na magia e `GET /api/conditions`

**Files:**

- Create: `src/backend/contexts/conditions/infrastructure/file-condition-catalog.ts` + `.unit.test.ts`
- Create: `src/backend/contexts/conditions/infrastructure/srd-conditions.ts` (`getConditionCatalog()`, no molde de `srd-spells.ts`)
- Create: `src/backend/contexts/conditions/domain/condition.ts` (DTO e interface do catálogo)
- Create: `app/api/conditions/route.ts` + `route.unit.test.ts`; registre em `@api` como os outros contextos
- Modify: `src/backend/contexts/spells/infrastructure/file-spell-catalog.ts` (`conditions` no DTO, filtro `condition`)
- Modify: `src/backend/contexts/spells/domain/repository/spells.repo.ts` (`SpellDto.conditions`, `FindSpellsParams.condition`)
- Modify: `src/backend/contexts/spells/interfaces/spells.schemas.ts` (`condition: queryText`)
- Modify: `src/frontend/types/spells.ts` (`conditions?: string[]`)

**Interfaces:**

- Consumes: `conditionKey`, `parseContentKey`, `conditionIdsOf` (Task 1); schemas e arquivos (Task 2).
- Produces:
  - `interface ConditionDto { key: string; id: string; edition: Edition; name: string; description: string; maxLevel: number | null; untranslated: boolean }`.
  - `interface ConditionCatalog { list(locale?: string): ConditionDto[]; find(key: string): ConditionDto | null }` em `domain/condition.ts`. `FileConditionCatalog` implementa, com o mesmo fallback de idioma campo a campo do `FileSpellCatalog`.
  - `GET /api/conditions?locale=pt` → `ConditionDto[]` dos dois livros, ordenado por edição e nome. Autenticado, como `/api/spells`.
  - `SpellDto.conditions: string[]`: chaves de condição tiradas de `description` e `higherLevel` do texto en, no livro da magia.
  - `FindSpellsParams.condition?: string`: id curto (`prone`). Casa com qualquer magia cuja `conditions` tenha esse id, em qualquer livro.

- [ ] **Step 1: Write the failing tests:**
  - `FileConditionCatalog` com fontes de teste: `list('pt')` usa o nome pt quando existe e o en quando não, com `untranslated: true`; `find('dnd5e:srd-5.2:condition:prone')` devolve a entrada; `find('dnd5e:srd-5.2:condition:nada')` → `null`; `maxLevel` é `6` na exaustão e `null` nas outras.
  - `file-spell-catalog.unit.test.ts`: uma magia de teste com `{@condition frightened}` na descrição tem `conditions: ['dnd5e:srd-5.2:condition:frightened']`; `findAll({ condition: 'frightened' })` só devolve essa.
  - `app/api/conditions/route.unit.test.ts`: sem sessão → 401; com sessão → 200 e uma lista não vazia.
- [ ] **Step 2: Run** os três arquivos → FAIL.
- [ ] **Step 3: Implement.** Calcule `conditions` uma vez por entrada, no construtor do `FileSpellCatalog`.
- [ ] **Step 4: Run** `npm run test:unit` → PASS. Rode `npx tsc --noEmit`.
- [ ] **Step 5: Commit** `feat(conditions): catálogo, rota e condições de cada magia`

### Task 4: Tags nas magias 5.1

**Files:**

- Create: `scripts/content/tag-conditions.ts` + `tag-conditions.unit.test.ts`
- Create: `scripts/content/tag-conditions-51.ts` (script de uma vez só; fica no repo para refazer se preciso)
- Modify (gerados): `content/dnd5e/srd-5.1/i18n/en/spells.json`, `content/dnd5e/srd-5.1/i18n/pt/spells.json`

**Interfaces:**

- Consumes: `parseTags` (Task 1), os ids das condições 5.1 (Task 2).
- Produces: `tagConditions(text: string, forms: { id: string; words: string[] }[], options: { display: 'always' | 'when-different' }): string`.
  - Casa palavra inteira, sem diferenciar maiúscula e acento, com fronteira por letra Unicode (`(?<!\p{L})…(?!\p{L})`, flag `u`). JavaScript não trata `\b` com acento.
  - Não mexe no que já está dentro de uma tag.
  - `display: 'always'` grava a palavra do texto como exibição (`{@condition frightened||amedrontada}`), e é o modo do pt.
  - `'when-different'` só grava a exibição quando a palavra difere do id (`{@condition frightened||Frightened}`), e é o modo do en.

- [ ] **Step 1: Write the failing tests:**
  - `tagConditions('The target is frightened.', [{id:'frightened',words:['frightened']}], {display:'when-different'})` → `'The target is {@condition frightened}.'`.
  - `'Frightened creatures'` → `'{@condition frightened||Frightened} creatures'`.
  - pt: `tagConditions('fica amedrontada e caída', [{id:'frightened',words:['amedrontado','amedrontada','amedrontados','amedrontadas']},{id:'prone',words:['caído','caída','caídos','caídas']}], {display:'always'})` → `'fica {@condition frightened||amedrontada} e {@condition prone||caída}'`.
  - Não marca dentro de palavra: `'unfrightened'` fica igual.
  - Não marca de novo: `'{@condition prone}'` fica igual.
  - Falso positivo da Review Focus: com `words: ['caído']`, `'o escudo caído no chão'` **é** marcado. O teste documenta que o script não entende o sentido, e o Step 4 cobre a revisão.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `tagConditions` e o script. As formas en são o nome da condição, em minúsculas. As formas pt saem do vocabulário que o próprio pt da 5.1 usa: antes de escrever a lista, procure no `i18n/pt/spells.json` as palavras de cada condição (masculino, feminino, singular, plural). O script aplica nos campos `description`, `higherLevel`, `trigger` e `material` do en e do pt e grava com `writeFormatted`.
- [ ] **Step 4: Run** `npx tsx scripts/content/tag-conditions-51.ts` e revise o diff dos dois arquivos. Desfaça à mão o que não for condição. Rode `npm run test:unit -- content`: o teste de "mesmas tags" (Task 2) pega en e pt que discordam, e cada divergência se corrige no arquivo.
- [ ] **Step 5: Commit** `feat(content): tags de condição nas magias do SRD 5.1`

### Task 5: `RulesText`, popover da condição e selos na magia

**Files:**

- Create: `src/frontend/hooks/useConditions.ts` (`GET /api/conditions` no idioma da tela, `staleTime: Infinity`)
- Create: `src/frontend/components/content/RulesText.tsx` + `.unit.test.tsx`
- Create: `src/frontend/components/content/ConditionHint.tsx` (o popover) + `.unit.test.tsx`
- Create: `src/frontend/components/content/ConditionBadge.tsx` + `.unit.test.tsx`
- Modify: `src/frontend/components/character/spells/spell-card/parts/SpellDetails.tsx` (descrição, níveis superiores e gatilho por `RulesText`; selos antes da descrição)
- Modify: `messages/en.json`, `messages/pt.json` (namespace `conditions`)

**Interfaces:**

- Consumes: `parseTags`, `conditionKey`, `parseContentKey` (Task 1); `ConditionDto` e a rota (Task 3).
- Produces:
  - `useConditions(): { byKey: Map<string, ConditionDto>; list: ConditionDto[]; isLoading: boolean }`.
  - `<RulesText text={string} source={string} nested?={boolean} />`: cada nó `text` sai como texto, preservando `\n` (o pai continua com `whitespace-pre-wrap`); cada `condition` que resolve em `conditionKey(source, target)` vira `<ConditionHint>` com o `text` do nó; o resto vira o `text` do nó. Com `nested`, condições também saem como texto puro (é o limite de profundidade).
  - `<ConditionHint conditionKey={string} label?={string}>`: botão inline (sublinhado pontilhado, cor de destaque) com nome acessível `"{name}, condição"` / `"{name}, condition"`. Abre com toque, clique ou Enter, e fecha com Esc. Mostra o nome, a descrição por `<RulesText nested>` e, quando o mesmo id existe no outro livro, um botão "Ver versão {edition}" que troca o conteúdo. Monte sobre o `Hint` (`src/frontend/components/ui/hint.tsx`), que já resolve o toque. Se o `Hint` não comportar texto longo com lista, crie um popover com o mesmo comportamento.
  - `<ConditionBadge conditionKey={string} level?={number | null} defaultEdition?={Edition} />`: selo com o nome, `" {level}"` quando tiver nível e a edição (`"· 2014"`) quando ela for diferente de `defaultEdition`. Tocar abre o mesmo popover. Chave desconhecida mostra o id em texto, sem botão.
  - Mensagens: `conditions.ariaLabel` ("{name}, condição"), `conditions.otherEdition` ("Ver versão {edition}"), `conditions.level` ("Nível {level}"), `conditions.title` ("Condições"), `conditions.filter` ("Condição"), `conditions.any` ("Qualquer condição"), `conditions.edition` ("Edição").

- [ ] **Step 1: Write the failing tests** (com `useConditions` mockado):
  - `RulesText` com `'Fica {@condition frightened||amedrontado} e sofre {@damage 8d6}.'` e `source='srd-5.2'`: há um botão com nome "Amedrontado, condição", e o texto visível é "Fica amedrontado e sofre 8d6." Nenhum `{@` aparece em `container.textContent`.
  - Condição que não existe no livro (`{@condition nada}`) → texto "nada", sem botão.
  - `nested` → nenhum botão.
  - Tag aberta (`'{@condition prone'`) → aparece como está, sem erro.
  - `ConditionHint`: clicar abre e mostra a descrição; Esc fecha; o botão "Ver versão 2014" troca a descrição para a do `srd-5.1`.
  - `ConditionBadge` com `level=3` em exaustão → "Exaustão 3"; com chave `srd-5.1` e `defaultEdition='2024'` → mostra "2014" (Review Focus 4); chave desconhecida → texto, sem botão.
  - `SpellDetails` (no teste do `SpellCard` que já existe): magia com `conditions: ['dnd5e:srd-5.2:condition:frightened']` mostra o selo.
- [ ] **Step 2: Run** `npm run test:unit -- src/frontend/components/content src/frontend/components/character/spells` → FAIL.
- [ ] **Step 3: Implement.** O livro da magia vem de `parseContentKey(spell.id)?.source`.
- [ ] **Step 4: Run** → PASS. Rode `npm run lint` e `npx tsc --noEmit`.
- [ ] **Step 5: Commit** `feat(spells): condições clicáveis no texto e selos na magia`

### Task 6: Banco: edição da mesa e condições no combate

**Files:**

- Create: `database/migrations/20261101170000_encounter_conditions.sql`
- Create: `src/backend/contexts/combat/infrastructure/encounter-conditions.integration.test.ts`
- Modify: `lib/types/database.ts` (regenerado)

**Interfaces:**

- Produces (SQL):
  - `public.parties.edition text NOT NULL DEFAULT '2024' CHECK (edition IN ('2014','2024'))`; `GRANT UPDATE (edition) ON public.parties TO authenticated` (a política `parties_update_gm` já limita ao mestre).
  - `public.encounter_participants.conditions jsonb NOT NULL DEFAULT '[]'`, com `CHECK (private.valid_conditions(conditions))`. A função `private.valid_conditions(jsonb) RETURNS boolean IMMUTABLE` aceita um array de até 20 objetos `{ "key": text, "level": int | null }`. A `key` casa `^dnd5e:srd-5\.[12]:condition:[a-z0-9-]+$`, o `level` é null ou de 1 a 6 e a `key` não se repete. Sem `GRANT UPDATE (conditions)`: só a função escreve.
  - `public.set_participant_conditions(p_party_id uuid, p_participant_id uuid, p_conditions jsonb) RETURNS boolean`, `SECURITY DEFINER`, `SET search_path = ''`. Devolve `true` se mudou. Devolve `false` quando o participante não existe nessa mesa ou quando quem chama não é o mestre (`private.is_party_gm`) nem o jogador dono, ou seja, `private.is_party_member` com `side = 'player'`, `characters.owner_id = auth.uid()` e o personagem ainda em `party_characters` da mesa. `REVOKE` de `PUBLIC, anon`; `GRANT EXECUTE` para `authenticated, service_role`.
  - `public.encounter_turns` recriada (`DROP FUNCTION` + `CREATE`, com os mesmos grants) com uma coluna a mais no fim: `conditions jsonb` (null na linha "preparando sem ninguém").
  - O aviso em tempo real já sai: o gatilho `trg_encounter_participants_notify` cobre UPDATE.

- [ ] **Step 1: Write the failing integration tests** no molde de `encounters-rls.integration.test.ts` (mesmos helpers de mesa, mestre, jogador, de fora):
  - Mestre põe `[{key:'dnd5e:srd-5.2:condition:prone',level:null}]` num inimigo e num jogador → `true`, e `encounter_turns` do jogador mostra as condições nas duas linhas.
  - Jogador põe no próprio personagem → `true`.
  - Jogador no personagem de outro jogador → `false`, e nada muda.
  - Jogador num inimigo ou aliado → `false`.
  - Jogador cujo personagem saiu de `party_characters` → `false` (Review Focus 3).
  - Quem não é da mesa → `false`; `encounter_turns` → zero linhas.
  - Formato inválido (key fora do padrão, `level: 7`, key repetida, 21 itens) → erro de CHECK (`23514`).
  - `UPDATE encounter_participants SET conditions = …` direto, como mestre → recusado (sem grant).
  - Mestre muda `parties.edition` para `'2014'` → ok; membro → zero linhas; `'2030'` → erro de CHECK.
  - Mudar condições manda o aviso no tópico `party:<id>` (no molde de `encounter-realtime.integration.test.ts`).
- [ ] **Step 2: Run** `npm run test:integration -- encounter-conditions` → FAIL.
- [ ] **Step 3: Write the migration**, com cabeçalho em português no estilo das migrações de encontro.
- [ ] **Step 4: Apply and regenerate types:** reinicie o banco de teste e rode `npx supabase gen types typescript --local --schema public --workdir database/db-dev > lib/types/database.ts` (o mesmo comando do plano das mesas). Rode `npm run test:integration` inteiro → PASS. `encounters-rls` e `encounter-functions` continuam passando com a coluna nova em `encounter_turns`.
- [ ] **Step 5: Commit** `feat(db): edição da mesa e condições dos participantes do combate`

### Task 7: Backend: edição da mesa e condições no combate

**Files:**

- Modify: `src/backend/contexts/parties/domain/repository/party.repo.ts` (`PartyRecord.edition`, `setEdition`)
- Modify: `src/backend/contexts/parties/infrastructure/supabase-party.repository.ts` e o teste de integração dele
- Modify: `src/backend/contexts/parties/domain/PartyView.ts` (`PartyView.edition`) e o use case que monta a view
- Modify: `src/backend/contexts/parties/interfaces/parties.schemas.ts` (`partyPatchSchema`) e `app/api/parties/[partyId]/route.ts` (PATCH com nome e/ou edição)
- Modify: `src/backend/contexts/combat/domain/Encounter.ts`, `domain/repository/combat.repo.ts`, `domain/gm-row.ts`, `domain/CombatError.ts`
- Create: `src/backend/contexts/combat/application/set-conditions.use-case.ts`; teste em `combat.use-cases.unit.test.ts`
- Modify: `src/backend/contexts/combat/infrastructure/supabase-combat.repository.ts` e `.integration.test.ts`
- Modify: `src/backend/contexts/combat/application/CombatContext.ts`, `index.ts`, `interfaces/combat.api.ts`, `interfaces/combat.schemas.ts`
- Create: `app/api/parties/[partyId]/encounter/participants/[participantId]/conditions/route.ts` + `route.unit.test.ts`

**Interfaces:**

- Consumes: `ConditionCatalog` (Task 3), SQL (Task 6).
- Produces:
  - `interface ActiveCondition { key: string; level: number | null }` em `Encounter.ts`; `TurnEntry.conditions: ActiveCondition[]`; `GmRow.conditions: ActiveCondition[]`; `ParticipantRecord.conditions: ActiveCondition[]`.
  - `CombatRepo.setConditions(partyId: string, participantId: string, conditions: ActiveCondition[]): Promise<boolean>` (rpc `set_participant_conditions`).
  - `CombatErrorCodes.INVALID_CONDITION` → HTTP 400, no mesmo mapa dos outros códigos.
  - `SetConditionsUseCase(repository: CombatRepo, catalog: ConditionCatalog).execute(partyId, participantId, conditions): Promise<void>`. Recusa com `INVALID_CONDITION` uma chave que o catálogo não acha, um `level` em condição sem `maxLevel` ou um `level` fora de `1..maxLevel`. Exaustão sem nível vira nível 1. Repetidas viram uma só. O repo devolvendo `false` vira `NOT_FOUND`.
  - `conditionsSchema = z.object({ conditions: z.array(z.object({ key: z.string().max(80), level: z.number().int().nullable().default(null) })).max(20) })`.
  - `PUT /api/parties/[partyId]/encounter/participants/[participantId]/conditions` com `conditionsSchema` → `null`.
  - `combatApi.setConditions(partyId, participantId, conditions)`.
  - `PartyRepo.setEdition(id: string, edition: Edition): Promise<boolean>`; `partyPatchSchema = z.object({ name: z.string().max(100), edition: z.enum(EDITIONS) }).partial().refine(o => o.name !== undefined || o.edition !== undefined)`; `PartyView.edition: Edition`.

- [ ] **Step 1: Write the failing tests:**
  - Use case: chave inexistente → `INVALID_CONDITION`; `level: 2` em `prone` → `INVALID_CONDITION`; exaustão `level: 7` → `INVALID_CONDITION`; exaustão sem nível → o repo recebe `level: 1`; repetidas → o repo recebe uma; repo `false` → `NOT_FOUND`.
  - Rota: corpo com 21 itens → 400; ok → 200 e chama `combatApi.setConditions`.
  - Repo (integração): `turns()` e `findEncounter()` devolvem `conditions` (e `[]` por padrão); `setConditions` devolve `false` para quem não pode.
  - `GetEncounterUseCase` / `toGmRow`: `GmRow.conditions` vem do participante.
  - Parties: `PATCH` com `{ edition: '2014' }` → 200; `{}` → 400; `findParty` traz `edition`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** O `CombatContext` recebe o catálogo de `getConditionCatalog()` onde é montado (`index.ts`).
- [ ] **Step 4: Run** `npm run test:unit` e `npm run test:integration` → PASS; `npx tsc --noEmit`.
- [ ] **Step 5: Commit** `feat(combat): condições dos participantes e edição da mesa na API`

### Task 8: Telas: condições no combate e edição nas configurações

**Files:**

- Modify: `src/frontend/hooks/useEncounter.ts` (mutation `setConditions`) e o teste dele
- Create: `src/frontend/components/combat/ConditionsPicker.tsx` + `.unit.test.tsx`
- Modify: `src/frontend/components/combat/CombatRow.tsx` (selos + botão "Condições") e o teste
- Modify: `src/frontend/components/combat/PlayerCombatPanel.tsx` (selos em todos; botão só em `isMine`) e o teste
- Modify: `src/frontend/components/combat/fixtures.ts` (`conditions: []` nas linhas)
- Modify: `src/frontend/components/party/PartySettings.tsx` (select de edição) e o teste
- Modify: `messages/en.json`, `messages/pt.json`

**Interfaces:**

- Consumes: `ConditionBadge`, `useConditions` (Task 5); `ActiveCondition`, a rota PUT, `PartyView.edition`, o PATCH da mesa (Task 7).
- Produces:
  - `useEncounter(partyId).setConditions`: `useMutation` com `{ participantId: string; conditions: ActiveCondition[] }` → `PUT …/participants/{id}/conditions`, invalidando a mesma query que as outras mutations.
  - `<ConditionsPicker value={ActiveCondition[]} defaultEdition={Edition} onChange={(next: ActiveCondition[]) => void} />`: diálogo (o `Dialog` de `ui/dialog.tsx`, ou `Sheet` no celular) com abas de edição que começam na `defaultEdition`. Cada condição da edição aparece como interruptor com o nome. A exaustão ligada mostra um `NumberStepper` de 1 a 6. Mudar chama `onChange` com a lista inteira, mantendo as condições da outra edição que já estavam ligadas. Cada linha tem o `ConditionHint` ao lado.

- [ ] **Step 1: Write the failing tests:**
  - `ConditionsPicker`: abre na aba "2024" com `defaultEdition='2024'`. Ligar "Caído" chama `onChange([{key:'dnd5e:srd-5.2:condition:prone',level:null}])`. Ligar "Exaustão" chama com `level: 1`, e subir o stepper chama com `level: 2`. Na aba 2014, ligar "Cego" mantém o "Caído" de 2024 na lista.
  - `CombatRow`: linha com `conditions` mostra os selos, e o botão "Condições" abre o picker.
  - `PlayerCombatPanel`: selos aparecem em todas as linhas, e o botão "Condições" só na linha `isMine`.
  - `PartySettings`: trocar a edição chama o PATCH com `{ edition: '2014' }`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** O botão "Condições" tem 44px de área de toque no celular sem empurrar os campos de PV e iniciativa (ver `2026-11-01-revisao-ux-mesas.md`). Os selos quebram linha embaixo do nome.
- [ ] **Step 4: Run** `npm run test:unit` → PASS.
- [ ] **Step 5: Commit** `feat(combat): ligar e desligar condições, e edição da mesa nas configurações`

### Task 9: Filtro por condição no grimório e na busca

**Files:**

- Modify: `src/frontend/lib/spellbook-filter.ts` e o teste
- Modify: `src/frontend/components/character/spells/SpellbookFilterBar.tsx` e o teste
- Modify: `src/frontend/hooks/useSpells.ts` e `src/frontend/components/character/spells/SpellSearchDialog.tsx` e o teste

**Interfaces:**

- Consumes: `Spell.conditions`, `FindSpellsParams.condition` (Task 3); `useConditions`, mensagens (Task 5).
- Produces:
  - `SpellbookFilters.condition: string | null` (id curto), `NO_SPELLBOOK_FILTERS.condition = null`. `filterSpellbook` casa quando `spell.conditions` tem uma chave com esse id. `activeSpellbookFilterCount` conta o filtro.
  - Select "Condição" no `SpellbookFilterBar`, só com as condições das magias do grimório (nome na edição da primeira magia que a cita), como já é com escola e dano.
  - Busca de magias: select "Condição" com as condições do catálogo, que manda `condition=<id>` para `/api/spells`.

- [ ] **Step 1: Write the failing tests:** `filterSpellbook(spells, {...NO_SPELLBOOK_FILTERS, condition:'frightened'})` só devolve as magias com essa condição, de qualquer edição. A contagem de filtros ativos sobe 1. O select do grimório não oferece condição que nenhuma magia tem. A busca manda `condition=frightened`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run test:unit` → PASS.
- [ ] **Step 5: Commit** `feat(spells): filtro por condição no grimório e na busca`

### Task 10: Conferência, e2e e PR

**Files:**

- Create: `e2e/conditions.spec.ts` (ou no arquivo de e2e de magias e de combate que já existir, no mesmo estilo)
- Modify: visuais afetados (`npm run test:visual -- --update-snapshots` só das telas que mudaram)
- Modify: `docs/plans/2026-11-01-condicoes-e-tags.md` (status), `docs/plans/2026-10-20-roadmap.md` (nota no item 6)

- [ ] **Step 1: e2e:**
  - Abrir uma magia 5.2 com condição, em en e em pt, e ver o popover pelo toque e pelo teclado.
  - Mestre liga "Caído" num inimigo, e o jogador vê o selo sem recarregar.
  - Jogador liga "Envenenado" no próprio personagem, e o botão não aparece nos outros.
  - axe passa nas telas novas.
- [ ] **Step 2: Conferir no app** (`next dev`, desktop 1440px e celular 390px, como mestre e como jogador), com screenshots antes e depois do cartão de magia e do combate.
- [ ] **Step 3: Run** `npx tsc --noEmit`, `npm run lint`, `npx knip`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e` e `npm run test:visual`, tudo verde.
- [ ] **Step 4:** `/code-review`. A migração mexe em RLS e em função `SECURITY DEFINER`, então rode também o scan de segurança.
- [ ] **Step 5: PR** único, com descrição em pt e en, aviso de migração e "Parte de #105". Inclua o passo do Crowdin depois do merge: rodar a Action à mão com `upload_translations: true`. Sugira também configurar `{@…}` como marcação não traduzível no projeto do Crowdin, se a interface dele permitir (não é arquivo do repo). Marque o plano como entregue no último commit.
