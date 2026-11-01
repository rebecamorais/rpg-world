# Mesas — fase 2: plano de implementação (combate + correções da fase 1)

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: superpowers:subagent-driven-development (recomendado) ou
> superpowers:executing-plans, tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** dar ao mestre o modo Combate: um rastreador de iniciativa com rodada e turno, com
personagens da mesa e fichas de inimigo dele, em tempo real para todos. Junto, fechar os seis
pontos que ficaram da fase 1.

**Arquitetura:** o banco continua sendo a regra. O combate tem duas tabelas,
`encounters` (uma por mesa, com rodada e turno atual) e `encounter_participants`. Só o mestre
acessa as duas pelo RLS; o jogador **não lê nenhuma das duas**. O que ele vê (ordem, nomes, de quem é a vez,
quais são dele) vem da função `encounter_turns`, e o turno só anda pela função `end_turn`, que
confere quem pode. O tempo real é **Broadcast privado** do Supabase: triggers mandam ao tópico
`party:<id>` um aviso **sem conteúdo** (`{}`) a cada mudança, e o app busca de novo a própria
visão pela API. Assim nada que o jogador não pode ver trafega no canal. Quem escuta o tópico é
decidido por uma política em `realtime.messages`. Inimigo é um personagem `kind = 'npc'` do
mestre; o PV de cada inimigo fica no participante. No app, um contexto novo `combat`, rotas em
`/api/parties/[partyId]/encounter/...` e o painel de combate na página da mesa.

**Stack:** Supabase (SQL, RLS, RPC, Realtime Broadcast), Next.js 16, next-intl, TanStack Query,
Vitest (unit + integration), Playwright.

