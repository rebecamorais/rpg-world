# Combate simplificado: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O que este plano entrega:

- Linhas de combate enxutas: a do mestre fica só leitura, com a edição na linha aberta.
- O @ de quem joga no lugar de "Jogador".
- "Voltar turno" para o mestre.
- Iniciativa editada pelo próprio jogador.
- "Ver ficha" na linha do jogador.
- "Trocar com" no lugar de subir e descer.

**Architecture:** Duas funções SQL novas, ambas SECURITY DEFINER: `previous_turn` e `set_my_initiative`. `encounter_turns` ganha três colunas, sem mudar nenhuma regra de visibilidade. O backend TS ganha os comandos e as rotas correspondentes. No frontend, a `CombatRow` é dividida em linha fechada (só leitura) e detalhes (edição), e a `PlayerTurnRow` ganha as ações do próprio personagem. Um componente de avatar clicável substitui o `ViewImageButton` nas listas.

**Tech Stack:** Postgres/Supabase (migrações em `database/migrations`), Next.js route handlers + zod, React + next-intl + TanStack Query + sonner, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-09-combate-simplificado-design.md`

## Global Constraints

- Nada do Projeto 3 muda. O jogador nunca recebe a iniciativa dos outros, dados de NPC oculto, nem nome ou imagem de anônimo. O tempo real continua mandando só `'{}'`.
- Linha fechada do mestre **sem nenhum campo nem botão de edição**. O único controle é o de abrir e fechar.
- Iniciativa: inteiro de -10 a 99, ou vazio (NULL). Sem decimal. Nenhuma mudança de tipo no banco.
- "Ordenar por iniciativa" continua manual. A lista nunca se reordena sozinha.
- A rodada nunca fica abaixo de 1 depois de "Começar".
- O @ só aparece quando a pessoa já escolheu o username (`profile.username_chosen`). Se não escolheu, a linha mostra "Jogador".
- Textos novos em `messages/pt.json` e `messages/en.json`. Respeitar os guards `hardcoded-text`, `design-tokens` e game-icons (`npm run icons` para ícone novo).
- Contraste AA em tudo que for novo. Botões de ícone com rótulo acessível.
- Nomes de teste em português. Branch `feat/combate-simplificado`. Um PR com commits por tema e corpo em pt e en.
- Antes do push: `npx tsc --noEmit`, `npm run lint`, `npm run knip`, `npm run test:coverage`, `npm run test:integration`, `npx playwright test` (nunca junto com a integração) e `npm run test:visual`.

## Review Focus

- Voltar turno quando o primeiro da lista é um morto revelado: a vez na rodada 1 é do segundo, e voltar deve recusar, não ir para a rodada 0 (teste na Task 1).
- Jogador chama `set_my_initiative` com o id de outro jogador ou de um NPC: recusado, sem revelar se a linha existe (teste na Task 2).
- Pessoa que ainda não escolheu o username: a linha mostra "Jogador", não o username aleatório (testes nas Tasks 2 e 4).
- Mestre clica dentro da linha aberta (campo, select ou botão): a linha não fecha (teste na Task 4).
- Jogador limpa o campo "Sua iniciativa": grava NULL, sem gravar 0 (teste na Task 5).

---

### Task 1: Voltar turno no banco

**Files:**

- Create: `database/migrations/20261109120000_encounter_previous_turn.sql` (via `npx supabase migration new encounter_previous_turn --workdir database/db-dev < /dev/null`, renomeando se preciso)
- Create: `src/backend/contexts/combat/infrastructure/encounter-previous-turn.integration.test.ts`
- Modify: `lib/types/database.ts` (regerado)

**Interfaces:**

- Produces:
  - `private.previous_participant(p_party_id uuid, p_before int) RETURNS TABLE (participant_id uuid, wrapped boolean)`. É o espelho de `private.next_participant`:
    - procura a maior posição `< p_before`, pulando `death_revealed`;
    - se não acha, dá a volta para a maior posição (`wrapped = true`);
    - se ninguém sobra além dos mortos revelados, repete sem o filtro.
  - `public.previous_turn(p_party_id uuid) RETURNS void`, SECURITY DEFINER, `SET search_path = ''`, com o mesmo `pg_advisory_xact_lock` de `end_turn`:
    - Combate inexistente ou rodada 0: `encounter_not_found`.
    - Quem chama não é o mestre: `encounter_not_your_turn`.
    - Sem participante atual: `encounter_not_your_turn`.
    - `wrapped` com rodada 1: `encounter_at_start` (novo, P0001).
    - Caso contrário: grava `current_participant_id` e diminui `round` em 1 quando `wrapped`.
    - GRANT EXECUTE para `authenticated` e `service_role`. REVOKE de PUBLIC e `anon`.

- [ ] **Step 1: Testes que falham** (no mesmo formato de `encounter-functions.integration.test.ts`):

```ts
it('só o mestre volta o turno', …)                                    // como jogador: error.message 'encounter_not_your_turn'
it('volta para o anterior na mesma rodada', …)                        // ordem herói, goblin, amigo; atual = amigo → goblin, rodada igual
it('antes do primeiro vai para o último e a rodada diminui', …)       // rodada 2, atual = herói → amigo, rodada 1
it('na rodada 1 com a vez no primeiro, recusa com encounter_at_start', …)
it('primeiro é morto revelado: na rodada 1 a vez no segundo também recusa', …)
it('pula o morto revelado ao voltar', …)
it('sem combate começado, recusa com encounter_not_found', …)
```

- [ ] **Step 2: Rodar e ver falhar**: `npx vitest run --config ./test/vitest.config.integration.ts encounter-previous-turn`. Esperado: FAIL.
- [ ] **Step 3: Escrever a migração.** Comentário no topo em português, no estilo das vizinhas.
- [ ] **Step 4: Aplicar e regerar os tipos.**
  - Aplicar: `npx supabase migration up --workdir database/db-test`.
  - Regerar: `npx supabase gen types typescript --local --schema public --workdir database/db-test > lib/types/database.ts`.
  - Rodar o filtro `combat` da integração. Esperado: PASS.
- [ ] **Step 5: Commit**: `feat(combat): voltar turno no banco / previous turn in the database`

---

### Task 2: Iniciativa do jogador e @ em `encounter_turns`

**Files:**

- Create: `database/migrations/20261109130000_encounter_player_initiative.sql`
- Create: `src/backend/contexts/combat/infrastructure/encounter-player-initiative.integration.test.ts`
- Modify: os testes de integração que conferem a lista exata de colunas de `encounter_turns` (`encounter-visibility.integration.test.ts`, e outros se houver)
- Modify: `lib/types/database.ts` (regerado)

**Interfaces:**

- Produces:
  - `public.set_my_initiative(p_party_id uuid, p_participant_id uuid, p_initiative int) RETURNS boolean`. Segue o mesmo modelo e as mesmas condições de dono de `public.set_participant_conditions` (`20261101170000_encounter_conditions.sql:73-117`), mas sem o atalho do mestre:
    - Só a linha `player` cujo personagem pertence a quem chama, com membro ativo e personagem levado à mesa.
    - Em qualquer outro caso devolve `false`.
    - Aceita NULL. Fora de -10..99 o CHECK existente recusa (23514).
  - `public.encounter_turns` é recriada com DROP + CREATE (copiar a definição atual de `20261107120000_encounter_visibility.sql` §8) e ganha três colunas no fim:
    - `initiative int`: só onde `is_mine`, senão NULL.
    - `character_id uuid`: só onde `is_mine`, senão NULL.
    - `owner_username text`: só em linha `player` com `username_chosen`, senão NULL.

- [ ] **Step 1: Testes que falham:**

```ts
it('jogador muda a própria iniciativa e pode limpar', …)              // 14 → initiative 14; null → null
it('jogador não muda a iniciativa de outro jogador nem de NPC', …)    // data false, linha intacta
it('fora de -10..99 recusa', …)                                       // 100 → error code '23514'
it('encounter_turns traz a própria iniciativa e o id do personagem, só na própria linha', …)
it('encounter_turns traz o @ só de quem escolheu o username', …)      // username_chosen false → owner_username null
it('NPC nunca tem owner_username', …)
it('a lista de colunas é exatamente a esperada', …)                   // Object.keys com as 13 colunas
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Escrever a migração**, mantendo todo o filtro do Projeto 3 e os GRANT e REVOKE.
- [ ] **Step 4: Aplicar, regerar os tipos e rodar o filtro `combat` da integração.** Esperado: PASS, inclusive nos testes antigos de visibilidade.
- [ ] **Step 5: Commit**: `feat(combat): iniciativa do jogador e @ na lista / player initiative and @ in the turn list`

