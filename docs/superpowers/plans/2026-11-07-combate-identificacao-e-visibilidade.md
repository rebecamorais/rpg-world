# Combate: identificação, visibilidade e NPC caído — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar a todos o lado de cada participante (jogador, aliado, neutro, inimigo), dar ao mestre os estados visível/anônimo/oculto e o fluxo de NPC caído/morto, e garantir no servidor que o jogador só receba o que pode ver.

**Architecture:** Tudo que esconde mora no banco. Colunas novas em `encounter_participants`, regras por CHECK e por um gatilho BEFORE UPDATE, e `encounter_turns` reescrita para filtrar. O tempo real continua sendo broadcast vazio seguido de nova busca, então nenhum payload muda. No backend TS só mudam os tipos, o mapeamento do repositório e a validação do patch. No frontend, um `SideBadge` comum, a lista do jogador refeita e os controles novos na `CombatRow` do mestre.

**Tech Stack:** Postgres/Supabase (migrações em `database/migrations`, RLS, SECURITY DEFINER), Next.js route handlers + zod, React + next-intl + TanStack Query, Vitest (unit e integration).

**Spec:** `docs/superpowers/specs/2026-11-07-combate-identificacao-e-visibilidade-design.md`

## Global Constraints

- Nada de dado no broadcast do tempo real: `private.notify_encounter` continua mandando `'{}'`.
- O jogador nunca recebe PV, CA, atributos, testes contra a morte, `npc_fate`, nem nome/imagem de NPC anônimo, nem qualquer linha de NPC oculto.
- Morto não revelado sai para o jogador como `down`, igual a caído. Só `death_revealed` vira `dead`.
- NPC novo entra `hidden`. Linhas existentes na migração ficam `visible`.
- Lado de NPC: `ally`, `neutral`, `enemy`. Nunca troca de/para `player`.
- Cada lado tem ícone + texto + cor; tudo novo em contraste AA; avatar quadrado com cantos arredondados.
- Controles por ícone têm rótulo acessível e o texto aparece em hover, toque e foco (usar `ui/tooltip.tsx` ou `ui/hint.tsx`, o que já é usado para isso).
- Textos novos em `messages/pt.json` e `messages/en.json` (`es`/`sv` pelo Crowdin). O guard `hardcoded-text.unit.test.ts` falha com texto fixo na UI; ícones game-icons novos pedem `npm run icons`.
- Nomes de teste em português, como no resto do projeto.
- Branch `feat/combate-visibilidade`, um PR com commits por tema, corpo em pt + en.
- Antes do push: `npx tsc --noEmit`, `npm run lint`, `npm run knip`, `npm run test:coverage`, `npm run test:integration`, `npx playwright test`, `npm run test:visual` (com `--update-snapshots=all` se a tela de combate mudar de propósito).

## Review Focus

- Mestre cura um NPC morto e revelado: volta a `normal` para o jogador e o turno dele deixa de ser pulado (teste na Task 1).
- Todos os participantes mortos e revelados: `end_turn` não trava nem zera o turno atual (teste na Task 1).
- O NPC do turno atual é ocultado no meio do turno: o jogador recebe `hidden_turn = true` e nenhuma linha atual (teste na Task 2).
- Mestre manda `visibility`/`side`/`fate` para a linha de um jogador: resposta 4xx traduzida, não 500 (testes nas Tasks 1 e 3).
- NPC anônimo troca de lado: o rótulo acompanha ("Inimigo desconhecido" → "Aliado desconhecido") (teste na Task 4).

---

### Task 1: Colunas, regras e turno pulado no banco

**Files:**

- Create: `database/migrations/20261107120000_encounter_visibility.sql` (criar com `npx supabase migration new encounter_visibility --workdir database/db-dev < /dev/null` e renomear se preciso)
- Create: `src/backend/contexts/combat/infrastructure/encounter-visibility.integration.test.ts`
- Modify: `test/helpers/parties.ts:119-133` (`addParticipant` aceita `'neutral'`)
- Modify: `lib/types/database.ts` (regerado)

**Interfaces:**

