# Limites de uso por conta

**Data:** 2026-10-15
**Status:** planejamento, nada implementado.

O objetivo é limitar o uso por conta desde já (ex.: até 10 personagens, 4 parties) para conter o
custo de banco e de imagens, e deixar o terreno pronto para um dia existir um plano premium,
**sem criar planos pagos agora**.

**Princípio:** falar em "limites da conta", não em "plano pago". Hoje existe um único nível
(`free`) e um `unlimited` para a dona do projeto e testers. Cobrar no futuro = criar outro nível e
trocar quem está nele; o resto do app não muda.

**Decisões já tomadas**

- Quem já passou de um limite quando ele entrar **mantém tudo**: pode ver, editar e excluir, só não
  cria mais até voltar abaixo do limite. Nada é apagado nem travado.
- Além de personagens e parties, limitar também **imagens**, **membros por party**, **notas de
  sessão** e **homebrew**.
- O projeto é open source: quem hospedar a própria instância escolhe o nível padrão (variável de
  ambiente), e o normal ali é `unlimited`. Os limites existem para a instância pública.

## O que o código de hoje muda no plano

- **Dá para inserir direto no banco.** A chave publicável do Supabase vai para o navegador
  (`lib/supabase-browser.ts`) e `characters` tem a política `characters_insert_owner`. Um usuário
  logado consegue criar personagem sem passar pela API, então **o limite precisa valer no banco**,
  não só no caso de uso.
- **Criar e editar usam o mesmo `upsert`** (`SupabaseCharacterRepository.save`). No Postgres,
  `INSERT … ON CONFLICT` dispara os triggers `BEFORE INSERT` mesmo quando vira update: um trigger
  de contagem ingênuo bloquearia _editar_ personagem de quem está no limite.
- **O nível não pode ficar no `profile`.** `profile` tem `profile_update_own`, então o usuário
  conseguiria se dar premium. O nível fica numa tabela sem política de escrita para o usuário.
- **Avatars nunca são apagados.** `UploadCharacterAvatarUseCase` grava cada upload com uma versão
  nova e mantém a anterior para sempre. O limite de 2 MB e os tipos permitidos só valem no caso de
  uso; o bucket `avatars` aceita upload direto do navegador na pasta do usuário, sem
  `file_size_limit`.
- **Excluir é soft delete** (`deleted_at`): as linhas continuam no banco.
- **Erros:** `AppError` tem `kind` (`validation` | `not_found` | `forbidden`) e `errorToHttp`
  (`shared/http/error-response.ts`) converte para status HTTP.

## Modelo de dados

- **`usage_tiers`**: `id` (`free`, `unlimited`, no futuro `premium`) e uma coluna por limite;
  `NULL` = sem limite. Leitura liberada, escrita só para admin.
  - `max_characters`, `max_parties_owned`, `max_party_memberships`, `max_party_members`,
    `max_storage_bytes`, `max_notes_per_party`, `max_note_chars`, `max_homebrew_entries` (homebrew de qualquer tipo; ver `2026-10-15-conteudo-e-homebrew.md`).
- **`user_entitlements`**: `user_id`, `tier_id`, `overrides` (jsonb, exceções por pessoa),
  `source` (`default` | `manual` | no futuro `stripe`), `valid_until`. Sem política de escrita para
  `authenticated`; só service role/admin. Sem linha = nível padrão da instância.
- **`get_user_limits(uid)`**: função que junta o nível com os overrides. Usada pelos triggers e
  pela API, para a regra existir num lugar só.

### Valores iniciais (a calibrar)

| Limite                            | `free` |
| --------------------------------- | ------ |
| Personagens                       | 10     |
| Parties criadas                   | 4      |
| Parties em que participa          | 10     |
| Membros por party                 | 8      |
| Espaço de imagens por conta       | 25 MB  |
| Tamanho por imagem                | 2 MB   |
| Notas por party                   | 200    |
| Caracteres por nota               | 20 mil |
| Entradas homebrew (qualquer tipo) | 50     |

Ajustar depois de medir o uso real (tamanho médio de `system_data`, imagens por conta).