---

### Task 3: Backend TS, rotas e hook

**Files:**

- Modify: `src/backend/contexts/combat/domain/Encounter.ts`, `domain/repository/combat.repo.ts`, `domain/gm-row.ts`, `domain/CombatError.ts`
- Modify: `src/backend/contexts/combat/infrastructure/supabase-combat.repository.ts`
- Modify: `src/backend/contexts/combat/application/encounter-commands.ts`, `CombatContext.ts`, `get-encounter.use-case.ts`, `src/backend/contexts/combat/index.ts`, `interfaces/combat.api.ts`, `interfaces/combat.schemas.ts`
- Create: `app/api/parties/[partyId]/encounter/turn/previous/route.ts` + `route.unit.test.ts`
- Create: `app/api/parties/[partyId]/encounter/participants/[participantId]/initiative/route.ts` + `route.unit.test.ts`
- Modify: `src/frontend/hooks/useEncounter.ts` + teste
- Modify: `messages/pt.json`, `messages/en.json` (erro novo)
- Test: `application/combat.use-cases.unit.test.ts`, `supabase-combat.repository.integration.test.ts`

**Interfaces:**

- Consumes: as funções e colunas das Tasks 1 e 2.
- Produces:
  - `TurnEntry` ganha:
    - `initiative: number | null`: só na própria linha.
    - `characterId: string | null`: só na própria linha.
    - `ownerUsername: string | null`.
  - `GmRow` ganha `ownerUsername: string | null` (só jogador).
    - `CombatSheet` ganha `ownerId`.
    - O repositório chama `party_people(p_party_id)` e cruza `user_id` com `ownerId`, usando só o username não nulo.
  - `CombatRepo.previousTurn(partyId: string): Promise<void>` e `CombatRepo.setMyInitiative(partyId: string, participantId: string, initiative: number | null): Promise<boolean>`.
  - `CombatContext.previousTurn(partyId)` e `CombatContext.setMyInitiative(partyId, participantId, initiative)`. Este último lança `CombatError(NOT_FOUND)` quando o repositório devolve `false`.
  - `CombatErrorCodes.AT_START = 'combat_error_at_start'` (validação). `DATABASE_ERRORS` mapeia `encounter_at_start` para ele. Textos: pt "O combate já está no primeiro turno." e en "The combat is already at its first turn."
  - Rotas:
    - `POST /api/parties/{partyId}/encounter/turn/previous`, sem corpo.
    - `PUT /api/parties/{partyId}/encounter/participants/{participantId}/initiative`, com corpo `{ initiative: number | null }`, inteiro de -10 a 99 (`initiativeSchema`).
    - Ambas seguem o formato de `.../conditions/route.ts` e de `.../turn/route.ts`.
  - `useEncounter` ganha:
    - `previousTurn`: mutação sem argumento.
    - `setMyInitiative`: mutação `({ participantId, initiative })`, com `onMutate` otimista no `turn.initiative` da visão do jogador.

