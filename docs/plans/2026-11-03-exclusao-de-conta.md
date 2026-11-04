# Exclusão de conta

**Data:** 2026-11-03
**Status:** design para revisão. O plano de implementação vem depois.

## Por que

A Política de Privacidade diz que a exclusão automática "está em desenvolvimento", mas não havia
código, issue nem item no roadmap. Hoje a pessoa precisa pedir pelo Discord e esperar até 5 dias
úteis. Esta feature cumpre o que a política promete e acerta o texto da política.

O problema difícil é a mesa: `parties.gm_id` tem `ON DELETE CASCADE`, então excluir a conta de um
mestre apaga a mesa, o baú e o diário de todos os jogadores. Isso já acontece numa exclusão manual.

## Objetivos

- A própria pessoa exclui a conta, na hora e sem volta, nas configurações do perfil.
- A mesa sobrevive ao mestre, e os jogadores podem escolher um novo mestre entre eles.
- Ler a ficha dos colegas só com o acordo deles: ninguém vira mestre sozinho numa mesa com outros
  jogadores.
- A política passa a descrever o que o app faz.

## Fora de escopo

- **Exportação de dados em JSON:** decisão da Rebeca, fica para depois. Quem quiser uma cópia pede
  pelo suporte.
- Prazo de arrependimento: apaga na hora, para ser simples por enquanto.
- Mestre transferir a mesa em vida (só quando a conta some). Tela de administração para o suporte.
- Aviso por e-mail ou Discord aos jogadores: o pedido aparece na página da mesa.
- Exclusão automática por inatividade (24 meses): a política só reserva o direito.

## O que não pode acontecer

- Uma conta real, inclusive do suporte, ganhar leitura das fichas de uma mesa abandonada.
- Conta falsa de sistema como mestre genérico: o mestre fica vazio (`NULL`). As políticas comparam
  `gm_id` com `auth.uid()`, e vazio nunca é igual a ninguém.
- Um jogador perder a própria ficha porque o mestre saiu.

## Excluir a conta

**Tela:** seção "Zona de perigo" em `/settings/profile`. Antes de confirmar, mostra o que será
apagado (personagens, NPCs e imagens) e a lista das mesas que ficam sem mestre ou que serão apagadas.

**Confirmação em duas etapas, quase um último login:**

1. **No app:** a pessoa digita o username e a senha. O servidor confere os dois e envia o e-mail. A
   senha é conferida com um cliente sem cookies, para não mexer na sessão atual. Nada é apagado aqui.
2. **No e-mail:** um link de uso único, válido por 1 hora, abre uma página que mostra a conta e o
   botão final de excluir. A exclusão só roda nesse botão (`POST`), nunca ao abrir o link, porque
   antivírus e leitores de e-mail costumam abrir links sozinhos. O link funciona mesmo sem sessão,
   já que muita gente abre o e-mail no celular. Depois do botão, apaga na hora e sem volta.

**Quem não tem senha** (entrou só com Google): digita o username e confirma pelo
e-mail. O servidor descobre isso sozinho, com uma função só para `service_role` que lê
`auth.users.encrypted_password`. Não pode ser um "não tenho senha" na tela, porque qualquer um com a
sessão aberta escolheria essa opção.

**Quem entrou por link mágico** antes de 2026-10-20 tem uma senha aleatória que nunca viu, porque o
Supabase a cria sozinho e ela não se distingue de uma senha real. Essa pessoa passa pela etapa de
senha, e a tela e o erro levam a "Esqueci minha senha". Não há atalho "não sei minha senha".

**Limites:** 60 segundos entre e-mails e 5 senhas erradas em 15 minutos, por conta.

**Pedir de novo:** um novo envio invalida o link anterior. Sair da conta não cancela o pedido, e o
link vence sozinho.

**Servidor:** o token fica só como hash, numa tabela sem acesso para `authenticated`, e sai com a
conta. O envio usa o `EmailService` e o Resend, como os outros e-mails. O passo final chama
`auth.admin.deleteUser` com `SupabaseFactory.createAdmin()`, e o restante acontece no banco por
cascata. Depois encerra a sessão, se houver, e a pessoa volta para a página inicial com um aviso.

