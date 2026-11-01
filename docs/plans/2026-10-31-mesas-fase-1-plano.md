# Mesas — fase 1: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: superpowers:subagent-driven-development (recomendado) ou
> superpowers:executing-plans, tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** criar mesas, entrar nelas por link (com aprovação) ou por username (com aceite),
levar personagens, e dar ao mestre o modo Role Play e a ficha só leitura dos personagens da mesa.

**Arquitetura:** o banco é a regra. Três tabelas (`parties`, `party_members`, `party_characters`)
mais `party_invites` (o código fica numa tabela só do mestre, para os jogadores não lerem o link).
Escritas simples passam pelo RLS com grants por coluna; o que precisa enxergar além do RLS do
usuário (achar a mesa pelo código, achar alguém pelo username, ver colegas e o "básico" das
fichas) são funções `SECURITY DEFINER` com `search_path = ''` que checam `auth.uid()`. O mestre lê
a ficha inteira por políticas `SELECT` novas em `characters`, `character_lore` e
`character_spells`. No app, um contexto novo `parties` (use cases + repositório) e casos de uso de
leitura do mestre nos contextos `characters` e `lore`, atrás de uma porta `PartyGmAccess`. A ficha
só leitura é a ficha atual numa rota da mesa: o modo vem dos parâmetros da rota (`partyId`).

**Stack:** Supabase (SQL, RLS, RPC), Next.js 16 (`app/[locale]/(app)/(dashboard)`), next-intl,
TanStack Query, Vitest (unit + integration), Playwright.

