# Mesas — fase 1: criar mesas, convidar e o modo Role Play

**Data:** 2026-10-28
**Status:** design para revisão (e para a mesa da Rebeca opinar). O plano de implementação vem
depois, neste mesmo arquivo.
**Fase 2:** [`2026-10-28-mesas-fase-2-combate.md`](2026-10-28-mesas-fase-2-combate.md)

## Por quê

Hoje cada pessoa só vê as próprias fichas. Numa sessão, o mestre não tem como olhar a ficha de
ninguém sem perguntar, e as anotações e combinações ficam espalhadas no Discord. A **mesa** junta o
mestre e os jogadores de uma campanha num lugar só. Esta fase entrega a mesa em si e a visão do
mestre para o Role Play; o combate vem na fase 2, e anotações compartilhadas são um projeto depois.

## O que a Rebeca decidiu

- Uma pessoa pode ser **mestre de no máximo 5 mesas**. Como **jogadora, pode entrar em quantas
  quiser**.
- Entrar numa mesa, de dois jeitos:
  - **Link de convite:** o jogador abre o link e **pede para entrar**; o mestre **aprova** (ou
    recusa).
  - **Nome de usuário:** o mestre convida pelo username; o jogador **aceita** (ou recusa). Ninguém
    entra numa mesa sem querer.
- O jogador **leva um ou mais personagens** dele para a mesa, e pode trocar quais depois. O mesmo
  personagem pode estar em mais de uma mesa.
- O mestre pode **tirar** alguém da mesa; o jogador pode **sair** quando quiser.
- **O que cada um vê:**
  - O **mestre** vê a ficha completa de cada personagem da mesa, **só para ler** (não edita).
  - O **jogador** vê dos outros personagens só o básico: **nome, avatar, raça, classe e nível**.
    Nada de PV, atributos, magias, inventário ou lore.
- **Username obrigatório e único** para todo mundo (hoje é único, mas opcional). É por ele que o
  mestre convida.
  - **Cada pessoa escolhe o próprio** na próxima vez que entrar, antes de usar o app. O nome gerado
    automaticamente **nunca aparece para ninguém** (nem é achado na busca do convite).
  - O nome gerado no cadastro deixa de vir do e-mail (hoje é a parte antes do `@` + 5 caracteres do
    id, o que expõe o e-mail e pode ter `.`). Passa a ser **palavras aleatórias + número ou pedaço de
    hash**, só com caracteres válidos (`^[a-z0-9_]+$`), por exemplo `corvo_dourado_4821`.
- **Modo Role Play** (a visão geral do mestre): um card por personagem com raça, classe, nível,
  quem joga, **traço, ideal, vínculo, defeito** e **percepção e intuição passivas**. Clicar no card
  abre a ficha completa, só leitura.

## Objetivos

1. Criar, renomear e apagar uma mesa (só o mestre). Limite de 5 mesas como mestre.
2. Convite por link (pedido + aprovação) e por username (convite + aceite).
3. Escolher, trocar e tirar personagens levados para a mesa.
4. Página da mesa: para o mestre, o modo Role Play; para o jogador, a lista dos personagens da mesa
   com o básico.
5. Ficha só leitura para o mestre, usando a ficha que já existe, sem botões de editar.
6. Mesas aparecem na navegação (sidebar), separadas em "Mestre" e "Jogador".
7. Username obrigatório: toda conta tem um, único, e o banco garante (`NOT NULL` + `UNIQUE`).
   Quem ainda está com o nome gerado é levado a escolher o seu antes de usar o app, e esse nome
   gerado não aparece para ninguém nem entra na busca.

## Não-objetivos

- Combate, iniciativa, turnos e tempo real (fase 2).
- Anotações compartilhadas, chat, rolagem de dados.
- Fichas de inimigo/monstro.
- O mestre editar fichas de jogadores.
- Notificações por e-mail ou push (pedidos e convites aparecem dentro do app).
- Mesas de outros sistemas além de D&D 5e (o modelo guarda o sistema, mas só D&D existe hoje).

## Anti-objetivos (falhou, mesmo que funcione)

- Um jogador conseguir ler PV, atributos, magias ou lore de outro jogador — pela tela **ou pela
  API/banco**. A regra vale no banco (RLS), não só na interface.
- O mestre conseguir **alterar** a ficha de um jogador.
- Alguém virar membro de uma mesa sem a aprovação do mestre (link) ou sem aceitar (username).
- Um link de convite vazado continuar servindo depois que o mestre o trocar.
- Sair da mesa ou ser removido apagar o personagem.

## Restrições

- Next.js 16 (rotas em `app/[locale]/(app)/...`, dinâmicas), Supabase com RLS, TanStack Query.
  Arquitetura do backend em contextos (`src/backend/contexts/*`, use cases + repositórios).
- Migrações vão para produção no merge (`deploy-migrations.yml`).
- Hoje `profile` e `characters` só são legíveis pelo dono (RLS). A fase 1 precisa abrir **leitura**
  com cuidado:
  - O mestre lê a ficha inteira dos personagens **levados** às mesas dele (não de todos os
    personagens do jogador).
  - Colegas de mesa leem só o básico. Como RLS é por linha, isso não pode ser um `SELECT` na tabela
    `characters`: precisa de uma função ou view que devolva só as colunas permitidas.
  - Membros de uma mesa leem o username e o avatar uns dos outros (hoje `profile` só lê o próprio).