**O que acontece com os dados:**

| Dado                                    | Destino                                           |
| --------------------------------------- | ------------------------------------------------- |
| Login e perfil                          | Apagados                                          |
| Personagens e NPCs, com o que têm       | Apagados (já é cascata); saem das mesas           |
| Imagens no bucket `avatars`             | Viram órfãs; o job diário `cleanup-avatars` apaga |
| Mesas como mestre, com jogadores ativos | Ficam sem mestre (abaixo)                         |
| Mesas como mestre, sem jogadores ativos | Apagadas                                          |
| Participação em mesas de outros         | Apagada; pedido pendente é reavaliado (abaixo)    |
| Itens já colocados no baú da party      | Ficam: são da mesa                                |
| Feedbacks da conta                      | Ficam só com o texto, o tipo e a data (abaixo)    |

**Feedbacks:** o que importa é o texto, então ele fica, sem e-mail e sem vínculo com a conta. O
`ON DELETE SET NULL` de `feedback.user_id` já limpa o vínculo. A coluna `email` passa a aceitar `NULL`,
e um gatilho `BEFORE DELETE` em `auth.users` limpa o e-mail pelo `user_id` e pelo próprio e-mail, porque
quem envia sem estar logado não fica com `user_id`. Assim vale também para uma exclusão manual. O ID
não fica: o suporte já tem a cópia no Discord, e depois da exclusão ele não aponta para nenhuma conta.

**A política não promete anonimato total.** O texto pode ter dados pessoais que a própria pessoa
escreveu, e a cópia no Discord continua existindo até ser apagada. Quem pedir, o suporte busca o
e-mail no canal e apaga as mensagens, além do texto no banco.

As mensagens de suporte já enviadas ao Discord não são apagadas automaticamente. A política diz isso.

## Mesa sem mestre

**Banco:** `parties.gm_id` passa a aceitar `NULL`, com `ON DELETE SET NULL`. Um gatilho, quando
`gm_id` vira `NULL`:

- apaga a mesa se não houver membro `active`;
- senão, limpa `image_url` (o arquivo está na pasta de quem saiu e vira órfão) e apaga o `encounters`
  da mesa, porque os NPCs do combate foram embora.

**Precisa mudar por causa do `NULL`** (lista inicial; o plano confere cada uso de `gm_id`):

- Os `JOIN public.profile AS gm ON gm.id = p.gm_id` de `party_functions` escondem a mesa sem mestre:
  viram `LEFT JOIN`, ou a linha do mestre sai da lista de membros.
- `PartySummary.gmId` e parecidos no TypeScript passam a aceitar `null`.
- Os casos de uso comparam `party?.gmId !== userId`: com `null`, continuam negando. Conferir com
  teste, inclusive `findPartyGm`, que devolve `null` para "mesa não existe".
- `request_party_join`: recusa entrada enquanto não houver mestre, pois ninguém aprovaria. O acordo
  também fica estável, sem jogador novo no meio.
- Limite de 5 mesas por mestre: o gatilho só roda em `INSERT` e precisa valer ao assumir (abaixo).

**Enquanto estiver sem mestre:** jogadores ativos continuam lendo e usando a mesa, os personagens,
o baú e o diário. Combate, convites, configurações e aprovação de pedidos ficam parados. Pedidos de
entrada e convites pendentes continuam guardados, à espera do novo mestre.

**Último jogador:** se o último jogador ativo de uma mesa sem mestre sair ou excluir a conta, a mesa
é apagada, com o baú e o diário, porque ninguém mais conseguiria acessá-la. Sair da mesa e a tela de
exclusão de conta avisam disso antes.

**Diário:** o link continua na mesa, mas o documento é do Google, na conta de quem criou. Se essa
pessoa fechar o compartilhamento, o novo mestre troca o link.

## Virar o novo mestre