- Produces (colunas em `public.encounter_participants`):
  - `side` passa a aceitar `'neutral'` (CHECK `encounter_participants_side_check` refeita com `('player','ally','neutral','enemy')`; política `encounter_participants_insert_gm` refeita com `side IN ('ally','neutral','enemy')`).
  - `visibility text NOT NULL` em `('visible','anonymous','hidden')`. Adicionar com `DEFAULT 'visible'` (preenche linhas atuais) e depois `ALTER ... SET DEFAULT 'hidden'`.
  - `npc_fate text NULL` em `('death_saves','dead')`.
  - `death_successes int NOT NULL DEFAULT 0` e `death_failures int NOT NULL DEFAULT 0`, ambos `BETWEEN 0 AND 3`.
  - `death_revealed boolean NOT NULL DEFAULT false`.
  - CHECKs: jogador ⇒ `visibility='visible' AND npc_fate IS NULL AND death_successes=0 AND death_failures=0 AND NOT death_revealed`; `npc_fate IS NULL OR hp_current = 0`; `NOT death_revealed OR npc_fate = 'dead'`.
  - `GRANT UPDATE (side, visibility, npc_fate, death_successes, death_failures, death_revealed)` a `authenticated` (RLS de UPDATE já é só do mestre).
  - Erro do banco `encounter_invalid_change` (P0001).
- Produces (regras):
  - `private.prepare_participant()`: além do que já faz, `NEW.visibility := 'visible'` quando `NEW.side = 'player'`.
  - Novo `private.guard_participant_update()` BEFORE UPDATE em `encounter_participants`, nesta ordem: (1) `(OLD.side = 'player') <> (NEW.side = 'player')` → `RAISE encounter_invalid_change`; (2) NPC com `NEW.hp_current > 0` → zera `npc_fate`, contadores e `death_revealed`; (3) `npc_fate = 'death_saves' AND death_failures >= 3` → `npc_fate := 'dead'`; (4) `npc_fate IS DISTINCT FROM 'dead'` → `death_revealed := false`.
  - `private.next_participant(p_party_id, p_after, p_skip)`: as duas buscas atuais ganham `AND NOT ep.death_revealed`; se nenhuma acha ninguém, repete as duas buscas originais sem esse filtro (assim o combate nunca trava).

- [ ] **Step 1: Escrever os testes de integração que falham**

Em `encounter-visibility.integration.test.ts`, mesmo `beforeEach` de `encounter-functions.integration.test.ts` (mestre, dois jogadores, um goblin `enemy`). Casos:

```ts
it('NPC novo entra oculto; jogador entra visível', …)              // visibility 'hidden' / 'visible'
it('aceita aliado, neutro e inimigo; recusa jogador ↔ NPC', …)     // update side neutral ok; side 'player' no goblin → error.message 'encounter_invalid_change'
it('jogador não pode ter visibilidade, destino nem testes', …)     // update visibility 'hidden' na linha do herói → erro de CHECK (23514)
it('só o mestre muda visibilidade e destino', …)                   // como player: update devolve 0 linhas
it('destino só com 0 PV; 3 falhas viram morto', …)                 // npc_fate com hp>0 → 23514; hp 0 + death_saves + failures 3 → npc_fate 'dead'
it('desmarcar morto tira a revelação; curar zera tudo', …)         // revealed true → fate 'death_saves' ⇒ revealed false; hp 5 ⇒ fate null, contadores 0, revealed false
it('pula o morto revelado no turno; não pula o não revelado', …)    // ordem herói, goblin, amigo: end_turn(herói) → atual = amigo só quando revealed
it('com todos mortos e revelados, o turno ainda anda', …)          // current_participant_id nunca vira null
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --config ./test/vitest.config.integration.ts encounter-visibility`
Expected: FAIL (colunas não existem)

- [ ] **Step 3: Escrever a migração** com o que está em Interfaces. Comentário no topo em português no estilo das migrações vizinhas, dizendo o que muda e por quê. Ao refazer as funções, use `CREATE OR REPLACE` e mantenha `SECURITY DEFINER`, `SET search_path = ''` e os GRANT/REVOKE.

- [ ] **Step 4: Aplicar e regerar os tipos**

Run: `npx supabase migration up --workdir database/db-test` e `npx supabase gen types typescript --local --schema public --workdir database/db-test > lib/types/database.ts`
Expected: `database.ts` com as colunas novas.

- [ ] **Step 5: Rodar a suíte de integração do combate**

Run: `npx vitest run --config ./test/vitest.config.integration.ts combat`
Expected: PASS, incluindo `encounters-rls`, `encounter-functions` e o teste que exige RLS em toda tabela pública.

- [ ] **Step 6: Commit** — `feat(combat): visibilidade, lado neutro e destino do NPC no banco / visibility, neutral side and NPC fate in the database`

