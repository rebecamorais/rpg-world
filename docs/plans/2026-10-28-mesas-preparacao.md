# Mesas — preparação (username obrigatório, `characters.kind`, volta depois do login)

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: superpowers:subagent-driven-development (recomendado) ou
> superpowers:executing-plans, tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** deixar prontos os três pré-requisitos da fase 1 das mesas: toda conta com um username
escolhido por ela (o gerado não aparece para ninguém), a marca `pc`/`npc` nos personagens, e quem
abre um link deslogado voltar a ele depois de entrar.

**Arquitetura:** o username gerado sai do banco (função `random_username()` como `DEFAULT` da
coluna, usada também pelo trigger de cadastro) com `username_chosen = false`; o layout do dashboard
manda quem não escolheu para `/choose-username`. A volta depois do login é um cookie
`rw_next` gravado pelas páginas de login/cadastro e consumido pelo proxy na chegada a
`/characters`, que é onde todos os fluxos de entrada terminam.

**Stack:** Supabase (migrações SQL, RLS), Next.js 16 (`proxy.ts`, `app/[locale]`), next-intl,
TanStack Query, Vitest, Playwright.

**Spec:** [`2026-10-28-mesas-fase-1-role-play.md`](2026-10-28-mesas-fase-1-role-play.md) (seções
"Username gerado × escolhido", "Pontos técnicos" e "Decisões do Claude na revisão").

## Restrições globais

- Username válido: `^[a-z0-9_]{3,30}$` (o `ProfileForm` já usa `^[a-z0-9_]+$`, 3–30).
- Unicidade sem diferenciar maiúsculas (índice único em `lower(username)`).
- Username gerado: `<substantivo>_<adjetivo>_<4 dígitos>`, só ASCII minúsculo, ex.:
  `corvo_dourado_4821`.
- O username gerado nunca vem do e-mail nem do `preferred_username` do Google.
- Migrações vão para produção no merge: cada uma precisa rodar sem erro num banco com dados reais
  (usernames nulos, gerados pelo e-mail e escolhidos).
- Toda função nova recebe `GRANT EXECUTE` explícito (a migração `20261020130000` revoga por padrão).
- `kind` só aceita `pc` ou `npc`; todos os personagens atuais são `pc`.
- `next` só aceita caminhos internos (`safeRedirectPath`, já existe).
- Textos novos em `messages/en.json` e `messages/pt.json`.

## Review Focus

1. Usuário logado com `username_chosen = false` abrindo direto uma URL do dashboard
   (`/characters/new`, uma ficha) → vai para `/choose-username` e, depois de escolher, segue para
   onde ia. (Tarefa 3)
2. Escolher um username que difere de um existente só por maiúsculas (`Bia` × `bia`) → erro "já em
   uso", não 500. (Tarefa 2)
3. `?next=https://evil.com` ou `?next=//evil.com` no login → ignorado, cai em `/characters`.
   (Tarefa 5)
4. Cookie `rw_next` sem sessão (abriu o login e desistiu) → não redireciona ninguém deslogado e não
   fica preso em loop. (Tarefa 5)
5. Os e2e existentes criam usuários pela API admin: eles já precisam nascer com `username_chosen =
true`, senão todo e2e logado cai em `/choose-username`. (Tarefa 3)

---

### Tarefa 1: banco — username gerado, marca de escolhido e obrigatório

**Arquivos:**

- Criar: migração via `npx supabase migration new mandatory_username --workdir database/db-dev`
- Modificar: `lib/types/database.ts` (coluna `username_chosen`, função `random_username`)
- Teste: `src/backend/contexts/users/infrastructure/repositories/profile-rls.integration.test.ts`

**Interfaces:**

- Produz: `public.random_username() RETURNS text` (STABLE não; VOLATILE), único no momento da
  geração (tenta de novo se já existir). `GRANT EXECUTE` só para `service_role` e `postgres`.
- Produz: `profile.username text NOT NULL DEFAULT public.random_username()`,
  `profile.username_chosen boolean NOT NULL DEFAULT false`, índice único `lower(username)`.
- `handle_new_user()` deixa de informar `username` (o `DEFAULT` gera) e não lê mais e-mail nem
  `preferred_username`.