1. Um jogador ativo clica em **Quero ser mestre** na página da mesa. Isso cria um pedido. Só existe
   um por mesa.
2. A página mostra o pedido aos outros jogadores ativos, com **Aceitar** e **Recusar**, avisando que
   o novo mestre vai ler a ficha completa dos personagens.
3. Com o acordo de **todos**, a pessoa vira mestre. Uma recusa cancela o pedido, e qualquer jogador
   pode pedir de novo.
4. Numa mesa com um único jogador ativo, ele vira mestre na hora.

**Reavaliação:** se um jogador sai, é excluído ou era a única pendência, o pedido é conferido de
novo e pode ser aprovado. Se quem pediu sai, o pedido é cancelado.

**Ao virar mestre:** `gm_id` passa a ser o da pessoa, e ela deixa `party_members`, porque o mestre
não é linha nessa tabela. Os personagens dela saem da mesa, sem perder a ficha, como acontece com
qualquer personagem que sai. Quem já é mestre de 5 mesas não consegue assumir: o botão fica desativado, com o motivo. A conta também é conferida na aprovação, porque a pessoa pode ter criado mesas nesse meio-tempo; nesse caso, o pedido é cancelado. Um jogador único nessa situação continua sem poder assumir até sair de uma das mesas dele.

**Banco:** tabelas `party_gm_claims` (`party_id` PK, `candidate_id`, `created_at`) e
`party_gm_claim_votes` (`party_id`, `user_id`, `created_at`), sem escrita direta para
`authenticated`. Tudo passa por funções `SECURITY DEFINER`, no padrão das outras funções de mesa, e
as transições precisam de bloqueio para dois votos simultâneos não se perderem.

## Quando alguém não responde

Depois de **1 dia** com um pedido aberto, o botão fica ativo para os jogadores da mesa: **Pedir ajuda ao
suporte**. Ele abre o formulário de contato (`/support`), que já envia ao Discord, com o tipo, a
mesa e o pedido já preenchidos.

Nada impede o jogador de falar com o suporte antes disso; o botão só facilita.

**Antes de tirar alguém**, o suporte escreve para o e-mail do jogador que não respondeu e dá **7 dias**
para ele responder ao pedido na mesa. Sem resposta, tira. Um dia é pouco para perder o lugar numa mesa
que joga uma vez por semana.

O suporte confere e resolve à mão: **tira da mesa o jogador que não responde**. Os personagens dele
saem da mesa (`drop_party_characters_of_member` já faz isso), a ficha continua com ele, e o pedido é
reavaliado pelas regras normais. Assim o novo mestre nunca lê uma ficha sem o acordo do dono. Se
quiser voltar, o jogador pede para entrar de novo pelo link.

Uma função só para `service_role` faz essa retirada e devolve quem falta responder, para ninguém
precisar editar tabelas. O suporte não vira mestre nem lê as fichas.

**Recusa não vai para o suporte.** O botão serve só para quem não responde. Quem recusa está fazendo
uma escolha, e o suporte não decide entre jogadores. A mesa pode ficar sem mestre enquanto houver
recusa: mesa, baú e diário continuam funcionando, só faltam as funções de mestre, e o grupo pode
criar outra mesa.

## Política de Privacidade

Em `en` e `pt`; `es` e `sv` seguem pelo Crowdin. Atualiza a data. **Esta redação é uma proposta e
não substitui revisão jurídica.**

- **Seção 4, Seus Direitos:** troca "enquanto a funcionalidade está em desenvolvimento" por:
  "Você pode excluir sua conta a qualquer momento em Configurações > Perfil, confirmando por e-mail.
  Depois da confirmação, a exclusão é imediata e não pode ser desfeita. Para os demais direitos, ou se não conseguir excluir por lá, fale conosco
  pelo [formulário de suporte] ou pelo [Discord]; respondemos em até 5 dias úteis."