---

### Task 2: `encounter_turns` filtra pelo que o jogador pode ver

**Files:**

- Modify: `database/migrations/20261107120000_encounter_visibility.sql` (mesma migração, nova seção no fim)
- Modify: `src/backend/contexts/combat/infrastructure/encounter-visibility.integration.test.ts`
- Modify: `lib/types/database.ts` (regerado)

**Interfaces:**

- Consumes: colunas da Task 1.
- Produces: `public.encounter_turns(p_party_id uuid)` com `DROP` + `CREATE`, devolvendo, nesta ordem:
  `round int, participant_id uuid, side text, name text, avatar_url text, life text, is_current boolean, is_mine boolean, conditions jsonb, hidden_turn boolean`
  - O `LEFT JOIN encounter_participants` ganha `AND ep.visibility <> 'hidden'` **na condição do JOIN** (não no WHERE), para que a linha "só a rodada" continue saindo quando ninguém é visível.
  - `name`: `NULL` quando `visibility = 'anonymous'`, senão `coalesce(ep.label, c.name)`.
  - `avatar_url`: `c.avatar_url` só para jogador e NPC `visible`; senão `NULL`.
  - `life`: `'normal'` se jogador ou `hp_current > 0`; `'dead'` se `death_revealed`; senão `'down'`.
  - `hidden_turn`: igual em todas as linhas, `EXISTS` do participante atual com `visibility = 'hidden'`.
  - Mantém o filtro de acesso atual (`is_party_gm OR is_party_member`) e os GRANT/REVOKE.

- [ ] **Step 1: Testes que falham** (como jogador, via `player.client.rpc('encounter_turns', …)`):

```ts
it('oculto não aparece para o jogador', …)                          // goblin hidden → nenhuma linha com seu id
it('anônimo vem sem nome e sem imagem, com o lado', …)              // name null, avatar_url null, side 'enemy'
it('visível vem com nome, imagem e lado', …)                        // name 'Goblin 1', avatar_url do npc
it('turno de oculto: ninguém atual e hidden_turn', …)               // current = goblin hidden → todas is_current false, hidden_turn true
it('ocultar no meio do turno do NPC esconde o turno', …)            // goblin visível atual → update hidden → hidden_turn true
it('morto não revelado vem como down; revelado como dead', …)
it('jogador com 0 PV na ficha continua normal', …)
it('a resposta nunca traz PV, testes nem destino', …)               // Object.keys(row) é exatamente a lista de colunas acima
```

- [ ] **Step 2: Rodar e ver falhar** — mesmo comando da Task 1. Expected: FAIL.
- [ ] **Step 3: Escrever a seção da migração** conforme Interfaces. Resetar o banco de teste (`npx supabase db reset --workdir database/db-test`), porque a migração mudou.
- [ ] **Step 4: Regerar tipos e rodar** `combat` de integração. Expected: PASS. `encounter-conditions.integration.test.ts` pode precisar de ajuste por causa das colunas novas. O comportamento de condições não muda.
- [ ] **Step 5: Commit** — `feat(combat): o jogador só recebe o que pode ver / players only receive what they may see`

---

### Task 3: Tipos, repositório e validação no backend

**Files:**

- Modify: `src/backend/contexts/combat/domain/Encounter.ts`
- Modify: `src/backend/contexts/combat/domain/repository/combat.repo.ts`
- Modify: `src/backend/contexts/combat/domain/gm-row.ts`
- Modify: `src/backend/contexts/combat/domain/CombatError.ts`
- Modify: `src/backend/contexts/combat/infrastructure/supabase-combat.repository.ts`
- Modify: `src/backend/contexts/combat/application/update-participant.use-case.ts`
- Modify: `src/backend/contexts/combat/interfaces/combat.schemas.ts`
- Modify: `messages/pt.json`, `messages/en.json` (erro novo)
- Test: `src/backend/contexts/combat/application/combat.use-cases.unit.test.ts`, `src/backend/contexts/combat/infrastructure/supabase-combat.repository.integration.test.ts`

**Interfaces:**

- Consumes: `encounter_turns` e colunas das Tasks 1–2.
- Produces (em `Encounter.ts`):