- [ ] **Passo 1: testes de integração** (no `profile-rls.integration.test.ts`):
  - `cadastro novo ganha um username gerado, ainda não escolhido`: cria usuário pela API admin com
    e-mail `fulano.de.tal@example.com`; o perfil tem `username` casando com
    `/^[a-z]+_[a-z]+_\d{4}$/`, não contém `fulano` e tem `username_chosen === false`.
  - `dois usernames que só diferem por maiúsculas não convivem`: `update` com `Bia` depois de outro
    usuário ter `bia` → `UserError` `PROFILE_USERNAME_TAKEN`.
- [ ] **Passo 2:** `npx vitest run --config ./test/vitest.config.integration.ts src/backend/contexts/users`.
      Esperado: os dois falham.
- [ ] **Passo 3: migração**, nesta ordem:
  1. `random_username()` com duas listas fixas de ~30 palavras ASCII cada (substantivos e adjetivos
     de fantasia, sem acento) + `lpad(floor(random()*10000)::int::text, 4, '0')`, em loop até não
     existir em `lower(username)`.
  2. `ADD COLUMN username_chosen boolean NOT NULL DEFAULT false`.
  3. Marca como escolhido quem tem username e **não** segue o padrão gerado pelo e-mail:
     `username IS NOT NULL AND username <> lower(split_part(email,'@',1) || substring(id::text,1,5))`
     (join com `auth.users`).
  4. Quem não foi marcado (nulo ou gerado pelo e-mail) recebe `random_username()`.
  5. `SET DEFAULT public.random_username()`, `SET NOT NULL`, índice único em `lower(username)`.
  6. `CREATE OR REPLACE FUNCTION public.handle_new_user()` sem a coluna `username` no insert
     (mantém `SECURITY DEFINER` e `search_path = ''` da migração `20261020130000`).
  7. Grants da função nova.
- [ ] **Passo 4:** `npx supabase migration up --workdir database/db-test` e
      `npx supabase db advisors --db-url "postgresql://postgres:postgres@127.0.0.1:54432/postgres?sslmode=disable"`;
      rodar os testes do passo 2. Esperado: passam, e o advisor não acusa a função nova.
- [ ] **Passo 5:** commit `feat(db): username sempre presente, gerado com palavras aleatórias até a pessoa escolher`.

### Tarefa 2: domínio e API do perfil sabem se o username foi escolhido

**Arquivos:**

- Modificar: `src/backend/contexts/users/domain/Profile.ts`,
  `src/backend/contexts/users/infrastructure/repositories/supabase-profile-repository.ts`
- Teste: `supabase-profile-repository` (unitário existente, se houver) e o integration da Tarefa 1

**Interfaces:**

- Consome: coluna `username_chosen` (Tarefa 1).
- Produz: `Profile.usernameChosen: boolean` no `getById`; `update` com `username` grava também
  `username_chosen = true`; `update` sem `username` não mexe na marca. A API `/api/profile` passa a
  devolver `usernameChosen`.

- [ ] **Passo 1: teste de integração** `salvar o username marca como escolhido`: `update({ id, username: 'aventureira_7' })`
      → `getById` devolve `usernameChosen: true`; e `salvar só o nome completo não muda a marca`.
- [ ] **Passo 2:** rodar. Esperado: falha.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar integração e unitários de users. Esperado: passam.
- [ ] **Passo 5:** commit `feat(perfil): o perfil sabe se o username foi escolhido`.

### Tarefa 3: tela de escolher o username e o desvio no dashboard

**Arquivos:**

- Criar: `app/[locale]/(app)/choose-username/page.tsx`, `src/frontend/components/ChooseUsernameForm.tsx`
- Modificar: `app/[locale]/(app)/(dashboard)/layout.tsx`, `messages/en.json`, `messages/pt.json`,
  `e2e/support/fixtures.ts` (usuário de teste nasce com `username_chosen = true`)
- Testes: `src/frontend/components/ChooseUsernameForm.unit.test.tsx`, `e2e/choose-username.spec.ts`

**Interfaces:**

- Consome: `Profile.usernameChosen` (Tarefa 2), `PATCH /api/profile`.
- O layout do dashboard, que já carrega o perfil, faz `redirect('/choose-username')` quando
  `profile && !profile.usernameChosen`.
- `ChooseUsernameForm`: campo username (mesma validação do `ProfileForm`), sugestão vazia (o gerado
  não aparece), erro `PROFILE_USERNAME_TAKEN` traduzido; ao salvar, `window.location.assign('/characters')`.