**Spec:** [`2026-10-28-mesas-fase-2-combate.md`](2026-10-28-mesas-fase-2-combate.md). A fase 1 está
na main (#124, #125); o plano dela é
[`2026-10-31-mesas-fase-1-plano.md`](2026-10-31-mesas-fase-1-plano.md).

**Spike já feito (2026-10-31, banco de teste):** um canal `private: true` com política `FOR SELECT`
em `realtime.messages` assina para o tópico permitido e dá `CHANNEL_ERROR Unauthorized` para os
outros. `realtime.send('{}', 'ping', topic, true)` chega com payload `{ id }` e nada mais. O
cliente precisa de `await client.realtime.setAuth()` depois do login.

**Entrega em um PR só** (branch `feat/mesas-fase-2`, decisão da Rebeca para simplificar): este
plano, as migrações (Tarefas 1–5) e o app (Tarefas 6–15), um commit por assunto. As migrações vão
para produção no merge junto com o app que as usa.

## Decisões deste plano (para a Rebeca revisar)

1. **Correções da fase 1:**

   | Ponto da fase 1                     | O que este plano faz                                                                                                                                                                                         |
   | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | Política do mestre linha a linha    | Vira uma checagem por conjunto (`id IN (SELECT private.gm_readable_character_ids())`), calculada uma vez por consulta.                                                                                       |
   | Personagem apagado mantém o vínculo | Um trigger tira o personagem das mesas e dos combates quando `deleted_at` é preenchido.                                                                                                                      |
   | Dois "Salvar" ao mesmo tempo        | O repositório insere com `ON CONFLICT DO NOTHING` (upsert com `ignoreDuplicates`).                                                                                                                           |
   | Convidar quem já é membro           | Erro "já está na mesa" (`party_already_member`).                                                                                                                                                             |
   | Trocar o link                       | Descarta os pedidos `requested` (um trigger na troca do código); o aviso de confirmação diz isso.                                                                                                            |
   | `party_roster` com cor e dono       | **Fica como está.** A cor já estava permitida no spec da fase 1 ("só visual"). O id do dono é o mesmo `user_id` que os colegas já recebem em `party_people`, e é o que liga "Jogado por @…". Nada novo vaza. |

2. **Uma mesa, um combate:** `encounters.party_id` é a chave. `round = 0` é "preparando" (o mestre
   monta a lista); `start_encounter` abre a rodada 1. Encerrar o combate apaga a linha.
3. **Inimigo = ficha `npc` do mestre.** O app ganha a página `/enemies` ("Fichas de inimigo"), com
   a mesma lista e o mesmo formulário de personagem (`/characters/new?kind=npc`). A página tem link
   no painel de combate e na página `/parties`, mas **não** na sidebar: assim as baselines visuais
   não mudam e quem só joga não vê um item a mais.
4. **Rótulos:** um inimigo sozinho fica com o nome da ficha. Com mais de um, cada participante vira
   `"<nome> N"`, e N continua a contagem que já está no combate: depois de "Goblin 1" e "Goblin 2",
   o próximo é "Goblin 3". O mestre pode renomear qualquer um.
5. **Ordem:** a ordem salva é `position`. "Ordenar por iniciativa" põe do maior para o menor; quem
   empata mantém a ordem atual, e quem ainda não tem iniciativa vai para o fim. O mestre ajusta
   depois com ↑/↓. A ordenação é calculada no cliente (o mestre já tem as iniciativas) e salva por
   `set_encounter_order`.
6. **Turno:** `end_turn(party, participant)` só anda se aquele participante **ainda** for o atual.
   Assim, dois cliques ou duas telas não pulam dois turnos. O jogador só encerra o turno de um
   personagem dele; o mestre encerra o de qualquer um. Passar do último volta ao primeiro e soma 1
   à rodada.
7. **Quem sai no meio:** se o personagem sai da mesa ou é apagado, sai do combate. Se era a vez
   dele, a vez passa ao próximo; se ele era o último, a rodada vira.
8. **Visão do jogador:** a rodada, mais nome, de quem é a vez e "é meu" de cada participante, sem
   iniciativa, PV ou CA (de ninguém, nem dos inimigos). Os nomes dos inimigos aparecem, como diz o
   spec. Durante a preparação o jogador vê "O mestre está preparando o combate".
9. **Duplicar ficha:** item "Duplicar" no menu do card. Vale para qualquer ficha do dono, `pc` ou
   `npc`. A cópia leva atributos, sistema, lore e magias; **não** leva o avatar, porque o arquivo é
   do original e some quando ele for apagado. O nome é "<nome> (cópia)", traduzido no cliente.
10. **O mestre não muda PV de jogador** (constraint: `hp_current`/`hp_temp` só existem em
    participante `enemy`). O PV do jogador aparece para o mestre a partir da ficha e se atualiza
    quando o jogador salva (aviso pelo trigger em `characters`).
11. **Conexão:** enquanto o canal não está `SUBSCRIBED`, o painel mostra "Reconectando…". A cada
    `SUBSCRIBED` (inclusive depois de cair) a visão é buscada de novo.

## Restrições globais

- Só o mestre (`private.is_party_gm`) lê e escreve `encounters` e `encounter_participants` pelo
  RLS. Jogador **sem nenhum grant de linha útil**: o que ele vê vem só de `encounter_turns`.
- Participante `player`: um personagem que está em `party_characters` daquela mesa. Participante
  `enemy`: personagem do mestre (`owner_id = auth.uid()`), `kind = 'npc'`, sem `deleted_at`.
- `side` só `player` | `enemy`. `label` obrigatório (1–60 após `btrim`) só em `enemy`; em `player`
  é `NULL` e o nome vem da ficha. `hp_current`/`hp_temp` (0–9999) só em `enemy`, nulos em
  `player`. `initiative` nula ou −10..99.
- Até **20** inimigos por adição (`count` 1–20) e **50** participantes por combate.
- Tópico do canal: `party:<uuid da mesa>`; evento `encounter`; payload sempre `'{}'::jsonb`. Só
  escutam o mestre e os membros ativos. Ninguém envia pelo cliente (sem política de INSERT em
  `realtime.messages`).
- Erros das funções SQL: `RAISE EXCEPTION USING MESSAGE = '<código>', ERRCODE = 'P0001'`, com os
  códigos novos `party_already_member`, `encounter_not_found`, `encounter_exists`,
  `encounter_empty`, `encounter_not_your_turn`, `encounter_full`, `character_not_found`. Os
  repositórios traduzem para `PartyError` / `CombatError` / `CharacterError`.
- Toda tabela e função nova tem `GRANT` explícito e `REVOKE ... FROM PUBLIC, anon` (o padrão global
  continua dando EXECUTE a PUBLIC); funções `SECURITY DEFINER` com `SET search_path = ''` e nomes
  qualificados.
- Textos novos em `messages/en.json` e `messages/pt.json`; códigos de erro novos em `common.errors`.
- Migrações com `npx supabase migration new <nome> --workdir database/db-dev < /dev/null`.
- Tipos: `npx supabase gen types typescript --local --schema public --workdir database/db-dev >
lib/types/database.ts` + prettier, depois de `migration up` no dev.

## Review Focus

1. **Jogador lendo números do combate por fora da tela**, ou seja,
   `from('encounter_participants').select('*')`, `from('encounters')`, as colunas de
   `encounter_turns`, o payload do canal ou `channel.send` de um jogador → nada além de ordem,
   nomes, vez e "é meu". O envio do cliente não chega a ninguém. (Tarefas 2–4, 8)
2. **Turno passado por quem não pode, ou duas vezes**: o jogador encerra o turno de um colega ou
   de um inimigo, alguém usa um `participantId` antigo, ou dois `end_turn` saem ao mesmo tempo →
   recusado, e o turno anda uma vez só. (Tarefa 3)
3. **Personagem sai da mesa ou é apagado no meio do combate, sendo a vez dele** → sai da lista, a
   vez passa ao próximo, e a rodada só vira se ele era o último. (Tarefas 2–3)
4. **Conexão cai e volta** → a tela busca de novo sozinha e mostra "Reconectando…" enquanto isso.
   Um ex-membro não consegue assinar o tópico. (Tarefas 4, 11)
5. **O mestre põe no combate o que não pode**: um personagem de outra mesa, um `npc` de outra
   pessoa, um `pc` dele como inimigo, ou mais de 50 participantes → recusado. (Tarefa 2)

---

## Parte A — banco

### Tarefa 1: correções da fase 1 no banco

**Arquivos:**

- Criar: migração `party_fixes`
- Testes: `src/backend/contexts/parties/infrastructure/gm-reads-rls.integration.test.ts`,
  `parties-rls.integration.test.ts`, `party-functions.integration.test.ts`

**Interfaces (produz):**

- `private.gm_readable_character_ids() RETURNS SETOF uuid` (`SECURITY DEFINER`, `STABLE`): os
  ids que o `auth.uid()` lê como mestre (mesma regra de `gm_reads_character`). As três políticas
  `*_select_party_gm` são recriadas com `id IN (SELECT private.gm_readable_character_ids())` (ou
  `character_id IN ...`), e `private.gm_reads_character(uuid)` é removida.
- Trigger `AFTER UPDATE OF deleted_at ON characters` (`WHEN OLD.deleted_at IS NULL AND
NEW.deleted_at IS NOT NULL`), função `private.drop_deleted_character()` (`SECURITY DEFINER`):
  apaga as linhas de `party_characters` do personagem. A Tarefa 2 estende a função para os
  participantes.
- Trigger `AFTER UPDATE OF code ON party_invites` (`WHEN OLD.code IS DISTINCT FROM NEW.code`),
  `private.drop_party_requests()`: apaga de `party_members` os `requested` daquela mesa.
- `public.invite_to_party` (`CREATE OR REPLACE`): quando a pessoa já está `active`, levanta
  `party_already_member`. Já `invited` continua devolvendo `invited`.

- [ ] **Passo 1: testes**
  - gm-reads: os 7 atuais continuam; mais
    `o mestre lê vários personagens numa consulta sem filtro e só recebe os da mesa`
    (`from('characters').select('id')` como mestre devolve só os próprios e os da mesa).
  - parties-rls: `apagar (soft delete) o personagem tira ele da mesa; restaurar não traz de volta`
    (o restaurar é feito pelo admin); `trocar o código descarta os pedidos pendentes, não os
convites nem os ativos`.
  - party-functions: `convidar quem já é membro ativo falha com party_already_member`.
- [ ] **Passo 2:** rodar `npx vitest run --config ./test/vitest.config.integration.ts src/backend/contexts/parties`.
      Esperado: falham só os testes novos (menos o de leitura por conjunto, que já passa: a regra
      é a mesma e muda só o custo).
- [ ] **Passo 3:** escrever a migração e aplicar no banco de teste.
- [ ] **Passo 4:** rodar de novo. Esperado: todos passam.
- [ ] **Passo 5: medir.** No banco de teste, inserir 20 mil personagens de outro dono pelo admin.
      Como mestre (`SET LOCAL role authenticated` + `request.jwt.claims`), rodar
      `EXPLAIN ANALYZE SELECT id FROM characters`. Esperado: um `SubPlan`/`InitPlan` hashed só
      uma vez, e tempo bem abaixo dos ~100 ms de antes. Anotar os dois números no PR. Apagar os
      dados (`db reset` do teste).
- [ ] **Passo 6:** commit `fix(db): leitura do mestre por conjunto, apagados saem das mesas, troca de link e já-membro`.

### Tarefa 2: tabelas do combate, RLS e gatilhos

**Arquivos:**

- Criar: migração `encounters`
- Teste: `src/backend/contexts/combat/infrastructure/encounters-rls.integration.test.ts`
- Modificar: `test/helpers/parties.ts` (`createEncounter`, `addParticipant`, `createNpc`)

**Interfaces (produz):**

- `public.encounters (party_id uuid PK REFERENCES parties ON DELETE CASCADE, round int NOT NULL
DEFAULT 0 CHECK (round >= 0), current_participant_id uuid NULL, created_at, updated_at)` +
  `handle_updated_at`. Sem FK em `current_participant_id`: o trigger abaixo o mantém válido.
- `public.encounter_participants (id uuid PK default gen_random_uuid(), party_id uuid NOT NULL
REFERENCES encounters(party_id) ON DELETE CASCADE, character_id uuid NOT NULL REFERENCES
characters ON DELETE CASCADE, side text NOT NULL CHECK (side IN ('player','enemy')), label text,
initiative int CHECK (initiative BETWEEN -10 AND 99), position int NOT NULL, hp_current int CHECK
(hp_current BETWEEN 0 AND 9999), hp_temp int CHECK (hp_temp BETWEEN 0 AND 9999), created_at)`
  - CHECK: `side = 'enemy'` ⇔ `label IS NOT NULL AND char_length(btrim(label)) BETWEEN 1 AND 60`;
    `side = 'player'` ⇒ `hp_current IS NULL AND hp_temp IS NULL`.
  - Único parcial `(party_id, character_id) WHERE side = 'player'`; índices em `party_id` e
    `character_id`.
- `BEFORE INSERT ON encounter_participants` (`private.prepare_participant`, definer):
  - `position` = máximo da mesa + 1;
  - inimigo sem `hp_current` recebe o `hp_max` da ficha, e `hp_temp` recebe 0;
  - com 50 participantes, levanta `encounter_full`.

  Lock: `pg_advisory_xact_lock(hashtext('encounter:' || party_id))`.

- `BEFORE DELETE ON encounter_participants` (`private.pass_turn_of_removed`, definer): se
  `OLD.id` é o atual, o atual passa a ser o próximo por `position` (sem o `OLD`). Se não há
  próximo, volta ao primeiro e soma 1 à rodada; se não sobra ninguém, fica `NULL`.
  - O próximo é calculado por `private.next_participant(p_party_id uuid, p_after int, p_skip uuid)
RETURNS TABLE(participant_id uuid, wrapped boolean)`, usado também pela Tarefa 3.
- `AFTER DELETE ON party_characters` (`private.drop_participants_of_character`, definer): apaga
  os participantes `player` daquele personagem no combate daquela mesa.
- `private.drop_deleted_character()` (`CREATE OR REPLACE`, da Tarefa 1): também apaga os
  participantes do personagem, de qualquer lado.

**Políticas e grants** (`authenticated`; `service_role` tudo):

| Tabela                   | Grant                                                                       | Política                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `encounters`             | `SELECT, INSERT, DELETE` (sem UPDATE: o turno só anda pelas funções)        | todas: `private.is_party_gm(party_id)`                                                                                                                                                                                                                |
| `encounter_participants` | `SELECT, INSERT, DELETE`, `UPDATE (label, initiative, hp_current, hp_temp)` | SELECT/UPDATE/DELETE: `is_party_gm(party_id)`. INSERT CHECK: `is_party_gm(party_id)` e (`side = 'player'` e o personagem está em `party_characters` da mesa) ou (`side = 'enemy'` e o personagem é do `auth.uid()`, `kind = 'npc'`, sem `deleted_at`) |

- [ ] **Passo 1: testes** (mestre, jogador, colega, estranho, outro mestre):
  - `o mestre prepara o combate; um segundo na mesma mesa é recusado (23505)`
  - `o mestre põe personagens da mesa e fichas npc dele; o position cresce e o inimigo nasce com o PV máximo da ficha`
  - `recusa: personagem de outra mesa, npc de outra pessoa, pc do mestre como inimigo, inimigo sem rótulo, PV em jogador`
  - `o 51º participante falha com encounter_full`
  - `jogador, colega e estranho não leem nem escrevem encounters e encounter_participants`
  - `o mestre muda iniciativa, rótulo e PV do inimigo; não muda position nem a rodada direto`
  - `o jogador sai da mesa no meio do combate: o participante sai e, se era a vez dele, passa ao próximo`
  - `apagar o último da ordem quando é a vez dele volta ao primeiro e soma a rodada`
  - `apagar (soft delete) a ficha do inimigo tira os participantes dela`
  - `apagar a mesa apaga o combate`
- [ ] **Passo 2:** rodar `npx vitest run --config ./test/vitest.config.integration.ts src/backend/contexts/combat`. Esperado: falham.
- [ ] **Passo 3:** escrever a migração e aplicar no teste.
- [ ] **Passo 4:** rodar de novo. Esperado: passam.
- [ ] **Passo 5:** commit `feat(db): combate — encontros e participantes`.

### Tarefa 3: funções do combate

**Arquivos:**

- Criar: migração `encounter_functions`
- Teste: `src/backend/contexts/combat/infrastructure/encounter-functions.integration.test.ts`

**Interfaces (produz)** (todas `SECURITY DEFINER`, EXECUTE para `authenticated` e `service_role`):

- `public.start_encounter(p_party_id uuid) RETURNS void`: só o mestre (senão
  `encounter_not_found`), só com `round = 0`, e sem participantes levanta `encounter_empty`. Faz
  `round = 1`, e o atual passa a ser o de menor `position`.
- `public.end_turn(p_party_id uuid, p_participant_id uuid) RETURNS void`:
  - lock por mesa;
  - se `p_participant_id` não é o atual (ou `round = 0`), levanta `encounter_not_your_turn`;
  - quem chama precisa ser o mestre, ou o dono do personagem de um participante `player` sendo
    membro ativo; senão, também `encounter_not_your_turn`;
  - anda com `private.next_participant`; se deu a volta, soma 1 à rodada.
- `public.set_encounter_order(p_party_id uuid, p_participant_ids uuid[]) RETURNS void`: só o
  mestre. Os ids precisam ser exatamente os participantes da mesa (senão `encounter_not_found`).
  Regrava `position` = índice.
- `public.encounter_turns(p_party_id uuid) RETURNS TABLE(round int, participant_id uuid, name
text, is_current boolean, is_mine boolean)`:
  - responde para o mestre ou um membro ativo; para os outros, devolve vazio;
  - devolve os participantes por `position`, com `name = coalesce(label, characters.name)` e
    `is_mine = side = 'player' AND owner_id = auth.uid()`;
  - sem combate, devolve vazio. Com combate e sem participantes, devolve uma linha com só `round`
    e o resto nulo.

  Interpretação de "sem combate" × "preparando": na Tarefa 8, zero linhas é `null`, e uma linha
  com `participant_id` nulo é a lista vazia.

- [ ] **Passo 1: testes**
  - `start_encounter: só o mestre; vazio falha com encounter_empty; abre a rodada 1 no primeiro`
  - `o jogador encerra o próprio turno; não encerra o de um colega nem o de um inimigo`
  - `o mestre encerra o turno de qualquer um; do último volta ao primeiro e a rodada sobe`
  - `end_turn com um participante que já não é o atual falha e não anda de novo` (dois `end_turn`
    seguidos com o mesmo id: o segundo falha; rodada/atual conferidos)
  - `dois end_turn em paralelo (Promise.all) andam uma vez só`
  - `set_encounter_order: só o mestre; lista incompleta ou com id de fora é recusada`
  - `encounter_turns devolve exatamente as colunas round, participant_id, name, is_current, is_mine`
    (chaves da linha conferidas com `Object.keys`)
  - `encounter_turns para o estranho, o ex-membro e o anon: vazio ou sem acesso`
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** escrever a migração e aplicar.
- [ ] **Passo 4:** rodar. Esperado: passam.
- [ ] **Passo 5:** commit `feat(db): combate — começar, passar turno, ordem e visão do jogador`.

### Tarefa 4: tempo real (Broadcast privado)

**Arquivos:**

- Criar: migração `encounter_realtime`
- Teste: `src/backend/contexts/combat/infrastructure/encounter-realtime.integration.test.ts`
- Criar: `test/helpers/realtime.ts`: `listen(client, partyId): Promise<{ status, messages }>`
  (assina `party:<id>` com `private: true` depois de `client.realtime.setAuth()`; espera
  `SUBSCRIBED` ou erro) e `waitFor(messages, n, ms)`.

**Interfaces (produz):**

- `private.can_listen_party(p_topic text) RETURNS boolean` (definer, `STABLE`): o tópico casa
  `^party:[0-9a-f-]{36}$`, e só então é convertido para uuid, para um tópico qualquer não dar erro
  de cast. Responde se a mesa existe e o `auth.uid()` é o mestre ou membro ativo.
- `CREATE POLICY "party_channel_listen" ON realtime.messages FOR SELECT TO authenticated USING
(realtime.messages.extension = 'broadcast' AND private.can_listen_party(realtime.topic()))`.
  Sem política de INSERT.
- `private.notify_encounter()` (definer, trigger `AFTER INSERT OR UPDATE OR DELETE ... FOR EACH
ROW` em `encounters` e `encounter_participants`): `realtime.send('{}'::jsonb, 'encounter',
'party:' || coalesce(NEW.party_id, OLD.party_id), true)`.
- `private.notify_character_encounters()` (trigger `AFTER UPDATE ON characters`): um `send` por
  mesa distinta em que o personagem é participante.

- [ ] **Passo 1: testes** (clientes reais pelo WebSocket; timeout de 5 s por espera):
  - `o mestre e o jogador ativo assinam; o estranho e quem só pediu recebem CHANNEL_ERROR`
  - `mudar a iniciativa avisa o tópico da mesa, e o payload não tem nada além de id`
    (`Object.keys(payload)` ⊆ `['id']`)
  - `o jogador salvar a ficha avisa as mesas em que ela está no combate`
  - `um jogador enviando broadcast pelo cliente não chega ao mestre`
  - `quem sai da mesa não consegue assinar de novo`
- [ ] **Passo 2:** rodar. Esperado: falham (sem política, todos recebem `CHANNEL_ERROR`).
- [ ] **Passo 3:** escrever a migração e aplicar.
- [ ] **Passo 4:** rodar. Esperado: passam.
- [ ] **Passo 5:** commit `feat(db): combate em tempo real (aviso sem conteúdo por mesa)`.

### Tarefa 5: duplicar ficha; tipos

**Arquivos:**

- Criar: migração `duplicate_character`
- Teste: `src/backend/contexts/characters/infrastructure/repositories/duplicate-character.integration.test.ts`
- Modificar: `lib/types/database.ts`;
  `src/backend/shared/infrastructure/data-api-grants.integration.test.ts` (as duas tabelas novas
  na lista negada ao anon)

**Interfaces (produz):**

- `public.duplicate_character(p_character_id uuid, p_name text) RETURNS uuid`, **`SECURITY
INVOKER`** (o RLS de dono vale):
  - copia a linha de `characters` com `p_name`, sem `avatar_url`, mesmo `kind`;
  - copia a linha de `character_lore` e as de `character_spells`;
  - sem linha visível e própria, levanta `character_not_found`.

  EXECUTE só para `authenticated`.

- [ ] **Passo 1: testes**
  - `o dono duplica: ficha, lore e magias iguais, nome novo, sem avatar, mesmo kind`
  - `o mestre não duplica a ficha de um jogador da mesa (character_not_found)`
  - `ficha apagada não é duplicada`
- [ ] **Passo 2–4:** falham → migração → passam.
- [ ] **Passo 5:** `migration up` no dev, gerar os tipos e rodar o prettier;
      `npx vitest run --config ./test/vitest.config.integration.ts` inteiro. Esperado: tudo
      passa.
- [ ] **Passo 6:** commit `feat(db): duplicar ficha` e commit `chore(types): tipos do combate`.

---

## Parte B — app

### Tarefa 6: correções da fase 1 no app

**Arquivos:**

- Modificar: `supabase-party.repository.ts` (`addCharacters` com `upsert(..., { onConflict:
'party_id,character_id', ignoreDuplicates: true })`; `party_already_member` →
  `PartyErrorCodes.ALREADY_MEMBER = 'party_error_already_member'`), `PartyError.ts`,
  `messages/*.json` (`common.errors.party_error_already_member`;
  `parties.manage.rotateConfirm` passa a dizer que os pedidos pendentes serão descartados)
- Testes: `supabase-party.repository.integration.test.ts`, `error-codes.unit.test.ts`

- [ ] **Passo 1:** testes `dois setMyCharacters iguais em paralelo terminam sem erro, com o
personagem uma vez` e `convidar membro ativo dá PartyError ALREADY_MEMBER`.
- [ ] **Passo 2:** rodar. Esperado: o primeiro falha com 23505; o segundo, com `Error` genérico.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar. Esperado: passam.
- [ ] **Passo 5:** commit `fix(parties): salvar personagens em paralelo, convite a quem já é membro e aviso da troca de link`.

### Tarefa 7: fichas de inimigo e duplicar

**Arquivos:**

- Modificar:
  - `Character.ts`: `kind: 'pc' | 'npc'`, padrão `'pc'`;
  - `supabase-character.repository.ts`: `mapToDomain` lê `kind`, `save` grava, e
    `findByOwner(ownerId, kind = 'pc')`;
  - `in-memory-character.repository.ts`;
  - `create-character.use-case.ts`: `kind?` no input;
  - `characters.schemas.ts`: `kind` opcional no create, e **fora** do update;
  - `CharacterContext`: `getByOwner(userId, kind)`, `duplicate(characterId, name)`;
  - `characters.api.ts`;
  - `app/api/characters/route.ts`: `GET ?kind=npc`.
- Criar:
  - `application/duplicate-character/duplicate-character.use-case.ts` + unit;
  - `app/api/characters/[id]/duplicate/route.ts`: POST `{ name }` → 201 `{ id }`;
  - `CharacterErrorCodes.NOT_FOUND`, se ainda não existe;
  - página `app/[locale]/(app)/(dashboard)/enemies/page.tsx`.
- Front:
  - `CharacterList`/`CharactersContext` aceitam `kind`. A query key é
    `charactersQueryKey(kind)`, e `CHARACTERS_QUERY_KEY` continua sendo a do `pc`;
  - `NewCharacterForm` lê `?kind=npc` e volta para `/enemies`;
  - `CharacterCard` ganha o item "Duplicar", que chama POST e abre a cópia;
  - `/parties` ganha o link "Fichas de inimigo".
- Testes: unit dos use cases, `route.unit.test.ts` de characters (`?kind=npc` e duplicate),
  `NewCharacterForm.unit.test.tsx` (kind npc), `CharacterCard` (duplicar), e integração do repo
  (`findByOwner` com `npc` não traz `pc`, e vice-versa).

- [ ] **Passo 1:** testes (incluir `o update não muda kind` no schema).
- [ ] **Passo 2:** rodar `npx vitest run src/backend/contexts/characters app/api/characters src/frontend/components/character`. Esperado: falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar. Esperado: passam.
- [ ] **Passo 5:** commits `feat(characters): fichas de inimigo (npc)` e `feat(characters): duplicar ficha`.

### Tarefa 8: contexto `combat` — domínio e casos de uso

**Arquivos:** `src/backend/contexts/combat/`:

- `domain/Encounter.ts`
- `domain/CombatError.ts`, com os códigos `combat_error_not_found`, `_exists`, `_empty`,
  `_not_your_turn`, `_full`, `_character_not_allowed`
- `domain/gm-row.ts`
- `domain/repository/combat.repo.ts`
- `application/CombatContext.ts` e um use case por operação
- `application/combat.use-cases.unit.test.ts`

**Interfaces (produz):**

```ts
type Side = 'player' | 'enemy';
interface TurnEntry {
  participantId: string;
  name: string;
  isCurrent: boolean;
  isMine: boolean;
}
interface PlayerEncounterView {
  role: 'player';
  round: number;
  turns: TurnEntry[];
}
interface GmRow {
  participantId: string;
  characterId: string;
  side: Side;
  name: string;
  initiative: number | null;
  hp: { current: number; max: number; temp: number };
  deathSaves: { successes: number; failures: number } | null; // só player com PV 0
  ac: number;
  passivePerception: number;
  spellSlots: { level: number; max: number; used: number }[];
  spellPoints: { current: number; max: number } | null;
  isCurrent: boolean;
}
interface GmEncounterView {
  role: 'gm';
  round: number;
  rows: GmRow[];
}
type EncounterView = PlayerEncounterView | GmEncounterView;

interface CombatContext {
  get(partyId: string, userId: string): Promise<EncounterView | null>;
  create(partyId: string): Promise<void>;
  addParticipant(partyId: string, characterId: string, count: number): Promise<void>;
  updateParticipant(
    partyId: string,
    participantId: string,
    patch: { label?: string; initiative?: number | null; hpCurrent?: number; hpTemp?: number },
  ): Promise<void>;
  removeParticipant(partyId: string, participantId: string): Promise<void>;
  setOrder(partyId: string, participantIds: string[]): Promise<void>;
  start(partyId: string): Promise<void>;
  endTurn(partyId: string, participantId: string): Promise<void>;
  finish(partyId: string): Promise<void>;
}
```

- `toGmRow(participant, sheet)` em `domain/gm-row.ts`, uma função pura:
  - PV do `player` vem da ficha; o do `enemy`, do participante, com o máximo da ficha;
  - percepção passiva por `calculatePassivePerception`;
  - os espaços de magia são os níveis com `max > 0`, em ordem.
- `get`:
  - acha o `gm_id` da mesa pelo repo de parties (`findParty`; nulo → `null`);
  - para o mestre, lê os participantes e as fichas e monta as `GmRow`;
  - para o jogador, `encounter_turns`.
- `addParticipant`:
  - o lado vem do repo: personagem no roster da mesa → `player` (o `count` é ignorado);
  - ficha `npc` do mestre → `enemy`, com os rótulos da decisão 4;
  - outro qualquer → `CHARACTER_NOT_ALLOWED`.
- `updateParticipant` limita `hpCurrent` a 0..máximo da ficha.

- [ ] **Passo 1: testes**, com o repo mockado com `vi.fn`, como na fase 1:
  - toGmRow: player com PV 0 mostra testes contra a morte, e com PV > 0, não; o inimigo usa o
    PV do participante; espaços só dos níveis ativos.
  - rótulos: 1 inimigo sozinho → nome; 3 → "Goblin 1..3"; mais 2 depois de 3 → "Goblin 4..5".
  - `get` do jogador não tem `initiative`, `hp`, `ac` (checar as chaves).
  - `addParticipant` com personagem fora da mesa e que não é npc do mestre → CHARACTER_NOT_ALLOWED.
  - `updateParticipant` com PV acima do máximo → grava o máximo.
- [ ] **Passo 2–4:** falham → implementar → passam.
- [ ] **Passo 5:** commit `feat(combat): casos de uso do combate`.

### Tarefa 9: repositório do combate

**Arquivos:** `src/backend/contexts/combat/infrastructure/supabase-combat.repository.ts`
(traduz os erros SQL e `23505` → `EXISTS`); `combat/index.ts` (`createCombatContext`);
`src/backend/shared/providers/contexts.ts` (getter `combat`); `src/backend/index.ts`
(`combatApi`); `combat/interfaces/combat.api.ts` e `combat.schemas.ts` (`participantSchema`
`{ characterId: uuid, count: int 1–20 default 1 }`, `participantPatchSchema`, `orderSchema`
`{ participantIds: uuid[] 1–50 }`, `turnSchema { participantId }`); `error-codes.unit.test.ts`
e `common.errors`.

- Teste: `supabase-combat.repository.integration.test.ts`
  - fluxo completo como mestre: criar, adicionar 1 player e 3 goblins, ordenar, começar, passar
    2 turnos;
  - a visão do jogador pelo repo;
  - cada erro SQL vira o `CombatError` certo.

- [ ] **Passo 1–4:** teste → falha → implementar → passa.
- [ ] **Passo 5:** commit `feat(combat): repositório e ligação no container`.

### Tarefa 10: rotas da API

**Arquivos** (todas com `withAuth`, validando `partyParamsSchema`):

- `app/api/parties/[partyId]/encounter/route.ts`: GET → `EncounterView | null`, POST → 201
  (`create`), DELETE → 204 (`finish`);
- `.../encounter/start/route.ts`: POST → 204;
- `.../encounter/participants/route.ts`: POST → 201;
- `.../encounter/participants/[participantId]/route.ts`: PATCH → 204, DELETE → 204;
- `.../encounter/order/route.ts`: PUT → 204;
- `.../encounter/turn/route.ts`: POST `{ participantId }` → 204.

Testes `route.unit.test.ts` no padrão das rotas existentes (o 401 sem sessão, o body inválido
→ 400 e a chamada certa ao `combatApi`).

- [ ] **Passo 1–4:** testes → falham → implementar → passam.
- [ ] **Passo 5:** commit `feat(combat): rotas do combate`.

### Tarefa 11: front — hooks e tempo real

**Arquivos:**

- `src/frontend/lib/query-keys.ts`: `encounterQueryKey(partyId)`.
- `src/frontend/hooks/useEncounter.ts`: a query (GET) e as mutations de cada rota, com
  invalidação de `encounterQueryKey` no `onSettled`; erros por `useErrorMessage` + toast, como no
  `useParty`.
- `src/frontend/hooks/usePartyChannel.ts`: `usePartyChannel(partyId): { live: boolean }`.
  - Com `getSupabaseBrowserClient()`, faz `await realtime.setAuth()` e assina
    `party:<id>` com `private: true`.
  - Em `broadcast/encounter` e em cada `SUBSCRIBED`, invalida `encounterQueryKey`.
  - `live` é `status === 'SUBSCRIBED'`.
  - Remove o canal no cleanup.
- `src/frontend/lib/initiative-order.ts`: `sortByInitiative(rows: { participantId; initiative:
number | null }[]): string[]`, estável, com nulos no fim.
- Testes:
  - `initiative-order.unit.test.ts`: empate mantém a ordem, nulos no fim;
  - `usePartyChannel.unit.test.tsx`, com o cliente mockado (canal falso que chama o callback do
    `subscribe`): invalida no `SUBSCRIBED` e no broadcast, `live` falso em `CHANNEL_ERROR`, e
    `removeChannel` no unmount.

- [ ] **Passo 1–4:** testes → falham → implementar → passam.
- [ ] **Passo 5:** commit `feat(combat): hooks do combate e canal da mesa`.

### Tarefa 12: front — painel de combate do mestre

**Arquivos:** `src/frontend/components/combat/`:

- `GmCombatPanel.tsx`:
  - sem combate, o botão "Preparar combate";
  - com combate, a rodada e a lista;
  - ações: "Adicionar personagens da mesa" (os que ainda não estão), o seletor de ficha de
    inimigo (as `npc` do mestre, com quantidade 1–20 e link para `/enemies`), "Ordenar por
    iniciativa", "Começar" (na rodada 0), "Encerrar turno" (do atual) e "Encerrar combate"
    (confirma).
- `CombatRow.tsx`, uma linha por participante:
  - a iniciativa é um `NumberInput`, salvo ao sair do campo;
  - o nome é link para a ficha: `/parties/<id>/characters/<cid>` para jogador, a ficha normal
    para inimigo;
  - o PV: no inimigo, os campos atual e temporário são editáveis; no jogador é só texto, e com
    PV 0 aparecem os testes contra a morte;
  - CA, percepção passiva e espaços de magia (`1º 2/3 · 2º 0/2`, ou os pontos);
  - ↑/↓ e remover;
  - o atual é destacado com `aria-current="true"`.
- `CombatConnection.tsx`: o aviso "Reconectando…" quando `live` é falso.

Modificar `PartyPage.tsx`: o `GmView` ganha a troca de modo "Role Play | Combate" por
`?mode=combat`. O modo padrão é Combate quando há combate, e Role Play quando não há.

Testes unit:

- `GmCombatPanel.unit.test.tsx`: a ordenação chama `setOrder` com a ordem do `sortByInitiative`;
  "Começar" só na rodada 0; encerrar o combate pede confirmação;
- `CombatRow.unit.test.tsx`: o jogador não tem campo de PV; com PV 0 mostra testes contra a
  morte; o link certo para cada lado.

- [ ] **Passo 1–4:** testes → falham → implementar → passam (os guards de texto e de tokens
      incluídos).
- [ ] **Passo 5:** commit `feat(combat): painel de combate do mestre`.

### Tarefa 13: front — o combate para o jogador

**Arquivos:**

- `src/frontend/components/combat/PlayerCombatPanel.tsx`:
  - a rodada e a ordem, só com os nomes; a vez atual em destaque (`aria-current`) e "Sua vez"
    quando é dele;
  - o botão "Encerrar meu turno" aparece só quando `isCurrent && isMine`;
  - na rodada 0, "O mestre está preparando o combate";
  - sem combate, nada.
- `PartyPage.tsx`: no `PlayerView`, o painel fica no topo.
- `CombatConnection` aparece também aqui.

Teste: `PlayerCombatPanel.unit.test.tsx` (botão só na vez dele; nenhum número na tela além da
rodada).

- [ ] **Passo 1–4:** teste → falha → implementar → passa.
- [ ] **Passo 5:** commit `feat(combat): ordem e vez para os jogadores`.

### Tarefa 14: e2e do combate

**Arquivos:** `e2e/combat.spec.ts`; `e2e/support/fixtures.ts`:

- `createEnemySheet(page, name, hpMax)`;
- `joinParty(gmPage, playerPage)`, que reaproveita o fluxo da fase 1 pelo link;
- `bringCharacter(playerPage, partyId, name)`.

Testes, com dois `browser.newContext()` (mestre e jogador) e sem `reload` depois de abrir as
páginas:

- `o mestre monta e começa o combate e o jogador vê a ordem e a vez sem recarregar`
  - O mestre adiciona o personagem do jogador e 2 goblins, digita as iniciativas, ordena e
    começa.
  - O jogador vê os três nomes na ordem, e o PV dos goblins não aparece no texto da página.
- `o jogador encerra o próprio turno e a tela do mestre anda; o mestre encerra o turno de um goblin`
- `o jogador salva o PV na ficha e a linha do mestre atualiza`
- `o mestre duplica uma ficha de inimigo` (pela página `/enemies`)

Depois: `npm run test:visual`. Esperado: passa sem atualizar baselines (decisão 3). Se algo
mudar, conferir o diff e só então rodar `--update-snapshots=all`.

- [ ] **Passo 1:** escrever. **Passo 2:** `npx playwright test e2e/combat.spec.ts`. Esperado:
      passa. Lembrar: `hydrated()` antes de agir, e `url.pathname` em vez de regex de URL.
- [ ] **Passo 3:** commit `test(e2e): combate com mestre e jogador`.

### Tarefa 15: verificação e PR

- [ ] Rodar `npx tsc --noEmit`, `npm run lint`, `npm run knip`, `npm run test:coverage`,
      `npm run test:integration`, `npx playwright test` e `npm run test:visual`. Não rodar
      integration e e2e ao mesmo tempo.
- [ ] Revisão final do branch inteiro no modelo mais forte, com este Review Focus.
- [ ] Push; PR para `main`. Na descrição: as migrações em destaque (vão para produção no merge),
      a tabela de quem pode o quê no combate e as medidas da Tarefa 1.
