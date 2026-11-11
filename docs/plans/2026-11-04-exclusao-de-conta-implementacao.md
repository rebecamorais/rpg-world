# Exclusão de conta e mesa sem mestre: plano de implementação

**Issue:** [#146](https://github.com/rebecamorais/rpg-world/issues/146)

> **Para agentes:** use `superpowers:subagent-driven-development` para executar tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** a pessoa exclui a própria conta, com senha e confirmação por e-mail, e as mesas dela sobrevivem, com os jogadores escolhendo um novo mestre por acordo.

**Arquitetura:** as regras ficam no banco, como nas outras funções de mesa: gatilhos e funções `SECURITY DEFINER` com erros `P0001`, e o app só chama e mostra. A exclusão usa um token próprio com hash em tabela só de `service_role`, e `auth.admin.deleteUser` no passo final; o resto é cascata.

**Tecnologia:** Next.js 16, Supabase (Postgres, Auth, Storage), next-intl, TanStack Query, Resend e react-email, Vitest, Playwright.

**Design:** `docs/plans/2026-11-03-exclusao-de-conta.md`. Leia antes de começar; este plano não repete os motivos.

## Restrições globais

- Texto em tela sempre por next-intl, em `messages/en.json` e `messages/pt.json`. `es` e `sv` vêm do Crowdin. Sem cor crua do Tailwind (`design-tokens.unit.test.ts`).
- Cada migração: `npx supabase migration new <nome> --workdir database/db-dev < /dev/null` e mover para `database/migrations/` no formato das outras; aplicar com `npx supabase migration up --local --workdir database/db-dev && npx supabase migration up --local --workdir database/db-test`, depois o comando "Update Types" de `scripts/infra.ts` e `npx prettier --write lib/types/database.ts`.
- Comentários de migração em português, explicando o porquê; `SET search_path = ''`; `REVOKE ALL ... FROM PUBLIC, anon, authenticated` e `GRANT` explícito.
- `test:integration` e `test:e2e` usam o mesmo banco e o truncam: nunca ao mesmo tempo.
- Valores fixos: link de exclusão vale **1 hora**; botão de suporte ativo **1 dia** depois de abrir o pedido; suporte espera **7 dias** depois de escrever ao jogador; limite de **5** mesas por mestre.
- Commits em português, Conventional Commits, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Não fazer push.

## Pontos de atenção

Cada um tem teste na tarefa dona:

1. **Votos simultâneos:** dois jogadores aceitam ao mesmo tempo. A mesa precisa ser aprovada, sem voto perdido (Tarefa 2).
2. **Mestre sai com combate em andamento:** a página da mesa abre normalmente para os jogadores, sem combate (Tarefas 1 e 6).
3. **Abrir o link do e-mail não apaga:** antivírus abre o link; um link antigo para de valer quando se pede outro (Tarefa 4).
4. **Mesa sem mestre em toda tela:** lista, convite e página sem nome de mestre não quebram nem somem (Tarefas 1, 3 e 6).
5. **Uma exclusão com vários papéis:** mestre de uma mesa, candidato em outra e última pendência numa terceira; e a sessão antiga depois de excluir (Tarefas 2 e 4).

---

### Tarefa 1: Banco: mesa sem mestre

**Arquivos:**

- Criar: `database/migrations/<ts>_party_without_gm.sql`
- Teste: `src/backend/contexts/parties/infrastructure/party-without-gm.integration.test.ts`

**Interfaces:**

- Produz: `parties.gm_id` anulável com `ON DELETE SET NULL`; `my_parties`, `party_people`, `get_party_invite` que devolvem mesas sem mestre (`gm_username` nulo, `party_people` sem linha `gm`); erro `party_without_gm`; gatilho `private.after_party_member_removed()`, que a Tarefa 2 estende.

- [ ] **Passo 1: testes que falham** (helpers `createSignedInClient`, `createParty`, `addMember`; excluir com `admin().auth.admin.deleteUser`):
  - mestre com jogador ativo excluído: a mesa continua, `gm_id` nulo, `image_url` nulo, sem linha em `encounters`, baú e `party_journals` intactos;
  - mestre sem jogador ativo (só `requested` e `invited`): a mesa some;
  - o último jogador ativo sai de uma mesa sem mestre: a mesa some; se ainda há outro, continua;
  - com `gm_id` nulo, o jogador ainda lê mesa, baú e diário; `my_parties()` traz a mesa com `gm_username` nulo; `party_people()` traz os membros;
  - **ninguém ganha acesso:** com `gm_id` nulo, um jogador não lê a ficha completa de outro, não atualiza a mesa, não apaga a mesa nem tira outro membro;
  - `request_party_join` falha com `party_without_gm`, mesmo para quem foi convidado; aceitar convite (`UPDATE` para `active`) também falha com `party_without_gm`;
  - `get_party_invite` devolve a mesa sem mestre, com `gm_username` nulo;
  - mesa com mestre continua igual: criar, renomear e o limite de 5.
- [ ] **Passo 2:** `npm run test:integration -- party-without-gm`. Esperado: FALHA.
- [ ] **Passo 3: migração.** Revise **todo** uso de `gm_id` (`grep -n gm_id database/migrations/*`) e registre em comentário por que cada um segue seguro. Mudanças:
  - `ALTER COLUMN gm_id DROP NOT NULL` e troca da FK para `ON DELETE SET NULL`;
  - `BEFORE UPDATE OF gm_id`: se `NEW.gm_id` é nulo, `NEW.image_url := NULL` (a `CHECK` de `image_url` concatena `gm_id`);
  - `AFTER UPDATE OF gm_id`: se virou nulo e não há membro `active`, apaga a mesa; senão, apaga o `encounters` da mesa;
  - `LEFT JOIN` em `my_parties` e `get_party_invite`; em `party_people`, a parte do mestre continua `JOIN`, o que tira a linha `gm`;
  - `request_party_join` levanta `party_without_gm`; `BEFORE UPDATE` em `party_members`: `status` indo para `active` com mestre nulo levanta o mesmo erro;
  - `AFTER DELETE` em `party_members` chamando `private.after_party_member_removed()`: se a mesa existe com `gm_id` nulo e sem `active`, apaga a mesa. A mesa já apagada por cascata não existe mais nesse ponto: confira a existência.
- [ ] **Passo 4:** aplicar nos dois bancos e gerar os tipos. Rodar o teste. Esperado: PASS. Rodar também `npm run test:integration -- parties combat`. Esperado: sem regressão.
- [ ] **Passo 5: commit** `feat(db): a mesa continua quando a conta do mestre é excluída`.

### Tarefa 2: Banco: pedido, acordo e suporte

**Arquivos:**

- Criar: `database/migrations/<ts>_party_gm_claims.sql`
- Teste: `src/backend/contexts/parties/infrastructure/party-gm-claims.integration.test.ts`

**Interfaces:**

- Consome: `private.after_party_member_removed()` da Tarefa 1.
- Produz, para `authenticated`:
  - `claim_party_gm(p_party_id uuid) RETURNS text`: `'pending'` ou `'approved'`;
  - `vote_party_gm_claim(p_party_id uuid, p_accept boolean) RETURNS text`: `'pending'`, `'approved'` ou `'cancelled'`;
  - `cancel_party_gm_claim(p_party_id uuid) RETURNS void`: só quem pediu;
  - `party_gm_claim(p_party_id uuid) RETURNS TABLE (candidate_id uuid, candidate_username text, created_at timestamptz, pending_user_ids uuid[])`: só membros ativos; sem linhas se não há pedido.
- Produz, só para `service_role`:
  - `support_party_gm_claim(p_party_id uuid) RETURNS TABLE (candidate_id uuid, created_at timestamptz, pending_user_id uuid, pending_email text)`;
  - `support_remove_unresponsive_member(p_party_id uuid, p_user_id uuid) RETURNS text`: mesmo retorno de `vote_party_gm_claim`.
- Erros: `party_has_gm`, `party_not_active_member`, `party_gm_limit` (o nome que `check_party_gm_limit` já usa, se houver), `party_claim_exists`, `party_claim_not_found`, `party_cannot_vote`.

- [ ] **Passo 1: testes que falham:**
  - jogador único pede: vira mestre na hora, sai de `party_members`, os personagens dele saem da mesa e as fichas continuam;
  - três jogadores: A pede (`pending`); B aceita (`pending`); C aceita (`approved`); A é mestre e lê a ficha de B e C; antes disso não lia;
  - recusa: devolve `cancelled`, sem pedido, e qualquer um pode pedir de novo;
  - segundo pedido com um aberto: `party_claim_exists`; pedir em mesa com mestre: `party_has_gm`; quem não é ativo: `party_not_active_member`;
  - **limite:** com 5 mesas, pedir falha com `party_gm_limit`; quem chegou a 5 depois de pedir tem o pedido cancelado na última aceitação (`cancelled`);
  - candidato não vota; quem não é ativo não vota (`party_cannot_vote`); votar duas vezes não conta duas;
  - **reavaliação:** a última pendência sai da mesa ou exclui a conta: aprova; o candidato sai ou exclui a conta: cancela;
  - **votos simultâneos:** B e C aceitam com `Promise.all` em dez repetições: sempre aprovado;
  - **uma exclusão com vários papéis:** X é mestre da mesa 1, candidato na 2 e última pendência na 3; excluir X deixa a 1 sem mestre, cancela a 2 e aprova a 3;
  - sem acesso direto: `authenticated` não lê nem escreve `party_gm_claims` e `party_gm_claim_votes`;
  - `party_gm_claim` não responde a quem não é ativo; não expõe e-mail;
  - suporte: `authenticated` não executa as funções `support_*`; tirar quem está pendente aprova e deixa a ficha dele fora da leitura do novo mestre; tirar quem não está pendente falha com `party_cannot_vote`.
- [ ] **Passo 2:** `npm run test:integration -- party-gm-claims`. Esperado: FALHA.
- [ ] **Passo 3: migração:**
  - `party_gm_claims (party_id PK, candidate_id, created_at, FOREIGN KEY (party_id, candidate_id) REFERENCES party_members ON DELETE CASCADE)`;
  - `party_gm_claim_votes (party_id REFERENCES party_gm_claims ON DELETE CASCADE, user_id, created_at, PK (party_id, user_id), FOREIGN KEY (party_id, user_id) REFERENCES party_members ON DELETE CASCADE)`. Só aceitações viram linha: recusa apaga o pedido;
  - RLS ligado, sem política, sem grant para `authenticated`;
  - `private.settle_party_gm_claim(p_party_id uuid) RETURNS text`: chamar com a linha de `parties` bloqueada (`SELECT ... FOR UPDATE`, em todas as funções que votam, pedem ou removem). Sem pendentes: se o candidato tem 5 mesas, apaga o pedido e devolve `cancelled`; senão, faz **primeiro** `UPDATE parties SET gm_id`, depois apaga o pedido e, por último, a linha do candidato em `party_members`. Essa ordem evita que `after_party_member_removed` apague a mesa;
  - `after_party_member_removed` passa a chamar `settle` se ainda houver mestre nulo e pedido aberto;
  - o `check_party_gm_limit` continua só em `INSERT`: `settle` e `claim` fazem a contagem.
- [ ] **Passo 4:** aplicar, gerar tipos e rodar. Esperado: PASS.
- [ ] **Passo 5: commit** `feat(db): pedido e acordo para virar mestre de uma mesa sem mestre`.

### Tarefa 3: Backend e API das mesas

**Arquivos:**

- Modificar: `src/backend/contexts/parties/domain/repository/party.repo.ts`, `domain/Party.ts`, `domain/PartyView.ts`, `domain/PartyError.ts`, `infrastructure/supabase-party.repository.ts`, `application/PartyContext.ts`, `application/get-party.use-case.ts`, `interfaces/parties.api.ts`, `src/backend/contexts/combat/application/get-encounter.use-case.ts`, `src/backend/contexts/combat/infrastructure/supabase-combat.repository.ts`
- Criar: `src/backend/contexts/parties/application/party-gm-claim.use-cases.ts`, `app/api/parties/[partyId]/gm-claim/route.ts`
- Teste: `application/party-gm-claim.use-cases.unit.test.ts`, `application/get-party.use-case.unit.test.ts`, `app/api/parties/[partyId]/gm-claim/route.unit.test.ts`, `src/backend/contexts/combat/application/get-encounter.use-case.unit.test.ts`

**Interfaces:**

- Consome: as funções da Tarefa 2.
- Produz:
  - `PartyRecord.gmId: string | null`; `PartySummary.gmUsername: string | null`;
  - `PartyView.gmClaim: { candidateId: string; candidateUsername: string | null; createdAt: string; pendingUserIds: string[]; canAskSupport: boolean } | null` e `PartyView.hasGm: boolean`;
  - `canAskSupport` é verdadeiro quando `createdAt` tem 1 dia ou mais;
  - rotas de `/api/parties/[partyId]/gm-claim`: `POST` (pedir), `PATCH { accept: boolean }` (votar) e `DELETE` (desistir), todas com `withAuth`, devolvendo `{ status }`;
  - `PartyErrorCodes`: `HAS_GM`, `WITHOUT_GM`, `CLAIM_EXISTS`, `CLAIM_NOT_FOUND`, `CANNOT_VOTE`, com o mapa de `supabase-party.repository.ts:20` e o `GM_LIMIT` que já existe.

- [ ] **Passo 1: testes que falham:**
  - `GetPartyUseCase`: com `gmId` nulo, o jogador ativo recebe `role: 'player'`, `hasGm: false`, `gm: null`; quem não é ativo recebe `NOT_FOUND`;
  - `canAskSupport`: falso com 23h59 e verdadeiro com 24h, com relógio falso;
  - casos de uso repassam o retorno de cada função e traduzem os erros;
  - rotas: 401 sem sessão, corpo inválido, sucesso;
  - `GetEncounterUseCase` numa mesa sem mestre: um jogador ativo recebe a mesma visão de jogador, sem encontro; `findPartyGm` hoje devolve `null` tanto para "não existe" quanto para "sem mestre", então passa a devolver `{ gmId: string | null } | null`.
- [ ] **Passo 2:** `npm run test:unit -- src/backend/contexts/parties src/backend/contexts/combat app/api/parties`. Esperado: FALHA.
- [ ] **Passo 3:** implementar. Conferir com `tsc` cada comparação com `gmId`: `party?.gmId !== userId` continua negando com `null`. Traduzir as chaves de erro novas em `en` e `pt`.
- [ ] **Passo 4:** `npx tsc --noEmit` e o comando do Passo 2. Esperado: limpo e PASS.
- [ ] **Passo 5: commit** `feat(parties): pedido de mestre nas regras e na API`.

### Tarefa 4: Exclusão de conta no banco e no backend

**Arquivos:**

- Criar: `database/migrations/<ts>_account_deletion.sql`, `src/backend/contexts/users/application/request-account-deletion.use-case.ts`, `.../delete-account.use-case.ts`, `.../get-account-deletion.use-case.ts`, `src/backend/contexts/users/domain/AccountDeletionRepo.ts`, `.../infrastructure/repositories/supabase-account-deletion.repository.ts`, `src/backend/shared/infrastructure/email/templates/AccountDeletion.tsx`, `app/api/profile/deletion-request/route.ts`, `app/api/account/delete/route.ts`
- Modificar: `src/backend/shared/domain/EmailService.ts`, `.../services/resend-email-service.ts`, `.../services/supabase-email-service.ts`, `src/backend/contexts/users/domain/AuthRepository.ts`, `.../supabase-auth-repository.ts`, `domain/UserError.ts`, `src/backend/contexts/users/index.ts`, `src/backend/contexts/users/interfaces/users.schemas.ts`
- Teste: `.../account-deletion.integration.test.ts`, unit de cada caso de uso e rota

**Interfaces:**

- Produz:
  - `account_deletion_requests (user_id PK REFERENCES auth.users ON DELETE CASCADE, token_hash text UNIQUE NOT NULL, expires_at timestamptz NOT NULL)`: RLS ligado, sem política, só `service_role`;
  - `auth_user_has_password(p_user_id uuid) RETURNS boolean`: só `service_role`, no molde de `auth_user_exists`;
  - gatilho `BEFORE DELETE ON auth.users` que zera `feedback.email` por `user_id` ou por `lower(email)`. **Corrige o design:** tem de ser em `auth.users`, porque o `BEFORE DELETE` de `profile` roda já na cascata, quando a linha de `auth.users` não existe mais e o e-mail não dá para ler. `feedback.email` passa a aceitar `NULL`; `feedback.user_id` continua como está, porque o `ON DELETE SET NULL` limpa o vínculo;
  - `EmailService.sendAccountDeletionEmail(email: string, confirmLink: string): Promise<void>`;
  - `RequestAccountDeletionUseCase.execute({ userId, email, username, password? }, confirmUrl): Promise<void>`;
  - `GetAccountDeletionUseCase.execute(token): Promise<{ username: string | null } | null>`;
  - `DeleteAccountUseCase.execute(token): Promise<void>`;
  - `UserErrorCodes`: `DELETION_USERNAME_MISMATCH`, `DELETION_PASSWORD_INVALID`, `DELETION_LINK_INVALID`;
  - `POST /api/profile/deletion-request` (`withAuth`, `{ username, password? }`), `POST /api/account/delete` (`withHandler`, sem sessão, `{ token }`), que encerra a sessão, se houver.

- [ ] **Passo 1: testes de integração que falham:**
  - excluir apaga conta, personagens e NPCs; a fila de `orphan_avatar_objects` passa a ter as imagens;
  - feedback com `user_id` e outro sem `user_id` com o mesmo e-mail em maiúsculas: os dois ficam com `user_id` e `email` nulos e `message` igual; feedback de outra pessoa não muda;
  - `auth_user_has_password`: verdadeiro com senha, falso para usuário criado sem senha; `authenticated` não executa;
  - `authenticated` não lê `account_deletion_requests`.
- [ ] **Passo 2: testes unit que falham:**
  - pedir: username errado (comparação exata) → `DELETION_USERNAME_MISMATCH`, sem e-mail; conta com senha sem `password` ou com a errada → `DELETION_PASSWORD_INVALID`, sem e-mail; **conta com senha não aceita pular a senha mandando o campo vazio**; conta sem senha manda o e-mail sem conferir senha;
  - o token tem 32 bytes aleatórios, só o `sha256` vai para o repositório, com validade de 1 hora; pedir de novo substitui e o link anterior deixa de valer;
  - **abrir o link não apaga:** `GetAccountDeletionUseCase` só lê; devolve `null` para vencido, usado ou substituído;
  - `DeleteAccountUseCase`: consome o token de uma vez (`DELETE ... RETURNING` com validade), depois chama `deleteUser`; token inválido → `DELETION_LINK_INVALID`, sem `deleteUser`; dois cliques seguidos: só um apaga;
    - Nota: foi construído mantendo o token até a cascata removê-lo, então uma exclusão que falha mantém o link funcionando.
  - a conferência da senha usa cliente sem cookies e não troca a sessão;
  - `POST /api/account/delete` responde sem exigir sessão e encerra a sessão quando existe;
  - **sessão antiga:** com a conta excluída, `withAuth` responde 401 mesmo com um JWT ainda válido, e a página protegida redireciona para o login. Se hoje não for assim, corrigir em `get-session-user.use-case.ts`.
- [ ] **Passo 3:** rodar os dois. Esperado: FALHA.
- [ ] **Passo 4:** migração, aplicar e gerar tipos. Implementar. Cliente sem cookies: criar por `SupabaseFactory.createAnon()` com `persistSession: false` se preciso, e encerrar a sessão criada só nele, com `signOut({ scope: 'local' })`. `AccountDeletion.tsx` segue `PasswordReset.tsx`. Link: `<origin>/<locale>/delete-account?token=<token>`.
- [ ] **Passo 5:** rodar tudo e `npx tsc --noEmit`. Esperado: PASS.
- [ ] **Passo 6: commit** `feat(users): exclusão de conta com senha e confirmação por e-mail`.

### Tarefa 5: Telas da exclusão

**Arquivos:**

- Criar: `src/frontend/components/profile/DeleteAccountCard.tsx`, `src/frontend/components/profile/ConfirmAccountDeletion.tsx`, `app/[locale]/(public)/delete-account/page.tsx`
- Modificar: `app/[locale]/(app)/(dashboard)/settings/profile/page.tsx`, `app/[locale]/(public)/page.tsx` ou o componente de aviso, `messages/en.json`, `messages/pt.json`, `proxy.ts` (se a rota pública exigir)
- Teste: `DeleteAccountCard.unit.test.tsx`, `ConfirmAccountDeletion.unit.test.tsx`, `e2e/delete-account.spec.ts`

**Interfaces:**

- Consome: rotas e `GetAccountDeletionUseCase` da Tarefa 4; `useParties` para as mesas.
- Produz: `GET /api/profile` passa a informar `hasPassword: boolean`, sem expor nada mais do `auth.users`.

- [ ] **Passo 1: testes que falham:**
  - card "Zona de perigo": lista o que será apagado, as mesas de que é mestre que ficam sem mestre (com jogadores ativos) e as que serão apagadas (sem jogadores ativos); e as mesas sem mestre em que a pessoa é a última jogadora, que também serão apagadas;
  - campo de senha aparece só com `hasPassword`; botão desativado até o username bater;
  - depois de enviar, mostra "confira seu e-mail" e permite pedir de novo; erro de senha aparece no campo;
  - `ConfirmAccountDeletion`: mostra o username e o botão; `null` mostra link inválido ou vencido; o clique chama a rota e vai para a página inicial com o aviso `accountDeleted`;
  - e2e: cadastro, pedir com senha, ler o e-mail no Mailpit (como `signup.spec.ts`), abrir, confirmar, cair na página inicial, login falha. Mesmo fluxo para quem não tem senha, se houver helper de link mágico.
- [ ] **Passo 2:** rodar os unit. Esperado: FALHA.
- [ ] **Passo 3:** implementar com `AlertDialog` e o padrão visual de excluir personagem (`deleteConfirmInstruction`). A página usa `robots: noindex` e `searchParams`, então é dinâmica: não entra no pré-render das páginas estáticas.
- [ ] **Passo 4:** rodar unit e `npm run test:e2e -- delete-account`. Esperado: PASS.
- [ ] **Passo 5: commit** `feat(profile): zona de perigo e página de confirmação da exclusão`.

### Tarefa 6: Telas da mesa sem mestre

**Arquivos:**

- Criar: `src/frontend/components/party/PartyGmClaim.tsx`
- Modificar: `src/frontend/components/party/PartyPage.tsx`, `PartyList.tsx`, `PartyRoster.tsx`, `JoinPartyCard.tsx`, `src/frontend/hooks/useParty.ts`, `src/frontend/components/feedback/ContactCard.tsx`, `ContactForm.tsx`, `app/[locale]/(public)/support/page.tsx`, `messages/en.json`, `messages/pt.json`, `e2e/parties.spec.ts`
- Teste: `PartyGmClaim.unit.test.tsx`, `PartyList.unit.test.tsx`, `JoinPartyCard.unit.test.tsx`, `ContactForm.unit.test.tsx`

**Interfaces:**

- Consome: `PartyView.hasGm`, `PartyView.gmClaim` e as rotas da Tarefa 3.
- Produz: `/support?party=<id>` preenche o tipo `account` e a mensagem com o ID da mesa, pronta para editar. `party` é validado como UUID; outro valor é ignorado.

- [ ] **Passo 1: testes que falham** de `PartyGmClaim`:
  - sem pedido: botão **Quero ser mestre**, com o aviso de que os outros precisam concordar e de que o mestre lê as fichas;
  - com 5 mesas: o botão desativado com o motivo (`gmPartyCount` de `useParties`);
  - candidato vê quem falta e **Desistir**; quem falta vê **Aceitar** e **Recusar**, com o aviso sobre a ficha; quem já aceitou vê que aceitou;
  - **Pedir ajuda ao suporte** desativado com `canAskSupport` falso e ativo com verdadeiro, levando para `/support?party=<id>`;
  - depois de virar mestre, a página troca para a visão de mestre sem recarregar (invalida a query).
- [ ] **Passo 2:** outros testes que falham: `PartyList` mostra "Sem mestre"; `JoinPartyCard` com mesa sem mestre avisa e não oferece entrar; `ContactForm` usa o valor inicial e ignora `party` inválido.
- [ ] **Passo 3:** rodar. Esperado: FALHA.
- [ ] **Passo 4:** implementar. Na página sem mestre, mostrar `PartyGmClaim` e esconder o que depende de mestre. **Aviso de saída:** `PartyRoster` (ou onde estiver "Sair da mesa") avisa, numa mesa sem mestre com a pessoa como último jogador, que a mesa será apagada.
- [ ] **Passo 5: e2e** em `parties.spec.ts`: mestre com combate aberto e dois jogadores; excluir o mestre pelo admin; a página abre para os jogadores, sem combate; um pede, o outro aceita, o primeiro vira mestre e vê o painel de mestre.
- [ ] **Passo 6:** rodar unit e `npm run test:e2e -- parties`. Esperado: PASS.
- [ ] **Passo 7: commit** `feat(parties): mesa sem mestre e pedido na página da mesa`.

### Tarefa 7: Política, procedimento do suporte e páginas públicas

**Arquivos:**

- Criar: `docs/suporte/mesa-sem-mestre.md`
- Modificar: `messages/en.json`, `messages/pt.json`, `app/[locale]/(public)/privacy/page.tsx` (se os novos parágrafos precisarem de marcação), `README.md` (se citar a exclusão), `database/db-test` só se precisar
- Teste: `app/[locale]/(public)/privacy/*.unit.test.tsx`, se existir; senão, `e2e/static-pages.spec.ts`

- [ ] **Passo 1:** nas seções 3, 4 e 6, aplicar o texto da seção "Política de Privacidade" do design, em `pt` e `en`. Atualizar `privacy.lastUpdated`. Adicionar o trecho sobre feedbacks, com este sentido: "Removemos seu e-mail e o vínculo com a conta dos feedbacks; o texto permanece e pode conter o que você escreveu nele. Cópias enviadas ao suporte pelo Discord são apagadas se você pedir." Não prometer anonimato total. Trocar "Discord" por "formulário de suporte ou Discord" onde a política manda fazer pedidos.
- [ ] **Passo 2:** `grep -n -iE "em desenvolvimento|under development|ao utilizar|by using" messages/pt.json messages/en.json`. Esperado: nada sobre a exclusão ou a transferência. Conferir também os Termos.
- [ ] **Passo 3:** escrever `docs/suporte/mesa-sem-mestre.md`, sem dados de ninguém: conferir o pedido com `support_party_gm_claim`, escrever ao jogador, esperar 7 dias e, sem resposta, chamar `support_remove_unresponsive_member`; o que dizer ao jogador; recusa não é caso de suporte; pedido de apagar feedback: buscar o e-mail no canal do Discord, apagar as mensagens encontradas e apagar o texto no banco.
- [ ] **Passo 4:** `npm run test:unit` e `npm run test:e2e -- static-pages`. Esperado: PASS.
- [ ] **Passo 5: commit** `docs(privacidade): exclusão de conta, mesa sem mestre e transferência internacional`.

### Tarefa 8: Scan de segurança das mesas

Sem código novo, a não ser correções. **É a controladora quem despacha:** um agente novo, sem contexto desta implementação.

- [ ] **Passo 1:** escopo: todas as migrações e o código de `parties`, `combat`, inventário da party, diário, imagem da mesa e convite, mais tudo desta branch (exclusão e token). Foco: acesso cruzado entre mestre, jogador, convidado, ex-membro e estranho; `SECURITY DEFINER`; canal em tempo real; leitura de ficha; mesa sem mestre; uso indevido do token, do e-mail e do `service_role`; rota sem sessão.
- [ ] **Passo 2:** o relatório vai para `CLAUDE-SECURITY-20261104/`, com um `.gitignore` de `*`. **O repositório é público: nada de achado aberto em commit, PR ou issue pública antes da correção.**
- [ ] **Passo 3:** cada achado alto ou médio confirmado vira teste que falha e correção, com commit próprio. Baixos: listar para a Rebeca decidir, como issue depois do merge, sem detalhe explorável.
- [ ] **Passo 4:** rodar `npm run test:integration` e `npm run test:unit`. Esperado: PASS.

### Tarefa 9: Fechar

**Arquivos:**

- Modificar: `docs/plans/2026-10-20-roadmap.md`, `docs/plans/2026-11-03-exclusao-de-conta.md`, `docs/plans/2026-10-15-party-e-notas.md`

- [ ] **Passo 1:** conferir no app com `next dev`, em desktop e celular: zona de perigo, página de confirmação, mesa sem mestre com pedido. Screenshots e axe (`e2e/a11y.spec.ts` com as páginas novas).
- [ ] **Passo 2:** os passos da CI, nesta ordem: `npx tsc --noEmit`, `npm run lint`, `npm run knip`, `npm run test:coverage`, `npm run test:integration`, `npx playwright test`, `npm run test:visual`. Mudança de visual intencional: `npm run test:visual -- --update-snapshots=all`. Esperado: tudo verde.
- [ ] **Passo 3:** `/code-review` da branch; corrigir o que for confirmado.
- [ ] **Passo 4:** roadmap com a linha nova e o estado; status do design; issue da feature.
- [ ] **Passo 5:** push e PR com descrição em português e inglês, avisando que há migração que vai para produção no merge e citando o que a revisão jurídica ainda precisa olhar. A Rebeca faz o merge.