- Copy (en / pt): título "Choose your username" / "Escolha seu nome de usuário"; texto "It's how
  your game master finds you to invite you to a table. You can change it later in your profile." /
  "É por ele que o mestre te encontra para convidar para uma mesa. Dá para trocar depois no
  perfil."; botão "Continue" / "Continuar".

- [ ] **Passo 1: testes**
  - Unitário: `não mostra o username gerado`, `recusa menos de 3 caracteres e caracteres inválidos`,
    `mostra o erro de username em uso`, `salvar envia o username e segue para /characters`.
  - e2e `e2e/choose-username.spec.ts`: `conta nova é levada a escolher o username antes do
dashboard` (cria usuário com `username_chosen = false`, abre `/characters`, cai em
    `/choose-username`, escolhe, chega em `/characters`); e `abrir uma ficha direto também passa
pela escolha`.
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** implementar; ajustar a fixture `user` dos e2e para nascer com o username marcado
      como escolhido.
- [ ] **Passo 4:** unitários + `npx playwright test`. Esperado: tudo passa.
- [ ] **Passo 5:** commit `feat(perfil): escolher o username antes de usar o app`.

### Tarefa 4: `characters.kind` (`pc` / `npc`)

**Arquivos:**

- Criar: migração `character_kind`
- Modificar: `supabase-character.repository.ts` (`findByOwner` só traz `pc`), `lib/types/database.ts`
- Teste: `rls.integration.test.ts`

**Interfaces:**

- Produz: `characters.kind text NOT NULL DEFAULT 'pc' CHECK (kind IN ('pc','npc'))`.
- `findByOwner` filtra `kind = 'pc'`. A entidade não ganha campo por enquanto (ninguém cria `npc`
  ainda); a fase 2 cria o caminho de `npc`.

- [ ] **Passo 1: teste de integração** `a lista do dono não traz fichas de inimigo`: insere uma
      ficha com `kind = 'npc'` pelo admin; `findByOwner` não a devolve, e a `pc` continua aparecendo.
- [ ] **Passo 2:** rodar. Esperado: falha (coluna não existe).
- [ ] **Passo 3:** migração + filtro.
- [ ] **Passo 4:** rodar integração de personagens. Esperado: passa.
- [ ] **Passo 5:** commit `feat(db): personagens com marca pc/npc`.

### Tarefa 5: voltar ao link depois de entrar

**Arquivos:**

- Modificar: `proxy.ts`, `proxy.unit.test.ts`, `src/frontend/components/auth/LoginForm.tsx`,
  `src/frontend/components/auth/SignUpForm.tsx`
- Criar: `src/frontend/lib/post-login-next.ts`
- Teste: `e2e/auth.spec.ts`

**Interfaces:**

- `rememberNext(search: string): void` em `post-login-next.ts`: lê `next` do query string; se
  `safeRedirectPath` aceitar, grava o cookie `rw_next` (`path=/`, `max-age=1800`, `SameSite=Lax`).
  As páginas de login e cadastro chamam no `useEffect` (são estáticas: nada de `searchParams` no
  servidor).
- No `proxy.ts`: pedido a `/characters` **com sessão válida** e cookie `rw_next` → redirect para o
  caminho do cookie (validado de novo com `safeRedirectPath`) e o cookie é apagado na resposta. Sem
  sessão, o cookie é ignorado e fica para depois.

- [ ] **Passo 1: testes**
  - Proxy: `com sessão, /characters com rw_next=/settings/profile redireciona para lá e apaga o
cookie`; `rw_next=//evil.com é ignorado`; `sem sessão, rw_next não redireciona`.
  - Unitário de `rememberNext`: grava para `?next=/parties/join/abc`, ignora `?next=https://evil.com`.
  - e2e: `quem abre o login com next volta para lá depois de entrar` (`/login?next=/settings/profile`
    → login com senha → URL termina em `/settings/profile`).
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** unitários, `npx playwright test e2e/auth.spec.ts`. Esperado: passam.
- [ ] **Passo 5:** commit `feat(auth): voltar ao link depois de entrar`.

### Tarefa 6: verificação e PR

- [ ] **Passo 1:** os passos do job `test` da CI localmente: `npx tsc --noEmit`, `npm run lint`,
      `npm run knip`, `npm run test:coverage`, `npm run test:integration`; e `npx playwright test`,
      `npm run test:visual`.
- [ ] **Passo 2:** PR com as duas migrações destacadas (vão para produção no merge) e o que
      acontece com as contas atuais.