- [ ] **Step 1: Testes que falham:**
  - Use cases: `setMyInitiative` com `false` lança `NOT_FOUND`; a visão do mestre traz `ownerUsername` do `party_people`; a visão do jogador repassa `initiative`, `characterId` e `ownerUsername`.
  - Rotas: validação de corpo e chamada da API.
  - Hook: atualização otimista da iniciativa.
- [ ] **Step 2: Rodar e ver falhar**: `npx vitest run --config ./test/vitest.config.unit.ts combat encounter useEncounter`
- [ ] **Step 3: Implementar.** Atualizar `fixtures.ts` (`gmRow`: `ownerUsername: null`) e qualquer fixture de `TurnEntry`, para o `tsc` passar.
- [ ] **Step 4: Rodar** os testes unitários acima, o filtro `combat` da integração e `npx tsc --noEmit`. Esperado: PASS.
- [ ] **Step 5: Commit**: `feat(combat): voltar turno e iniciativa do jogador na API / previous turn and player initiative in the API`

---

### Task 4: Linha do mestre enxuta, voltar turno e trocar

**Files:**

- Create: `src/frontend/components/combat/ZoomablePortrait.tsx` + teste. É o avatar que abre o `ImageViewerDialog` ao clicar, no mesmo padrão de `CharacterHeader.tsx:85-100`. Sem imagem ou com `zoomable={false}`, é só a imagem.
- Create: `src/frontend/components/combat/CombatRowDetails.tsx` (a parte aberta) + teste
- Create: `src/frontend/components/combat/RowStatus.tsx` + teste. É o selo de estado: oculto, anônimo, caído, morto ou estável. Visível não tem selo.
- Modify: `CombatRow.tsx`, `CombatRow.unit.test.tsx`, `GmCombatPanel.tsx`, `GmCombatPanel.unit.test.tsx`, `src/frontend/lib/initiative-order.ts` + teste, `messages/*.json`