```ts
export type Side = 'player' | 'ally' | 'neutral' | 'enemy';
export type NpcSide = Exclude<Side, 'player'>; // NPC_SIDES inclui 'neutral'
export type Visibility = 'visible' | 'anonymous' | 'hidden';
export type NpcFate = 'death_saves' | 'dead';
export type Life = 'normal' | 'down' | 'dead';

export interface TurnEntry {
  participantId: string;
  side: Side;
  /** null when anonymous: the client shows "Unknown enemy/ally/neutral". */
  name: string | null;
  avatarUrl: string | null;
  life: Life;
  isCurrent: boolean;
  isMine: boolean;
  conditions: ActiveCondition[];
}
export interface PlayerEncounterView {
  role: 'player';
  round: number;
  hiddenTurn: boolean;
  turns: TurnEntry[];
}

// GmRow ganha:
visibility: Visibility; // players: 'visible'
fate: NpcFate | null; // NPCs at 0 HP only
deathRevealed: boolean;
// deathSaves passa a valer também para NPC com fate 'death_saves' (do participante, não da ficha)
```

- `ParticipantRecord` ganha `visibility`, `fate`, `deathSaves: { successes; failures }`, `deathRevealed`.
- `ParticipantPatch` ganha `side?: NpcSide; visibility?: Visibility; fate?: NpcFate | null; deathSaves?: { successes: number; failures: number }; deathRevealed?: boolean`.
- `CombatErrorCodes.INVALID_CHANGE = 'combat_error_invalid_change'`. `DATABASE_ERRORS` mapeia `encounter_invalid_change` para ele. Texto pt: "Essa mudança não vale para jogadores."; en: "That change doesn't apply to players."
- `participantSchema.side`: `z.enum(['ally','neutral','enemy'])`. `participantPatchSchema` ganha `side` (mesmo enum), `visibility`, `fate` (`nullable`), `deathSaves` (`{ successes: 0..3, failures: 0..3 }`) e `deathRevealed`.

- [ ] **Step 1: Testes unitários que falham** em `combat.use-cases.unit.test.ts`:

```ts
it('recusa lado, visibilidade, destino e testes na linha de um jogador', …)  // rejects CombatError INVALID_CHANGE, repo.updateParticipant não chamado
it('aceita mudar o lado de um NPC para neutro', …)
it('a visão do jogador repassa hiddenTurn e as entradas', …)               // GetEncounterUseCase
it('a linha do mestre traz os testes do NPC quando o destino é death_saves', …) // toGmRow
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run --config ./test/vitest.config.unit.ts combat`
- [ ] **Step 3: Implementar.** `turns()` mapeia as colunas novas e `hiddenTurn` da primeira linha. `findEncounter()` seleciona e mapeia as colunas novas. `updateParticipant()` traduz o patch para snake_case (`deathSaves` vira duas colunas). O use case lança `INVALID_CHANGE` quando a linha é `player` e o patch tem qualquer campo de NPC.
- [ ] **Step 4: Ajustar o teste de integração do repositório** para ler `visibility`/`fate` e o `turns()` novo. Rodar unit + integration `combat`. Expected: PASS. `tsc --noEmit` vai apontar o frontend; isso é resolvido nas Tasks 4–6, mas `PlayerCombatPanel` e `useEncounter` precisam compilar já (o mínimo, como `turn.name ?? ''`, vale aqui e é refeito na Task 4).
- [ ] **Step 5: Commit** — `feat(combat): tipos e patch de visibilidade e destino / visibility and fate types and patch`

---

### Task 4: Lado e lista do jogador

**Files:**

- Create: `src/frontend/components/combat/SideBadge.tsx` + `SideBadge.unit.test.tsx`
- Create: `src/frontend/components/combat/PlayerTurnRow.tsx` (a `<li>` que hoje está inline em `PlayerCombatPanel.tsx`)
- Modify: `src/frontend/components/combat/PlayerCombatPanel.tsx`, `PlayerCombatPanel.unit.test.tsx`
- Modify: `messages/pt.json`, `messages/en.json`

**Interfaces:**

- Consumes: `TurnEntry`, `PlayerEncounterView.hiddenTurn`, `Side` (Task 3).
- Produces: `SideBadge({ side }: { side: Side })`, que renderiza ícone (aria-hidden) + texto traduzido, com cor por lado via tokens do tema (nada de paleta Tailwind crua: `design-tokens.unit.test.ts`). Se faltar token, adicionar no tema com contraste AA. Usado também pelas Tasks 5–6.
- Textos (`combat.*`): `player` "Jogador"/"Player", `neutral` "Neutro"/"Neutral" (`ally`/`enemy` já existem); `unknownEnemy` "Inimigo desconhecido"/"Unknown enemy", `unknownAlly` "Aliado desconhecido"/"Unknown ally", `unknownNeutral` "Neutro desconhecido"/"Unknown neutral"; `gmTurn` "O mestre está conduzindo o turno"/"The GM is running this turn"; `down` "Caído"/"Down"; `dead` "Morto"/"Dead".