**Spec:** [`2026-10-28-mesas-fase-1-role-play.md`](2026-10-28-mesas-fase-1-role-play.md). A
preparação (username escolhido, `kind`, volta depois do login) já está na main (#121).

**Entrega em dois PRs** (migrações em PR próprio):

- **PR A — banco** (branch `feat/mesas-fase-1`): este plano + Tarefas 1–3. Vai para produção no
  merge; o app ainda não usa nada, então não muda nada para ninguém.
- **PR B — app** (branch `feat/mesas-fase-1-app`, saindo da A; rebase na main depois do merge da
  A): Tarefas 4–13, um commit por assunto.

## Restrições globais

- Mestre de no máximo **5** mesas (`MAX_GM_PARTIES = 5`), garantido no banco. Como jogador, sem
  limite.
- Nome da mesa: `btrim(name)` com 1–60 caracteres.
- `party_members.status` só `requested` | `invited` | `active`. O mestre **não** é linha em
  `party_members` e nunca vira membro da própria mesa.
- Código de convite: 32 hex (`^[a-f0-9]{32}$`), gerado com `gen_random_uuid()` sem hífens; trocar
  o código invalida o antigo na hora.
- Só personagens `kind = 'pc'`, do próprio membro ativo, sem `deleted_at`, entram em mesa.
  Personagens apagados somem de toda leitura de mesa (roster, cards, ficha do mestre).
- Sair ou ser removido apaga as linhas de `party_characters` daquela pessoa naquela mesa, nunca o
  personagem.
- O "básico" que colegas veem: nome, avatar, raça, classe, nível (e a cor da ficha, só visual).
  Nada mais, nem pela API.
- Username só aparece se `username_chosen = true`; o gerado vira `null` em toda resposta e não é
  achado na busca do convite. Busca sem diferenciar maiúsculas.
- Toda tabela e função nova tem `GRANT` explícito; funções `SECURITY DEFINER` usam
  `SET search_path = ''` e nomes qualificados.
- Erros das funções SQL: `RAISE EXCEPTION USING MESSAGE = '<código>', ERRCODE = 'P0001'`, com os
  códigos `party_gm_limit`, `party_not_found`, `party_invite_not_found`, `party_user_not_found`,
  `party_gm_cannot_join`. O repositório traduz para `PartyError`.
- Textos novos em `messages/en.json` e `messages/pt.json` (o guard `hardcoded-text` falha sem
  isso); todo código de erro novo em `common.errors` (o teste `error-codes` falha sem isso).
- Migrações com `npx supabase migration new <nome> --workdir database/db-dev < /dev/null`.

## Review Focus

1. **Jogador lendo a ficha de um colega direto no banco** (`from('characters').select('*')`,
   `character_lore`, `character_spells`, `party_roster` com mesa alheia) → nada além do básico, e
   só da mesa em que está ativo. (Tarefas 1–3, matriz dono/mestre/colega/estranho)
2. **Mestre tentando escrever** na ficha de um jogador (update, upsert, toggle de magia, lore) →
   recusado, ficha intacta; e o mestre não aprova um convite que ele mesmo mandou (`invited` →
   `active` só o convidado). (Tarefas 1 e 3)
3. **Link antigo depois de trocar o código** → `party_invite_not_found` no preview e no pedido.
   (Tarefa 2)
4. **Personagem apagado ou de quem saiu** → some do roster, dos cards e da ficha do mestre (404),
   e voltar à mesa não traz o personagem de volta sozinho. (Tarefas 1 e 3)
5. **Deslogado abrindo `/parties/join/<code>`** → login → volta ao convite; quem ainda não escolheu
   username passa por `/choose-username` e também volta. (Tarefa 10)

---

## Parte A — banco (PR A)

### Tarefa 1: tabelas, RLS e limite de mesas

**Arquivos:**

- Criar: migração `parties` (`npx supabase migration new parties --workdir database/db-dev < /dev/null`)
- Modificar: `lib/types/database.ts` (gerado; ver Tarefa 3)
- Teste: `src/backend/contexts/parties/infrastructure/parties-rls.integration.test.ts`

**Interfaces (produz):**

- `public.parties (id uuid PK default gen_random_uuid(), name text NOT NULL CHECK
(char_length(btrim(name)) BETWEEN 1 AND 60), system public.rpg_system NOT NULL DEFAULT 'dnd_5e',
gm_id uuid NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE, created_at, updated_at)` +
  trigger `handle_updated_at` + índice em `gm_id`.
- `public.party_invites (party_id uuid PK REFERENCES parties ON DELETE CASCADE, code text NOT NULL
UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '') CHECK (code ~ '^[a-f0-9]{32}$'))`; uma
  linha criada por trigger `AFTER INSERT ON parties` (`SECURITY DEFINER`).
- `public.party_members (party_id uuid REFERENCES parties ON DELETE CASCADE, user_id uuid
REFERENCES profile ON DELETE CASCADE, status text NOT NULL CHECK (status IN
('requested','invited','active')), created_at, PRIMARY KEY (party_id, user_id))` + índice em
  `user_id`.
- `public.party_characters (party_id uuid REFERENCES parties ON DELETE CASCADE, character_id uuid
REFERENCES characters ON DELETE CASCADE, PRIMARY KEY (party_id, character_id))` + índice em
  `character_id`.
- Helpers em `private` (`SECURITY DEFINER`, `STABLE`, `search_path = ''`, EXECUTE só para
  `authenticated`), usados pelas políticas para não haver recursão de RLS:
  `private.is_party_gm(p_party_id uuid) RETURNS boolean`,
  `private.is_party_member(p_party_id uuid) RETURNS boolean` (só `active`).
- Trigger `BEFORE INSERT ON parties`: `pg_advisory_xact_lock(hashtext(NEW.gm_id::text))`, conta as
  mesas do `gm_id` e levanta `party_gm_limit` com 5 ou mais.
- Trigger `AFTER DELETE ON party_members` (`SECURITY DEFINER`): apaga de `party_characters` as
  linhas daquela mesa cujo personagem é do `OLD.user_id`.
- Junta o adiado do #121: `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private REVOKE
EXECUTE ON FUNCTIONS FROM PUBLIC`.

**Políticas e grants** (`authenticated`; `service_role` recebe tudo, como nas outras tabelas):

| Tabela             | Grant                                               | Política                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parties`          | `SELECT, INSERT, DELETE`, `UPDATE (name)`           | SELECT: é o `gm_id` ou tem linha em `party_members` (qualquer status). INSERT: `gm_id = auth.uid()`. UPDATE/DELETE: `gm_id = auth.uid()`.                                                                                                                                                                                                                                                           |
| `party_invites`    | `SELECT`, `UPDATE (code)`                           | ambos: `private.is_party_gm(party_id)`.                                                                                                                                                                                                                                                                                                                                                             |
| `party_members`    | `SELECT, DELETE`, `UPDATE (status)`; **sem INSERT** | SELECT: `user_id = auth.uid()` ou `is_party_gm` ou (`status = 'active'` e `is_party_member`). UPDATE "mestre aprova": USING `is_party_gm AND status = 'requested'`, CHECK `is_party_gm AND status = 'active'`. UPDATE "convidado aceita": USING `user_id = auth.uid() AND status = 'invited'`, CHECK `user_id = auth.uid() AND status = 'active'`. DELETE: `user_id = auth.uid()` ou `is_party_gm`. |
| `party_characters` | `SELECT, INSERT, DELETE`                            | SELECT: `is_party_gm` ou `is_party_member`. INSERT CHECK: `is_party_member(party_id)` e o personagem é do `auth.uid()`, `kind = 'pc'`, `deleted_at IS NULL`. DELETE: o personagem é do `auth.uid()`.                                                                                                                                                                                                |

- [ ] **Passo 1: testes de integração** (helpers: `createSignedInClient` para mestre, jogador,
      colega e estranho; o admin client monta estados que o app ainda não sabe criar):
  - `o mestre cria até 5 mesas; a sexta falha com party_gm_limit`
  - `nome vazio ou com 61 caracteres é recusado`
  - `ninguém insere linha em party_members direto` (jogador tentando `insert` com `active` → erro)
  - `o mestre aprova um pedido (requested → active), mas não um convite que mandou (invited)`
  - `o convidado aceita o próprio convite, mas não aprova o próprio pedido (requested)`
  - `o estranho não vê a mesa, os membros nem o código; o membro não vê o código`
  - `trocar o código pelo mestre funciona; um código fora do formato é recusado`
  - `o membro ativo leva o próprio pc; não leva npc, personagem apagado, nem de outra pessoa`
  - `quem está só invited/requested não leva personagem`
  - `sair da mesa apaga os personagens levados, não o personagem`
  - `apagar a mesa não apaga personagens`
- [ ] **Passo 2:** `npx vitest run --config ./test/vitest.config.integration.ts src/backend/contexts/parties`.
      Esperado: falham (tabelas não existem).
- [ ] **Passo 3:** escrever a migração, aplicar no banco de teste
      (`npx supabase migration up --workdir database/db-test`; se o banco de teste estiver
      defasado, `db reset`).
- [ ] **Passo 4:** rodar de novo. Esperado: passam.
- [ ] **Passo 5:** commit `feat(db): mesas, membros e personagens levados`.

### Tarefa 2: funções de convite, pessoas e roster

**Arquivos:**

- Criar: migração `party_functions`
- Teste: `src/backend/contexts/parties/infrastructure/party-functions.integration.test.ts`

**Interfaces (produz)** — todas `public`, `SECURITY DEFINER`, `search_path = ''`,
`REVOKE ALL ... FROM PUBLIC, anon` e `GRANT EXECUTE ... TO authenticated`. `username` volta `null`
quando `username_chosen = false`. "Ativo" = `status = 'active'`.

- `get_party_invite(p_code text) RETURNS TABLE (party_id uuid, name text, gm_username text,
my_status text)` — `my_status`: `'gm' | 'active' | 'invited' | 'requested' | null`. Código
  inexistente → zero linhas.
- `request_party_join(p_code text) RETURNS text` (status final) — código inexistente →
  `party_invite_not_found`; quem chama é o mestre → `party_gm_cannot_join`; já `invited` → vira
  `active` (os dois lados querem); já `requested`/`active` → igual; senão insere `requested`.
- `invite_to_party(p_party_id uuid, p_username text) RETURNS text` — quem chama não é o mestre →
  `party_not_found`; username sem dono **escolhido** (`lower(username) = lower(p_username) AND
username_chosen`) → `party_user_not_found`; é o próprio mestre → `party_gm_cannot_join`; já
  `requested` → vira `active`; já `invited`/`active` → igual; senão insere `invited`.
- `party_people(p_party_id uuid) RETURNS TABLE (user_id uuid, username text, avatar_url text,
status text)` — o mestre vem com `status = 'gm'`. O mestre vê todos os membros (qualquer status);
  um membro ativo vê o mestre e os ativos; outros, zero linhas.
- `party_roster(p_party_id uuid) RETURNS TABLE (character_id uuid, owner_id uuid, name text,
avatar_url text, race text, class text, level smallint, theme_color text)` — mestre ou membro
  ativo; só personagens de membros ativos, `kind = 'pc'`, sem `deleted_at`. Raça e classe vêm de
  `system_data->>'race'` e `system_data->>'class'`. Ordem: nome.
- `my_parties() RETURNS TABLE (party_id uuid, name text, system text, role text, status text,
gm_username text, pending_requests int)` — `role` `'gm' | 'player'`; para o mestre `status =
'gm'` e `pending_requests` = pedidos `requested`; para jogador, o próprio status e `0`. Ordem:
  nome.

- [ ] **Passo 1: testes de integração:**
  - `o preview do convite mostra nome e mestre; código trocado não acha nada`
  - `pedir para entrar cria requested; pedir com código trocado dá party_invite_not_found`
  - `o mestre não pede para entrar na própria mesa`
  - `convidar por username ignora maiúsculas e cria invited`
  - `username gerado (não escolhido) não é achado: party_user_not_found`
  - `quem não é mestre não convida: party_not_found`
  - `pedido + convite para a mesma pessoa vira active` (nas duas ordens)
  - `party_people: colega vê mestre e ativos, não vê pedidos; username não escolhido vem null`
  - `party_roster devolve só as colunas do básico, sem PV, atributos nem lore` (compara as chaves
    do objeto com a lista exata)
  - `party_roster: estranho e quem está só invited recebem zero linhas`
  - `party_roster ignora personagem apagado`
  - `my_parties separa mestre e jogador e conta os pedidos pendentes`
  - `anon não executa nenhuma das funções` (`SupabaseFactory.createAnon().rpc(...)` → erro)
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** migração.
- [ ] **Passo 4:** rodar. Esperado: passam.
- [ ] **Passo 5:** commit `feat(db): funções de convite, pessoas e roster das mesas`.

### Tarefa 3: o mestre lê a ficha inteira; tipos; PR A

**Arquivos:**

- Criar: migração `party_gm_reads_characters`
- Modificar: `lib/types/database.ts`,
  `src/backend/shared/infrastructure/data-api-grants.integration.test.ts`
- Teste: `src/backend/contexts/parties/infrastructure/gm-reads-rls.integration.test.ts`

**Interfaces (produz):**

- `private.gm_reads_character(p_character_id uuid) RETURNS boolean` (`SECURITY DEFINER`,
  `STABLE`): existe `party_characters` desse personagem numa mesa com `gm_id = auth.uid()`, o dono
  é membro **ativo** dela, e o personagem é `pc` sem `deleted_at`.
- Políticas novas, só `FOR SELECT`: `characters_select_party_gm` (`USING
private.gm_reads_character(id)`), `character_lore_select_party_gm` e
  `character_spells_select_party_gm` (`USING private.gm_reads_character(character_id)`). Nenhuma
  política de escrita muda.

- [ ] **Passo 1: testes** (matriz com um personagem levado à mesa):
  - `o mestre lê personagem, lore e magias pelos repositórios atuais`
    (`SupabaseCharacterRepository.findById`, `SupabaseLoreRepository.findByCharacterId`, select em
    `character_spells`)
  - `o mestre não altera: save/upsert, update de lore e insert/delete de magia falham e nada muda`
  - `o colega e o estranho não leem o personagem, a lore nem as magias`
  - `o mestre não lê um personagem do jogador que não foi levado à mesa`
  - `depois que o jogador sai, ou apaga o personagem, o mestre não lê mais`
  - no `data-api-grants`: as quatro tabelas novas na lista que `anon` não lê
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** migração; tipos com
      `npx supabase gen types typescript --local --schema public --workdir database/db-dev > lib/types/database.ts`
      e `npx prettier --write lib/types/database.ts` (o banco de dev precisa das migrações:
      `migration up --workdir database/db-dev`).
- [ ] **Passo 4:** `npm run test:integration` inteiro (as políticas novas não podem quebrar as
      atuais) e `npx tsc --noEmit`. Esperado: passam.
- [ ] **Passo 5:** commit `feat(db): o mestre lê as fichas levadas às mesas dele`.
- [ ] **Passo 6:** passos da CI (`tsc`, `lint`, `knip`, `test:coverage`, `test:integration`,
      `playwright`, `test:visual`), push e PR A. No corpo: as três migrações vão para produção no
      merge, não mudam nada para quem usa (nenhuma tela usa ainda) e o que cada política abre.

---

## Parte B — app (PR B)

### Tarefa 4: contexto `parties` — mesas e lista

**Arquivos:**

- Criar: `src/backend/contexts/parties/` com `index.ts`, `domain/Party.ts`, `domain/PartyError.ts`,
  `domain/repository/party.repo.ts`, `application/PartyContext.ts`,
  `application/{create,rename,delete}-party.use-case.ts`, `application/list-my-parties.use-case.ts`,
  `application/rotate-invite-code.use-case.ts`,
  `infrastructure/supabase-party.repository.ts`, `infrastructure/in-memory-party.repository.ts`,
  `interfaces/parties.api.ts`, `interfaces/parties.schemas.ts`
- Modificar: `src/backend/shared/providers/contexts.ts` (getter `party`), `src/backend/index.ts`
  (`partiesApi`), `src/backend/contexts/error-codes.unit.test.ts`, `messages/{en,pt}.json`
- Teste: `application/parties.use-cases.unit.test.ts` (com o repositório em memória), e casos no
  `parties-rls.integration.test.ts` chamando o repositório Supabase

**Interfaces (produz):**

```ts
// domain/Party.ts
export const MAX_GM_PARTIES = 5;
export type PartyRole = 'gm' | 'player';
export type MemberStatus = 'requested' | 'invited' | 'active';
export interface PartySummary {
  id: string;
  name: string;
  system: string;
  role: PartyRole;
  status: MemberStatus | 'gm';
  gmUsername: string | null;
  pendingRequests: number;
}
export interface MyParties {
  asGm: PartySummary[];
  asPlayer: PartySummary[]; // asPlayer: só active
  invites: PartySummary[]; // invited
  requests: PartySummary[]; // requested (pedidos meus, aguardando)
}
```

- `PartyErrorCodes`: `NAME_INVALID: 'party_error_name_invalid'`, `GM_LIMIT: 'party_error_gm_limit'`,
  `NOT_FOUND: 'party_error_not_found'` (not_found), `INVITE_NOT_FOUND:
'party_error_invite_not_found'` (not_found), `USER_NOT_FOUND: 'party_error_user_not_found'`
  (not_found), `GM_CANNOT_JOIN: 'party_error_gm_cannot_join'`, `CHARACTER_NOT_ALLOWED:
'party_error_character_not_allowed'`. Mesmo formato de `CharacterError`.
- `PartyRepo` (cresce nas Tarefas 5–6): `listMine(): Promise<PartySummary[]>` (RPC `my_parties`),
  `create(gmId, name): Promise<string>`, `rename(id, name): Promise<boolean>`,
  `delete(id): Promise<boolean>` (`false` = RLS não deixou → `NOT_FOUND`),
  `setInviteCode(id, code): Promise<boolean>`. Erros SQL com os códigos das restrições globais viram
  `PartyError`; os demais, `Error` como nos outros repositórios.
- `PartyContext`: `listMine(userId)`, `create(gmId, name) → { id }`, `rename(partyId, gmId, name)`,
  `delete(partyId, gmId)`, `rotateInviteCode(partyId, gmId) → string` (novo código
  `crypto.randomUUID().replaceAll('-', '')`).
- Schemas zod: `partyNameSchema = z.object({ name: z.string().trim().min(1).max(60) })`,
  `partyParamsSchema = z.object({ partyId: z.uuid() })`.

- [ ] **Passo 1: testes unitários:** `create com nome só de espaços → party_error_name_invalid`;
      `listMine separa mestre, jogador, convites e pedidos`; `rename/delete de mesa alheia →
    party_error_not_found`; `rotateInviteCode devolve 32 hex diferente do anterior`. Integração:
      `o repositório traduz party_gm_limit para PartyError GM_LIMIT`.
- [ ] **Passo 2:** rodar unit e integration de `parties`. Esperado: falham.
- [ ] **Passo 3:** implementar e registrar no container.
- [ ] **Passo 4:** rodar, mais `error-codes.unit.test.ts`. Esperado: passam.
- [ ] **Passo 5:** commit `feat(parties): contexto de mesas (criar, renomear, apagar, listar)`.

### Tarefa 5: convites e membros

**Arquivos:**

- Criar: `application/{get-invite,request-join,invite-by-username,accept-member,remove-member}.use-case.ts`
- Modificar: `party.repo.ts`, `supabase-party.repository.ts`, `in-memory-party.repository.ts`,
  `PartyContext.ts`, `index.ts`, `parties.api.ts`, `parties.schemas.ts`
- Teste: `parties.use-cases.unit.test.ts`, `party-functions.integration.test.ts`

**Interfaces:**

- Repo: `getInvite(code): Promise<InvitePreview | null>`, `requestJoin(code): Promise<MemberStatus>`,
  `invite(partyId, username): Promise<MemberStatus>`, `activateMember(partyId, userId):
Promise<boolean>` (update `status = 'active'`), `deleteMember(partyId, userId): Promise<boolean>`.
- `InvitePreview { partyId: string; name: string; gmUsername: string | null; myStatus:
MemberStatus | 'gm' | null }`.
- Context: `getInvite(code, userId) → InvitePreview` (null → `INVITE_NOT_FOUND`),
  `requestJoin(code, userId) → MemberStatus`, `inviteByUsername(partyId, gmId, username) →
MemberStatus`, `acceptMember(partyId, requesterId, memberId)` (mestre aprovando pedido ou o
  próprio aceitando convite; o RLS decide qual vale; `false` → `NOT_FOUND`),
  `removeMember(partyId, requesterId, memberId)` (mestre tira/recusa; a própria pessoa sai, recusa
  convite ou desiste do pedido).
- Schemas: `inviteUsernameSchema = z.object({ username: z.string().trim().replace(/^@/, '').min(1).max(60) })`
  — sem a regex de `^[a-z0-9_]+$`: usernames escolhidos antes da regra (tratados como escolhidos na
  migração do #121) podem ter `.` ou maiúsculas e precisam ser achados;
  `inviteCodeParamsSchema = z.object({ code: z.string().regex(/^[a-f0-9]{32}$/) })`,
  `memberParamsSchema = z.object({ partyId: z.uuid(), userId: z.uuid() })`.

- [ ] **Passo 1: testes:** unit — `acceptMember sem linha afetada → party_error_not_found`;
      `getInvite de código inexistente → party_error_invite_not_found`. Integração (repositório
      Supabase de ponta a ponta) — `pedido pelo link → mestre aprova → aparece em asPlayer do
    jogador`; `convite por username → jogador aceita`; `jogador recusa convite → some dos
    invites`; `mestre tira membro`.
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar. Esperado: passam.
- [ ] **Passo 5:** commit `feat(parties): convites por link e por username`.

### Tarefa 6: página da mesa — pessoas, roster, personagens levados e modo Role Play

**Arquivos:**

- Criar: `application/get-party.use-case.ts`, `application/set-my-characters.use-case.ts`,
  `domain/role-play-card.ts` (+ `.unit.test.ts`)
- Modificar: `shared/systems/dnd5e/calculations.ts` (+ teste), repo/contexto/api de `parties`

**Interfaces:**

- `calculatePassiveInsight(wisValue: number, level: number, isInsightProficient: boolean,
hasInsightExpertise = false): number` em `calculations.ts` (10 + perícia, como
  `calculatePassivePerception`).
- ```ts
  export interface PartyPerson {
    userId: string;
    username: string | null;
    avatarUrl: string | null;
    status: MemberStatus | 'gm';
  }
  export interface RosterCharacter {
    characterId: string;
    ownerId: string;
    name: string;
    avatarUrl: string | null;
    race: string;
    class: string;
    level: number;
    accentColor: string | null;
  }
  export interface RolePlayCard extends RosterCharacter {
    ownerUsername: string | null;
    personalityTraits: string | null;
    ideals: string | null;
    bonds: string | null;
    flaws: string | null;
    passivePerception: number;
    passiveInsight: number;
  }
  export interface PartyView {
    id: string;
    name: string;
    system: string;
    role: PartyRole;
    people: PartyPerson[];
    roster: RosterCharacter[];
    myCharacterIds: string[]; // os meus levados (jogador)
    gm: { inviteCode: string; rolePlay: RolePlayCard[] } | null; // só para o mestre
  }
  ```
- `toRolePlayCard(roster: RosterCharacter, sheet: { attributes: Record<string, number>; skills:
Record<string, { isProficient: boolean; expertise?: boolean }>; level: number }, lore: {
personalityTraits?, ideals?, bonds?, flaws? } | null, ownerUsername: string | null): RolePlayCard`
  — WIS ausente conta 10; **ignora** `system_data.passivePerception` salvo.
- Repo: `findParty(id) → { id, name, system, gmId } | null` (RLS), `people(id)` (RPC
  `party_people`), `roster(id)` (RPC `party_roster`), `inviteCode(id)`, `myCharacterIds(id, userId)`,
  `rolePlaySheets(characterIds) → { id, attributes, skills, level, lore }[]` (select em
  `characters` e `character_lore` com o client do mestre; o RLS da Tarefa 3 é que deixa),
  `addCharacters(partyId, ids)`, `removeCharacters(partyId, ids)`.
- Context: `get(partyId, userId) → PartyView` (não é mestre nem membro ativo → `NOT_FOUND`);
  `setMyCharacters(partyId, userId, characterIds: string[])` — diferença entre o atual e o pedido;
  insert recusado pelo RLS → `CHARACTER_NOT_ALLOWED`.
- Schema: `myCharactersSchema = z.object({ characterIds: z.array(z.uuid()).max(20) })`.

- [ ] **Passo 1: testes:** `calculatePassiveInsight(14, 5, true) === 15`; `toRolePlayCard` com
      `system_data.passivePerception = 10` salvo mas WIS 16 e proficiência no nível 1 → 15;
      `sem lore → traço/ideal/vínculo/defeito null`; unit — `get de quem é só invited →
    party_error_not_found`; `get do jogador vem com gm: null`; `setMyCharacters troca A por B
    (remove A, insere B)`; integração — `o mestre recebe os cards com passivas calculadas`;
      `setMyCharacters com npc → party_error_character_not_allowed`.
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar. Esperado: passam.
- [ ] **Passo 5:** commit `feat(parties): página da mesa, personagens levados e modo Role Play`.

### Tarefa 7: leitura do mestre nos contextos de personagem e lore

**Arquivos:**

- Criar: `src/backend/contexts/characters/domain/PartyGmAccess.ts`,
  `src/backend/contexts/characters/application/party-gm/get-party-character.use-case.ts`,
  `.../party-gm/get-party-character-spells.use-case.ts`,
  `src/backend/contexts/lore/application/get-lore/get-party-lore.use-case.ts`
- Modificar: `characters/index.ts`, `CharacterContext.ts`, `characters.api.ts`, `lore/index.ts`,
  `LoreContext.ts`, `lore.api.ts`, `shared/providers/contexts.ts`
- Teste: `.../party-gm/party-gm.use-cases.unit.test.ts`, `lore.use-cases.unit.test.ts`

**Interfaces:**

- `interface PartyGmAccess { isGmOfCharacter(partyId: string, characterId: string, userId: string): Promise<boolean> }`
  — implementada pelo contexto `parties` (personagem no roster de uma mesa onde `userId` é o
  mestre). Em `contexts.ts`, `createCharacterContext(userClient, { partyGmAccess: this.party })` e o
  mesmo para lore.
- `CharacterContext.getForPartyGm(partyId, id, gmId): Promise<Character>`,
  `CharacterContext.getSpellsForPartyGm(partyId, id, gmId, locale?)`,
  `LoreContext.getForPartyGm(partyId, characterId, gmId)`. Sem acesso → o mesmo
  `GET_NOT_FOUND`/`ACCESS_NOT_FOUND` das leituras de dono (não revela que existe).
- `findOwnedCharacter` não muda: nenhum caso de uso de escrita ganha caminho para o mestre.

- [ ] **Passo 1: testes unitários:** `getForPartyGm com acesso devolve a ficha`; `sem acesso →
    not_found, sem ler o repositório`; idem para magias e lore.
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar. Esperado: passam.
- [ ] **Passo 5:** commit `feat(characters): leitura da ficha pelo mestre da mesa`.

### Tarefa 8: rotas da API

**Arquivos (todas com `withAuth` e os schemas das Tarefas 4–6):**

| Rota                                                        | Métodos → `partiesApi`/outros                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `app/api/parties/route.ts`                                  | GET `listMine`; POST `create` (201)                                  |
| `app/api/parties/[partyId]/route.ts`                        | GET `get`; PATCH `rename`; DELETE `delete` (204)                     |
| `app/api/parties/[partyId]/invite-code/route.ts`            | POST `rotateInviteCode` → `{ code }`                                 |
| `app/api/parties/[partyId]/invites/route.ts`                | POST `inviteByUsername` → `{ status }`                               |
| `app/api/parties/[partyId]/members/[userId]/route.ts`       | PATCH `acceptMember` (204); DELETE `removeMember` (204)              |
| `app/api/parties/[partyId]/my-characters/route.ts`          | PUT `setMyCharacters` (204)                                          |
| `app/api/parties/[partyId]/characters/[id]/route.ts`        | GET `charactersApi.getForPartyGm`                                    |
| `app/api/parties/[partyId]/characters/[id]/lore/route.ts`   | GET `loreApi.getForPartyGm` (`{}` quando vazio, como a rota do dono) |
| `app/api/parties/[partyId]/characters/[id]/spells/route.ts` | GET `charactersApi.getSpellsForPartyGm` (`?locale=`)                 |
| `app/api/parties/join/[code]/route.ts`                      | GET `getInvite`; POST `requestJoin` → `{ status }`                   |

- Nenhuma rota de escrita em `/api/parties/[partyId]/characters/**`.
- [ ] **Passo 1:** os testes de rota ficam no e2e (Tarefa 13), como as rotas atuais; aqui,
      `npx tsc --noEmit` e `npm run lint` no que mudou.
- [ ] **Passo 2:** commit `feat(api): rotas das mesas`.

### Tarefa 9: front — hooks, `/parties` e sidebar

**Arquivos:**

- Criar: `src/frontend/hooks/useParties.ts`, `src/frontend/hooks/useParty.ts`,
  `app/[locale]/(app)/(dashboard)/parties/page.tsx`,
  `src/frontend/components/party/{PartyList,CreatePartyForm,PartyInviteCard}.tsx`
- Modificar: `src/frontend/lib/query-keys.ts` (`PARTIES_QUERY_KEY = ['parties']`),
  `src/frontend/components/layout/Sidebar.tsx`, `app/[locale]/(app)/(dashboard)/layout.tsx`
  (semeia `PARTIES_QUERY_KEY` ao lado do perfil, com `.catch(() => null)`),
  `messages/{en,pt}.json` (namespace `parties`)
- Teste: `src/frontend/components/party/PartyList.unit.test.tsx`

**Interfaces:**

- `useParties()` → `{ parties: MyParties | undefined, isLoading, createParty(name), respond(partyId, accept) }`
  (aceitar = PATCH no próprio `userId`, recusar = DELETE); invalida `PARTIES_QUERY_KEY`.
- `useParty(partyId, { initial? })` → `{ party: PartyView | undefined, ... }` com as mutações da
  página (renomear, apagar, trocar código, convidar, aceitar/remover membro, sair, levar
  personagens); query key `['party', partyId]`, e cada mutação invalida ela e `PARTIES_QUERY_KEY`.
- `/parties` semeia a lista no servidor (`SeededQuery`, como `/characters`). Seções: convites
  pendentes (aceitar/recusar), "Como mestre" (com contador de pedidos), "Como jogador", pedidos
  aguardando aprovação. Criar mesa: formulário de nome, desabilitado com 5 mesas como mestre
  ("Limite de 5 mesas como mestre").
- Sidebar: item "Mesas" (`/parties`) e, abaixo, os links das mesas em dois grupos "Mestre" e
  "Jogador" (lê `useParties`; semeado pelo layout do dashboard junto do perfil, para não piscar).

- [ ] **Passo 1: teste:** `PartyList mostra convites com aceitar/recusar e separa mestre e jogador`;
      `com 5 mesas como mestre o botão de criar fica desabilitado com o aviso do limite`.
- [ ] **Passo 2:** rodar. Esperado: falha.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:unit` (inclui os guards de texto e tokens). Esperado: passa.
- [ ] **Passo 5:** commit `feat(parties): lista de mesas e navegação`.

### Tarefa 10: front — link de convite e volta depois do login

**Arquivos:**

- Criar: `app/[locale]/(app)/(dashboard)/parties/join/[code]/page.tsx`,
  `src/frontend/components/party/JoinPartyCard.tsx`
- Modificar: `app/[locale]/(app)/(dashboard)/layout.tsx`
- Teste: e2e na Tarefa 13

**Interfaces:**

- Layout do dashboard: deslogado vai para `/login?next=<caminho pedido>` (o `PATHNAME_HEADER`,
  como já faz para `/choose-username`; sem `next` quando o caminho é `/characters`).
- Página do convite (servidor chama `partiesApi.getInvite`): código inválido → estado vazio "Este
  convite não vale mais"; `myStatus`: `null` → nome da mesa, mestre e "Pedir para entrar";
  `requested` → "Pedido enviado, aguardando o mestre"; `invited` → "Você já foi convidado" com
  aceitar; `active`/`gm` → redireciona para `/parties/<id>`.

- [ ] **Passo 1:** implementar (o e2e da Tarefa 13 cobre o fluxo).
- [ ] **Passo 2:** `npx tsc --noEmit`, `npm run test:unit`. Esperado: passam.
- [ ] **Passo 3:** commit `feat(parties): página do link de convite`.

### Tarefa 11: front — página da mesa

**Arquivos:**

- Criar: `app/[locale]/(app)/(dashboard)/parties/[partyId]/page.tsx`,
  `src/frontend/components/party/{RolePlayBoard,RolePlayCard,PartyRequests,PartyManagement,PartyRoster,MyPartyCharacters}.tsx`
- Teste: `src/frontend/components/party/RolePlayCard.unit.test.tsx`,
  `MyPartyCharacters.unit.test.tsx`

**Decisões:**

- Mestre: `RolePlayBoard` (grid de `RolePlayCard`: avatar, nome, raça · classe · nível, jogador
  `@username`, traço/ideal/vínculo/defeito, percepção e intuição passivas; o card todo é link para
  `/parties/<partyId>/characters/<id>`), `PartyRequests` (pedidos com aprovar/recusar; convites
  enviados com cancelar), `PartyManagement` (convidar por username, link com copiar e "Trocar link"
  com confirmação, membros com remover, renomear, apagar com confirmação).
- Jogador: `PartyRoster` (cards só com o básico, sem link), `MyPartyCharacters` (checkbox dos meus
  `pc` de `useCharacters`, salvar com PUT), "Sair da mesa" com confirmação.
- Mesa sem personagens: estado vazio que diz o que fazer (mestre: "convide jogadores"; jogador:
  "escolha quem levar").
- Erro `party_error_not_found` (inclui ser removido) → estado vazio com link para `/parties`.

- [ ] **Passo 1: testes:** `RolePlayCard mostra as passivas e linka para a ficha da mesa`;
      `RolePlayCard sem lore não mostra rótulos vazios`; `MyPartyCharacters envia só os ids
    marcados`.
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:unit`. Esperado: passa.
- [ ] **Passo 5:** commit `feat(parties): página da mesa (Role Play e jogadores)`.

### Tarefa 12: ficha só leitura para o mestre

**Arquivos:**

- Criar: `src/frontend/hooks/useSheetSource.ts` (+ `.unit.test.tsx`),
  `app/[locale]/(app)/(dashboard)/parties/[partyId]/characters/[id]/layout.tsx` e as páginas
  `page.tsx`, `lore/page.tsx`, `spells/page.tsx`, `inventory/page.tsx` (reexportam as da ficha do
  dono: `export { default, generateMetadata } from '<rota do dono>'`)
- Modificar: `useCharacter.ts`, `useCharacterLore.ts`, `useCharacterSpells.ts`,
  `CharacterSheetShell.tsx`, `CharacterNavSection.tsx`, `SaveControls.tsx`
  (`SaveCharacterButton`), `LoreTab.tsx`, `SpellsTab.tsx`, `SpellsSection.tsx`,
  `CharacterHeader.tsx`, `StatusView.tsx`

**Interfaces:**

- `useSheetSource(characterId: string): { readOnly: boolean; apiPath: string; pagesPath: string }`
  — lê `useParams()`: com `partyId`, `{ readOnly: true, apiPath:
'/api/parties/<partyId>/characters/<id>', pagesPath: '/parties/<partyId>/characters/<id>' }`;
  sem, `{ readOnly: false, apiPath: '/api/characters/<id>', pagesPath:
'/system/<system>/character/<id>' }` (o `system` vem do personagem, como hoje).
- Os três hooks de dados usam `apiPath`; as query keys não mudam (o mestre nunca é dono do mesmo
  personagem, então não há colisão de cache).
- `readOnly`: `CharacterSheetShell` não compara dono (o servidor já autorizou; 404 → mesmo estado
  vazio, com "voltar" para a mesa); `SaveCharacterButton` e os `SaveControls` da lore não
  aparecem; `StatusView` e `LoreSection` ficam dentro de `<fieldset disabled>` (desliga todos os
  campos e botões de uma vez); `SpellsTab` sem "Adicionar" nem diálogo de busca e `SpellsSection`
  sem esquecer/preparar (os cards continuam abrindo para ler); `CharacterHeader` sem
  personalizar, avatar e apagar; o guard de "sair sem salvar" fica desligado.
- `CharacterNavSection` monta as abas a partir de `pagesPath`.
- Layout da rota da mesa: igual ao da ficha do dono, mas carregando com
  `charactersApi.getForPartyGm(partyId, id, user.id)`; título `"<aba> · <nome> · RPG World"`.

- [ ] **Passo 1: testes:** `useSheetSource com partyId → readOnly e caminhos da mesa`; `sem partyId
    → caminhos do dono`; `StatusView em modo só leitura não tem campo editável habilitado nem
    botão salvar` (render com `CharacterContextProvider` e params mockados).
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:unit` e os e2e da ficha (`sheet-save`, `lore`, `spells`,
      `isolation`) para garantir que a ficha do dono não mudou. Esperado: passam.
- [ ] **Passo 5:** commit `feat(parties): ficha só leitura para o mestre`.

### Tarefa 13: e2e das mesas

**Arquivos:**

- Criar: `e2e/parties.spec.ts`
- Modificar: `e2e/support/fixtures.ts` (helpers `createParty(page, name): Promise<{ id: string; code: string }>`
  pela API, e `partyUrl(id, path = '')`)

**Testes** (dois ou três `browser.newContext()`, como em `isolation.spec.ts`; caminhos comparados
com `url.pathname`):

- `jogador entra pelo link e o mestre aprova`: mestre cria mesa e copia o link; jogador abre,
  "Pedir para entrar"; mestre vê o pedido e aprova; jogador vê a mesa em "Como jogador" e leva um
  personagem; mestre vê o card com raça, classe, nível, passivas e abre a ficha só leitura (sem
  botão salvar, campos desabilitados).
- `convite por username com aceite`: mestre convida `@username` do jogador; jogador aceita em
  `/parties`.
- `deslogado abre o link, entra e volta ao convite`.
- `link trocado não serve mais`.
- `colega não lê a ficha completa`: GET `/api/parties/<id>/characters/<id>` (e `/lore`, `/spells`)
  e `/api/characters/<id>` pelo colega → 404; a página da mesa do colega não mostra PV nem lore.
- `o mestre não escreve`: PUT `/api/characters/<id>` e POST `/api/characters/<id>/spells` pelo
  mestre → 403/404, e a ficha do jogador fica igual.
- `sair da mesa mantém o personagem em Meus Personagens`.

- [ ] **Passo 1:** escrever os testes.
- [ ] **Passo 2:** `npx playwright test e2e/parties.spec.ts` (sem rodar `test:integration` ao
      mesmo tempo). Esperado: passam; se algum falhar, é bug das tarefas anteriores.
- [ ] **Passo 3:** commit `test(e2e): fluxo das mesas`.

### Tarefa 14: verificação e PR B

- [ ] **Passo 1:** passos da CI localmente: `npx tsc --noEmit`, `npm run lint`, `npm run knip`,
      `npm run test:coverage`, `npm run test:integration`, `npx playwright test`,
      `npm run test:visual` (telas novas não têm baseline; as atuais não podem mudar).
- [ ] **Passo 2:** revisão final da branch no modelo mais forte.
- [ ] **Passo 3:** push e PR B (base: main, depois do merge da A). Corpo com o fluxo de convite, o
      que cada um vê e os pontos que ficaram para depois.