**Interfaces:**

- Consumes: `GmRow.ownerUsername` e `useEncounter.previousTurn` (Task 3).
- Produces:
  - `ZoomablePortrait({ src, name, zoomable = true, className, children? })`, também usado na Task 5.
  - `isSortedByInitiative(rows): boolean` em `initiative-order.ts`. É verdadeiro quando `sortByInitiative(rows)` dá a ordem atual.
  - `tiedNeighbors(rows, index): { above?: row; below?: row }`: os vizinhos com a mesma iniciativa, não nula.
- Textos `combat.*` (en entre parênteses):
  - `previousTurn` "Voltar turno" ("Previous turn")
  - `turnBackTo` "Vez voltou para {name}" ("Turn went back to {name}")
  - `swapWith` "Trocar com {name}" ("Swap with {name}")
  - `orderChanged` "ordem mudou" ("order changed")
  - `player` continua "Jogador", como fallback do @
  - Os estados reutilizam `visibilityHidden`, `visibilityAnonymous`, `down`, `dead` e `deathStable`.
  - Saem `moveUp` e `moveDown`, se nada mais usar.

- [ ] **Step 1: Testes que falham:**

```ts
it('linha fechada não tem campo nem botão de edição', …)    // nenhum textbox/spinbutton/combobox; único botão = detalhes
it('linha fechada mostra iniciativa, nome, @, PV e condições', …)
it('jogador sem @ mostra "Jogador"', …)
it('NPC mostra o selo de estado; visível não tem selo', …)
it('clicar na linha abre; clicar num campo da linha aberta não fecha', …)
it('a linha aberta tem iniciativa, PV, visibilidade, lado, condições, abrir ficha e tirar do combate', …)
it('não existe mais subir nem descer', …)
it('"Trocar com" só aparece com vizinho de mesma iniciativa e grava a troca', …)  // setOrder com os dois ids trocados
it('clicar no avatar abre a imagem ampliada', …)
it('Voltar turno chama previousTurn e fica desabilitado na rodada 1 com a vez no primeiro jogável', …)
it('"Ordenar por iniciativa" mostra "ordem mudou" quando a lista está fora de ordem', …)
it('isSortedByInitiative / tiedNeighbors', …)   // unit em initiative-order.unit.test.ts
```