- `profile.username` hoje é **opcional** (`UNIQUE`, mínimo 3 caracteres) e é preenchido no cadastro
  pelo trigger `handle_new_user` a partir de `preferred_username` (Google) quando existe. Passar a
  obrigatório exige: cadastro por e-mail e por Google sempre terminarem com um username, e as contas
  atuais sem username ganharem um antes do `NOT NULL`. Unicidade sem diferenciar maiúsculas
  (`lower(username)`), para `Bia` e `bia` não coexistirem.
- Textos novos em `messages/en.json` e `messages/pt.json`.

## Como, nas partes decididas

### Modelo (decisão do Claude)

- `parties`: `id`, `name`, `system`, `gm_id` (→ `profile`), `invite_code` (aleatório, trocável),
  `created_at`.
- `party_members`: `party_id`, `user_id`, `status` (`requested` | `invited` | `active`),
  `created_at`. O mestre **não** é linha aqui (é o `gm_id`).
- `party_characters`: `party_id`, `character_id`. Só personagens do próprio membro ativo.
- O limite de 5 mesas por mestre é garantido no banco (trigger ou checagem no insert), não só no
  app.

### Convites (decisão do Claude)

- Link: `/parties/join/<invite_code>`. Logado, mostra o nome da mesa e o botão "Pedir para entrar"
  (cria `requested`). Deslogado, manda para o login e volta.
- Trocar o código invalida o link antigo.
- Username: o mestre digita; vira `invited`. O jogador vê o convite na lista de mesas, com aceitar e
  recusar.
- Ao virar `active`, o jogador escolhe quais personagens leva.

### Telas (decisão do Claude)

- `/parties`: minhas mesas, separadas em "Como mestre" e "Como jogador", e convites pendentes.
- `/parties/<id>`: o mestre vê o modo Role Play (cards), os pedidos pendentes e a gestão da mesa
  (convidar, trocar link, tirar alguém, renomear, apagar). O jogador vê os personagens da mesa com o
  básico e gerencia os próprios personagens levados.
- Ficha só leitura: a ficha atual reaproveitada com edição desligada, numa rota da mesa.

### Pontos técnicos levantados na revisão

- **Percepção e intuição passivas são calculadas**, não lidas: `system_data.passivePerception` é um
  valor salvo e defasado (padrão 10), e a intuição passiva nem existe no banco. Usar
  `shared/systems/dnd5e/calculations.ts` a partir de atributos, perícias e nível.
- **Raça e classe** ficam no JSONB `system_data`; a função do "básico" extrai de lá.
- **Abrir o RLS não basta:** todo caso de uso de personagem passa por `findOwnedCharacter`, e as
  rotas `/api/characters/[id]/*` exigem ser o dono. A leitura pelo mestre precisa de casos de uso e
  rotas próprios (ficha, lore e magias).
- **Voltar ao link de convite depois do login:** hoje só o callback do Google lê `next`; o login por
  e-mail e o cadastro com confirmação precisam passar a levar a URL de volta.
- **Grants:** a migração `20261020130000_least_privilege_grants.sql` revoga por padrão; toda tabela e
  função nova precisa de `GRANT` explícito.
- **Personagens apagados** (`deleted_at`) ficam fora das mesas, do RLS e das funções.

### Username gerado × escolhido (decisão do Claude)

- O perfil ganha uma marca de "username escolhido" (ex.: `username_chosen boolean`). O trigger de
  cadastro gera o nome aleatório com a marca falsa; salvar o username no perfil liga a marca.
- Contas atuais: uma migração troca os usernames que seguem o padrão gerado a partir do e-mail
  (`lower(prefixo do e-mail + 5 caracteres do id)`) por um nome aleatório e deixa a marca falsa;
  usernames diferentes desse padrão são tratados como escolhidos.
- A busca por username no convite e o que os colegas veem só consideram usernames escolhidos.

### Decisões do Claude na revisão

- **Ficha de inimigo** é um personagem com uma marca (ex.: `characters.kind` = `pc` | `npc`). Fica
  fora de "Meus personagens" e do seletor de personagens a levar para mesas. A coluna nasce nesta
  fase, com todos os atuais `pc`, para o RLS e o seletor já considerarem.
- **O mestre não leva personagem jogável para a própria mesa** (sem DMPC) por enquanto: ele não é
  membro, é o `gm_id`.

## Fica a cargo de quem implementa

- Forma exata das políticas RLS e da função/view do "básico" (com `SECURITY DEFINER` em schema não
  exposto, ou `security_invoker` + colunas restritas), seguindo as práticas de segurança do
  Supabase.
- Como a ficha atual vira só leitura (prop, contexto ou rota) sem duplicar componentes.
- Formato do código de convite e onde mostrar contadores de pendências.
- Ordem das tarefas e testes (unitários, integração de RLS com dono/mestre/colega/estranho, e2e do
  fluxo de convite).