- [ ] **Step 1: Testes que falham** em `PlayerCombatPanel.unit.test.tsx` / `SideBadge.unit.test.tsx`:

```ts
it('mostra o lado de cada participante com texto, inclusive no turno atual', …)
it('anônimo mostra "Inimigo desconhecido" sem imagem e sem botão de ampliar', …)
it('anônimo que vira aliado mostra "Aliado desconhecido"', …)
it('visível com imagem tem o botão de ampliar', …)                       // ViewImageButton
it('caído fica com a linha marcada como caída', …)                       // texto "Caído" acessível
it('morto mostra a linha fina com nome riscado e caveira', …)            // <s> no nome, texto "Morto" acessível
it('turno de oculto: nenhuma linha atual e a mensagem do mestre', …)
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run --config ./test/vitest.config.unit.ts PlayerCombatPanel SideBadge`
- [ ] **Step 3: Implementar.**
  - `PlayerTurnRow`: avatar quadrado com cantos arredondados (`CharacterPortrait`; marcador "?" para anônimo) e `ViewImageButton` só com `avatarUrl`.
  - Caído: linha em tons de cinza (`grayscale` + opacidade), tamanho normal.
  - Morto, como o modelo A: linha baixa, borda tracejada, miniatura de 20px cinza, nome em `<s>` e ícone de caveira com texto `dead` para leitor de tela.
  - Caído e morto têm o texto `down`/`dead` acessível, não só visual.
  - No painel: `hiddenTurn` mostra `gmTurn` (`role="status"`) acima da lista.
- [ ] **Step 4: Rodar** os testes acima e `npx vitest run --config ./test/vitest.config.unit.ts hardcoded-text design-tokens`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(combat): lado, anônimo e caído na lista do jogador / side, anonymous and down in the player's list`

---

### Task 5: Mestre — lado sempre visível, visibilidade e troca de lado

**Files:**

- Modify: `src/frontend/components/combat/CombatRow.tsx`, `CombatRow.unit.test.tsx`, `fixtures.ts` (defaults `visibility: 'visible'`, `fate: null`, `deathRevealed: false`)
- Modify: `src/frontend/components/combat/GmCombatPanel.tsx`, `GmCombatPanel.unit.test.tsx` (opção "Neutro" ao adicionar)
- Modify: `src/frontend/hooks/useEncounter.ts` (tipo `side` do `addParticipant` inclui `'neutral'`)
- Modify: `messages/pt.json`, `messages/en.json`

**Interfaces:**

- Consumes: `SideBadge` (Task 4), `ParticipantPatch` com `side`/`visibility` (Task 3), `onChange(patch)` que a `CombatRow` já recebe.
- Textos (`combat.*`): `show` "Mostrar"/"Show", `anonymize` "Anonimizar"/"Make anonymous", `hide` "Ocultar"/"Hide"; estado atual `visibilityVisible` "Visível"/"Visible", `visibilityAnonymous` "Anônimo"/"Anonymous", `visibilityHidden` "Oculto"/"Hidden"; `changeSideOf` "Lado de {name}"/"Side of {name}"; `addNeutral` "Adicionar neutro"/"Add neutral".

- [ ] **Step 1: Testes que falham:**

```ts
it('mostra o lado também no turno do NPC, junto de "Vez atual"', …)
it('NPC mostra o estado de visibilidade e três ações com rótulo', …)   // getByRole('button', { name: 'Ocultar' }) etc.; a ação do estado atual tem aria-pressed=true
it('clicar em Anonimizar chama onChange({ visibility: "anonymous" })', …)
it('jogador não tem controles de visibilidade nem de lado', …)
it('trocar o lado chama onChange({ side: "neutral" })', …)
it('adicionar NPC oferece aliado, neutro e inimigo', …)               // GmCombatPanel
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run --config ./test/vitest.config.unit.ts CombatRow GmCombatPanel`
- [ ] **Step 3: Implementar.**
  - `status` deixa de trocar o lado por "Vez atual". `SideBadge` aparece sempre, e "Vez atual" aparece ao lado.
  - Os controles de visibilidade são três botões de ícone com tooltip, um grupo `role="group"` com rótulo, e `aria-pressed` no estado atual.
  - A troca de lado usa o `ui/select.tsx` que o painel já usa para escolher o lado.
  - Os controles ficam acima do link esticado do card (`relative z-10`), como o `ViewImageButton`, para não navegar nem expandir a linha.