- [ ] **Step 2: Rodar e ver falhar**: `npx vitest run --config ./test/vitest.config.unit.ts combat initiative-order`
- [ ] **Step 3: Implementar.**
  - Ao voltar, o aviso é `toast(t('turnBackTo', { name }))`, com o nome de quem ficou com a vez depois da nova busca. Pode ser o nome previsto no cliente: o anterior jogável na ordem atual.
  - A `CombatRow` fechada fica abaixo de 200 linhas. A edição mora em `CombatRowDetails`.
  - `CollapsedDeadRow` continua igual.
- [ ] **Step 4: Rodar** os testes e os guards. Esperado: PASS.
- [ ] **Step 5: Commit**: `feat(combat): linha do mestre enxuta, voltar turno e trocar / lean GM row, previous turn and swap`

---

### Task 5: Linha do jogador com iniciativa, ver ficha e encerrar turno

**Files:**

- Modify: `src/frontend/components/combat/PlayerTurnRow.tsx`, `PlayerCombatPanel.tsx`, `PlayerCombatPanel.unit.test.tsx`, `messages/*.json`

**Interfaces:**

- Consumes:
  - `TurnEntry.initiative`, `characterId` e `ownerUsername`, e `useEncounter.setMyInitiative` (Task 3).
  - `ZoomablePortrait` (Task 4).
- Textos `combat.*`:
  - `yourInitiative` "Sua iniciativa" ("Your initiative")
  - `viewSheet` "Ver ficha" ("View sheet")
  - `endMyTurn` já existe.

- [ ] **Step 1: Testes que falham:**

```ts
it('a própria linha tem "Sua iniciativa", Condições e Ver ficha', …)   // link para /system/DnD_5e/character/{characterId}
it('mudar a iniciativa chama setMyInitiative ao sair do campo', …)
it('limpar o campo grava null, não 0', …)
it('"Encerrar meu turno" fica dentro da própria linha, só na vez dele', …)
it('outras linhas não têm campo, link nem iniciativa', …)
it('mostra o @ do dono; sem @ mostra "Jogador"', …)
it('clicar no avatar visível amplia; anônimo e sem imagem não', …)
it('não há botão de ampliar sobre o avatar', …)
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.**
  - O campo de iniciativa reutiliza o mesmo padrão de número do `NumberCell` da `CombatRow` (grava ao sair do campo, aceita vazio). Se valer a pena, extrair para `src/frontend/components/combat/InitiativeInput.tsx`, e a Task 4 passa a usá-lo também.
  - Sai o botão "Encerrar meu turno" do rodapé do painel.
- [ ] **Step 4: Rodar** os testes e os guards. Esperado: PASS.
- [ ] **Step 5: Commit**: `feat(combat): iniciativa, ver ficha e encerrar turno na linha do jogador / initiative, view sheet and end turn on the player's row`

---

### Task 6: Verificação completa e PR

- [ ] **Step 1:** Rodar todos os comandos de Global Constraints. Ajustar os e2e que usavam subir e descer ou o "Encerrar meu turno" do rodapé (`e2e/combat.spec.ts`, `e2e/conditions*.spec.ts`).
  - Se a tela de combate mudar de propósito: `npm run test:visual -- --update-snapshots=all`, conferindo as imagens novas.
  - A falha antiga de "Ordenar por iniciativa" sob carga não é deste PR. Se aparecer, registrar.
- [ ] **Step 2:** Conferir no app local com `npm run seed:local`, mestre e jogador em navegadores separados:
  - linha do mestre fechada sem controles;
  - jogador muda a iniciativa e o "Ordenar" do mestre acende;
  - "Voltar turno" e o aviso;
  - "Trocar com" num empate;
  - "Ver ficha";
  - o @ nas linhas.
- [ ] **Step 3:** Commit do design e deste plano, push e PR com corpo em pt e en, terminando com a linha de atribuição do Claude Code.