## Onde o limite vale (duas camadas)

- **Banco, fonte da verdade.** Trigger `BEFORE INSERT` em `characters` que:
  - conta as linhas do dono com `deleted_at IS NULL` e compara com `get_user_limits`;
  - usa `pg_advisory_xact_lock` por dono, para dois "criar" ao mesmo tempo não passarem juntos;
  - ignora quando o `id` já existe (proteção extra para o `upsert`);
  - levanta erro com código próprio.
    Mesmo padrão nas tabelas futuras: `parties`, `party_members`, `session_notes`, homebrew.
- **Repositório.** Separar `save` em inserir (criar) e atualizar (editar), em vez de `upsert`
  para tudo. Editar nunca passa pelo caminho de inserção.
- **Caso de uso, para a mensagem ser boa.** `CreateCharacterUseCase` consulta limite e contagem
  antes de salvar e lança `CharacterError` com `character_error_limit_reached`.
  - Novo `AppErrorKind` `limit_reached`, mapeado em `errorToHttp` (403 com o código).
  - Tradução em `messages/pt.json` e `en.json`.
  - O erro vindo do trigger também vira esse código no repositório.
- **Onde fica o código:** contexto novo `src/backend/contexts/entitlements` (domínio
  `UsageLimits`, repositório Supabase e em memória para os testes), no mesmo formato de
  `characters` e `users`.

## Imagens (o custo que mais cresce)

- Configurar o bucket `avatars` com `file_size_limit` (2 MB) e `allowed_mime_types`, para o limite
  valer também no upload direto.
- Apagar a versão anterior do avatar quando a URL nova for salva, e um job de limpeza para
  arquivos que nenhum `characters.avatar_url` ou `profile.avatar_url` usa.
- Reduzir a imagem no navegador antes de enviar (ex.: 512 px, WebP): cada avatar cai para
  dezenas de KB.
- No caso de uso de upload, somar `storage.objects.metadata->size` da pasta do usuário para
  aplicar `max_storage_bytes`.

## Soft delete

Excluir libera a vaga (a contagem só vê `deleted_at IS NULL`). Um job apaga de vez depois de 30
dias, junto com as imagens, para o banco não crescer com lixo.

## Interface

- `GET /api/me/usage` → `{ characters: { used, limit }, parties: { … }, storage: { … } }`.
- Lista de personagens: "3 de 10 personagens". No limite, "Novo personagem" fica desabilitado com
  a explicação.
- Perfil: seção "Uso da conta".
- Tom neutro ("limite atual da conta"), sem tela de venda enquanto não existir plano pago.

## Futuro (fora do escopo)

A cobrança (Stripe ou similar) só escreve em `user_entitlements` (`source = 'stripe'`,
`valid_until`) por webhook. Downgrade segue a mesma regra de quem já passou do limite: mantém
tudo, só não cria mais.

## Testes

- **Unit:** `CreateCharacterUseCase` com repositório em memória e limites falsos (abaixo do
  limite, no limite, `unlimited`, override).
- **Integração** (padrão de `rls.integration.test.ts`):
  - o 11º insert é bloqueado;
  - editar personagem com 10 funciona;
  - insert direto pelo cliente com a chave publicável é bloqueado;
  - o usuário não consegue alterar `user_entitlements`;
  - dois creates simultâneos com 9 personagens: só um passa;
  - upload acima de 2 MB direto no bucket é recusado.
- **E2E:** botão desabilitado e mensagem no limite.

## Perguntas em aberto

- O limite de parties conta as criadas, as que participa, ou as duas (proposta: as duas, com
  valores diferentes)?
- O que vê quem tenta entrar numa party cheia?
- Valores finais, depois de medir.

## Ordem sugerida

1. Tabelas `usage_tiers` e `user_entitlements` + `get_user_limits`.
2. Separar inserir/atualizar no repositório de personagens.
3. Limite de personagens: trigger, caso de uso e erro traduzido.
4. Bucket com limites, limpeza de avatars antigos e compressão no navegador.
5. `/api/me/usage` e interface.
6. Purga do soft delete.
7. Limites de party, notas e homebrew junto com essas features.