- [ ] **Step 4: Rodar** os testes e os guards. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(combat): controles de visibilidade e lado para o mestre / visibility and side controls for the GM`

---

### Task 6: Mestre — caído, testes contra a morte, morto e revelar

**Files:**

- Modify: `src/frontend/components/combat/CombatRow.tsx`, `CombatRow.unit.test.tsx`
- Create (se a `CombatRow` passar de ~350 linhas): `src/frontend/components/combat/NpcFateControls.tsx` + teste
- Modify: `messages/pt.json`, `messages/en.json`

**Interfaces:**

- Consumes: `GmRow.fate`, `GmRow.deathSaves`, `GmRow.deathRevealed`, `ParticipantPatch.fate`/`deathSaves`/`deathRevealed` (Task 3).
- Textos (`combat.*`): `chooseFate` "O que acontece com {name}?"/"What happens to {name}?", `fateDeathSaves` "Testes contra a morte"/"Death saves", `fateDead` "Morto"/"Dead", `undoDead` "Não está morto"/"Not dead", `revealDeath` "Revelar morte"/"Reveal death", `hideDeath` "Esconder morte"/"Hide death", `deathSuccess` "Sucesso {n}"/"Success {n}", `deathFailure` "Falha {n}"/"Failure {n}", `stable` "Estável"/"Stable", `deathHiddenHint` "Os jogadores veem só “caído”."/"Players only see “down”.".

- [ ] **Step 1: Testes que falham:**

```ts
it('NPC com 0 PV fica cinza e oferece Testes contra a morte e Morto', …)
it('escolher testes chama onChange({ fate: "death_saves" })', …)
it('marcar a 2ª falha chama onChange({ deathSaves: { successes: 0, failures: 2 } })', …)
it('3 sucessos mostram "Estável"', …)
it('morto não revelado oferece Revelar morte e avisa que jogadores veem caído', …)
it('revelar chama onChange({ deathRevealed: true }); esconder volta para false', …)
it('morto revelado fica recolhido como na lista do jogador e ainda abre ao clicar', …)
it('jogador com 0 PV continua mostrando só os testes da ficha', …)   // comportamento atual intacto
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run --config ./test/vitest.config.unit.ts CombatRow NpcFateControls`
- [ ] **Step 3: Implementar.**
  - As marcações de teste são 3 + 3 botões de alternar (`aria-pressed`), e marcar o n-ésimo define o contador em n.
  - "Não está morto" manda `fate: 'death_saves'`. O banco tira a revelação sozinho.
  - O morto revelado usa a mesma aparência recolhida da Task 4 (extrair o estilo para um lugar comum se fizer sentido), mas continua expansível pelo `toggle` atual.
- [ ] **Step 4: Rodar** os testes e os guards. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(combat): NPC caído, testes contra a morte e revelar morte / downed NPC, death saves and death reveal`

---

### Task 7: Verificação completa e PR

**Files:**

- Modify: snapshots visuais/e2e de combate, se existirem e mudarem de propósito
- Commit junto: `docs/superpowers/specs/2026-11-07-combate-identificacao-e-visibilidade-design.md` e este plano

- [ ] **Step 1:** Rodar `npx tsc --noEmit`, `npm run lint`, `npm run knip`, `npm run test:coverage`, `npm run test:integration` e, separadamente (compartilham o banco), `npx playwright test` e `npm run test:visual`. Expected: tudo PASS. Se a tela de combate mudou de propósito: `npm run test:visual -- --update-snapshots=all`, conferindo as imagens novas.
- [ ] **Step 2:** Conferir no app local (`npm run seed:local`, mestre e um jogador em navegadores separados): adicionar goblins (entram ocultos e o jogador não vê); anonimizar (o jogador vê "Inimigo desconhecido"); 0 PV com morto não revelado (o jogador vê caído e o turno passa); revelar (linha fina e o turno pulado). Na aba Network do jogador, a resposta de `/encounter` não traz nome nem imagem do anônimo, nem a linha do oculto.
- [ ] **Step 3:** Commit dos docs, push e PR com corpo em pt + en terminando com a linha de atribuição do Claude Code.