- **Seção 4, o que acontece ao excluir:** novo trecho. Dados apagados; imagens saem em até 2 dias;
  removemos seu e-mail e o vínculo com a conta dos feedbacks, e o texto permanece e pode conter o que você escreveu nele; cópias enviadas ao suporte pelo Discord são apagadas se você pedir; o
  que você colocou no baú e o link do diário ficam com a mesa; mesa com jogadores fica sem mestre.
- **Seção 6, Transferência Internacional:** tira "ao utilizar, você consente". Passa a dizer que a
  transferência é necessária para prestar o serviço que você pediu (LGPD, art. 33, IX, combinado com
  o art. 7º, V) e lista também Cloudflare e Google, que a seção 3 já cita.
- **Seção 3, Compartilhamento:** novo trecho: numa mesa sem mestre, um jogador pode virar mestre com
  o acordo dos demais e passa a ver as fichas dos personagens da mesa. Quem não responde a um pedido
  pode ser retirado da mesa pelo suporte, e os personagens dessa pessoa saem junto.

A idade mínima de 13 anos fica para a revisão jurídica e não muda aqui. A revisão jurídica não
bloqueia o merge (decisão da Rebeca): tudo vai em um PR só, e a revisão vem depois.

## Testes

- **RLS e funções (integração):** cada papel numa mesa sem mestre; ninguém lê ficha por `gm_id`
  vazio; pedido, votos, recusa, jogador único, limite de 5, votos simultâneos e reavaliação.
- **Exclusão (integração):** conta de mestre com e sem jogadores; conta de jogador com pedido
  pendente; feedbacks; o job de órfãos pega as imagens.
- **Rotas (unit):** sem sessão, username errado, senha errada, sem senha, token vencido, usado ou substituído, abrir o link não apaga, e sucesso.
- **Tela (e2e):** pedir, abrir o link do e-mail, excluir e voltar à página inicial; pedido e acordo com duas contas.

## Para quem constrói

- Nome e formato das funções, das telas e dos textos dos botões.
- Como expor o "sem mestre" nos tipos e na lista de mesas.
- Como passar a mesa ao formulário de suporte.
- O PR tem migration, e o merge aplica em produção.

## Pronto quer dizer

Decisão da Rebeca: **este PR deixa tudo pronto, sem pendência para outro PR.**

- Exclusão, mesa sem mestre, pedido e acordo, retirada pelo suporte e textos em `en` e `pt`.
- Política e Termos sem nenhuma frase que o app não cumpra, em todos os idiomas publicados.
- Testes da seção acima passando, com `npm run test:unit`, integração, e2e e `tsc`.
- Conferido no app, desktop e celular, com screenshots e axe.
- **Scan de segurança cobrindo todas as mesas, não só o que este PR muda**, com relatório. O que ele
  achar de alto ou médio é corrigido aqui; o resto vira issue.
- `/code-review` feito e corrigido.
- Roadmap, issue da feature e Política de Privacidade atualizados, com o procedimento do suporte
  escrito em um lugar que dê para achar.

## Decisões da Rebeca e chamadas minhas

**Dela:** a mesa continua sem o mestre; um jogador assume com o acordo dos outros; quem não responde
vai para o suporte pelo Discord, que tira a pessoa da mesa; recusa não vai para o suporte; apaga na
hora; sem exportação por enquanto; revisão jurídica não bloqueia; o PR deixa tudo pronto.

**Dela, nesta revisão:** username, senha e confirmação por e-mail; botão de suporte ativo depois de 1
dia; quem tem 5 mesas não assume; feedbacks anonimizados no banco: fica só o texto, sem e-mail nem ID.

**Minhas, para conferir:** `NULL` em vez de ID 0; acordo de **todos**; jogador único vira mestre na
hora; recusa cancela e pode pedir de novo; quem não tem senha confirma só por e-mail; link vale 1 hora e
funciona sem sessão; suporte espera 7 dias antes de tirar alguém; encerrar o combate; apagar mesa sem
jogadores ativos, inclusive quando o último sair depois; bloquear entradas sem mestre; personagens do
novo mestre saem da mesa; itens do baú ficam; texto dos feedbacks fica; base legal da seção 6.
