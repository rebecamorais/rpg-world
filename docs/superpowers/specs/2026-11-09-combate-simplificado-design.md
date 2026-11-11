# Combate simplificado: linhas enxutas, voltar turno e iniciativa do jogador

Continuação do [Projeto 3](2026-11-07-combate-identificacao-e-visibilidade-design.md), já mergeado no PR [#163](https://github.com/rebecamorais/rpg-world/issues/163). O texto vem da conversa de 09/11, que partiu de uma revisão de UX das telas de combate.

Legenda: **(dona)** foi decidido por ela. **(decisão do builder)** é escolha técnica ou de detalhe que não muda o que ela pediu.

## Por quê

A linha do mestre ficou poluída: mesmo fechada, ela mostra campos editáveis, botões de condição, visibilidade, troca de lado, subir, descer e remover. Na tela do jogador, cada avatar tem um botão de ampliar, e quase toda linha repete "JOGADOR" em roxo, o que não ajuda a saber de quem é a vez. Há também coisas que faltam: o jogador não consegue informar a própria iniciativa, não tem um atalho para a ficha a partir do combate, e o mestre não consegue desfazer um "Encerrar turno" apertado sem querer.

Sucesso é o mestre bater o olho na lista e entender o combate, abrindo uma linha só quando precisa mexer nela, e o jogador achar a vez dele e as próprias ações sem procurar.

## Objetivos

1. **(dona)** Linhas fechadas simples e baixas, para o mestre e para o jogador. Toda edição do mestre fica na linha aberta.
2. **(dona)** Personagem de jogador mostra o @ de quem joga com ele, no lugar de "Jogador".
3. **(dona)** O mestre pode voltar o turno.
4. **(dona)** O jogador digita a própria iniciativa a qualquer momento. Ordenar continua sendo ação do mestre.
5. **(dona)** O jogador tem "Ver ficha" na linha do próprio personagem e pode editar a ficha a qualquer momento.
6. **(dona)** Sai o subir e o descer. Empate exato se resolve com "Trocar com".

## Fora do escopo

- **Visão do combate dentro da ficha:** projeto próprio, a planejar depois **(dona)**.
- **Iniciativa com decimal:** recusada para não mudar o banco **(dona)**.
- **Desempate automático pela Destreza:** não entra. Empate exato fica na ordem atual e o mestre decide com "Trocar com" **(decisão do builder, a dona pode pedir)**.
- **Reordenar a lista quando o jogador digita:** não acontece. A lista só muda quando o mestre ordena **(dona)**.
- **Mudar as regras de visibilidade do Projeto 3:** nada muda nelas. Tudo que o jogador recebe continua saindo de `encounter_turns`.

## O que seria um fracasso mesmo funcionando

- O jogador ver a iniciativa dos outros, ou dados de NPC que o Projeto 3 esconde.
- O jogador conseguir mudar a iniciativa de outro personagem, inclusive por chamada direta à API.
- A linha fechada voltar a crescer com botões.
- Voltar o turno deixar o combate num estado impossível: rodada 0 com combate começado, ou a vez com um morto revelado.

## Estado atual (para quem vai construir)

- A linha do mestre é `src/frontend/components/combat/CombatRow.tsx`, com `NpcControls.tsx`, `NpcFateControls.tsx` e `CollapsedDeadRow.tsx`. A linha do jogador é `PlayerTurnRow.tsx`, dentro de `PlayerCombatPanel.tsx`. "Encerrar turno" do mestre e "Ordenar por iniciativa" estão em `GmCombatPanel.tsx`.
- A ordenação é `sortByInitiative` (`src/frontend/lib/initiative-order.ts`): maior primeiro, empate mantém a ordem atual, e quem não tem iniciativa vai para o fim. A ordem é gravada por `set_encounter_order`.
- O turno avança só por `public.end_turn`, que usa `private.next_participant`, e esta pula mortos revelados. Não existe função para voltar.
- O jogador muda as próprias condições por `public.set_participant_conditions` (SECURITY DEFINER, confere o dono). A iniciativa só o mestre muda (`GRANT UPDATE` em `initiative` com RLS de mestre).
- `encounter_turns` não devolve iniciativa nem o @ de ninguém. `profile.username` é obrigatório e único, e `full_name` é opcional.
- Clicar no avatar da ficha já abre o "ver ampliado" (Projeto 2). No combate, um `ViewImageButton` fica por cima da imagem.

## 1. Linha do mestre

### Fechada (só leitura)

- **(dona)** Mostra iniciativa (número, ou "—"), imagem, nome, lado e "Vez atual".
  - Personagem de jogador mostra o @ do dono no lugar de "Jogador".
  - NPC mostra o selo de lado (aliado, neutro ou inimigo).
  - NPC também mostra um selo de estado: oculto, anônimo, caído, morto (não revelado) ou estável. Visível não leva selo. **(decisão do builder: só leva selo o que foge do normal)**
- Também mostra as condições ativas, só os selos.
- Mostra a barra de PV com o número atual e o máximo. A barra é a que existe hoje.
- **Nenhum campo nem botão de edição** na linha fechada. O único controle é o de abrir a linha.
- Clicar em qualquer lugar da linha abre e fecha. Clicar no avatar amplia a imagem.
- Os testes contra a morte do jogador caído, que vêm da ficha, continuam visíveis em texto.
- A linha do turno atual abre sozinha, como hoje.
- O morto revelado continua na linha fina do Projeto 3 e abre ao clicar.

### Aberta (toda edição fica aqui)

Os grupos, nesta ordem **(decisão do builder: a ordem segue o modelo aprovado)**:

1. **Números:** iniciativa, e no NPC também PV e PV temporário, editáveis. CA, percepção passiva e deslocamento.
2. **Caído:** no NPC com 0 PV, `NpcFateControls`, como hoje.
3. **Para os jogadores:** no NPC, visibilidade e lado (`NpcControls`).
4. **Ações:** "Condições", "Abrir ficha" (o mesmo link de hoje), "Trocar com {nome}" (ver seção 3) e "Tirar do combate" (com a confirmação de hoje).
5. **Atributos:** a grade de modificadores de hoje.

Subir e descer saem.

## 2. Linha do jogador

- **(dona)** Linhas baixas. Personagem de jogador mostra o @ do dono. NPC mostra o selo de lado.
- **(dona)** Sai o botão de ampliar de cima do avatar. Clicar no avatar amplia, mas só quando há imagem. Anônimo não amplia.
- **Na linha do próprio personagem:**
  - Campo "Sua iniciativa", editável a qualquer momento: preparando ou em andamento, na vez dele ou não **(dona)**. Aceita só inteiro de -10 a 99, como hoje. Pode ficar vazio (NULL), e `set_my_initiative` aceita NULL. Vale também caído ou na própria vez.
  - "Condições", como hoje.
  - "Ver ficha" **(dona)**: abre a ficha do próprio personagem na página normal de ficha, onde ele edita como sempre.
  - "Encerrar meu turno" passa para dentro da linha, na vez dele. Sai do rodapé do painel **(decisão do builder, aprovada no modelo)**.
- As outras linhas continuam só leitura e sem a iniciativa de ninguém.
- Caído, morto e anônimo continuam como no Projeto 3.

## 3. Ordem e empate

- **(dona)** "Ordenar por iniciativa" continua manual, no painel do mestre.
- Quando o jogador muda a iniciativa, o mestre recebe a mudança pelo tempo real, porque o gatilho de aviso já cobre UPDATE em `encounter_participants`.
- O botão fica em destaque quando a ordem da lista não bate com o que `sortByInitiative` daria, como "Ordenar por iniciativa · ordem mudou". Isso mostra ao mestre que alguém mudou a iniciativa **(decisão do builder, aprovada no modelo)**.
- **(dona)** Sai o subir e o descer.
- "Trocar com {nome}" aparece na linha aberta só quando o vizinho de cima ou de baixo tem exatamente a mesma iniciativa, sem ser nula. Ele troca as duas posições e grava por `set_encounter_order`. Se os dois vizinhos empatam, aparecem os dois botões. Aparece sempre que o vizinho tem a mesma iniciativa, mesmo que o resto da lista esteja fora de ordem **(decisão do builder)**.
- Quem não tem iniciativa vai para o fim ao ordenar, como hoje. Entre si, eles não ganham "Trocar com".

## 4. Voltar turno

- **(dona)** Botão do mestre, ao lado de "Encerrar turno", no topo do painel, só com o combate em andamento (rodada ≥ 1).
- Devolve a vez ao participante anterior na ordem, pulando os mortos revelados, do mesmo jeito que `end_turn` pula ao avançar.
- Se passar do começo da lista, a vez vai para o último e a rodada diminui 1.
- Na rodada 1, com a vez no primeiro participante que pode jogar (o primeiro que não é morto revelado), o botão fica desabilitado e o servidor recusa. Nada, nem o fallback, leva a rodada para baixo de 1. **(decisão do builder)**
- A âncora é a posição do participante atual, mesmo que ele esteja oculto ou acabe de ser revelado morto. Sem participante atual (por exemplo, combate começado e todos removidos), a função recusa com `encounter_not_your_turn`. **(decisão do builder)**
- Se todos os outros estiverem mortos e revelados, vale o mesmo fallback de `next_participant`: nunca trava.
- Depois de voltar, aparece um aviso curto, como "Vez voltou para {nome}". Não pede confirmação, porque "Encerrar turno" desfaz.
- O jogador vê a mudança pelo tempo real, como em qualquer mudança de turno. Se a vez voltar para ele, recebe o aviso "Sua vez!" de hoje, o que é desejado. `end_turn` não faz mais nada além de mudar a vez e a rodada, então voltar desfaz tudo.

## 5. Servidor e segurança

- **Voltar turno:** nova função `public.previous_turn(p_party_id uuid)`, SECURITY DEFINER, só para o mestre (`is_party_gm`), com o mesmo lock de `end_turn`. Usa uma nova `private.previous_participant`, o espelho de `next_participant`. Erros reaproveitam `encounter_not_found` / `encounter_not_your_turn` quando cabem, e um novo `encounter_at_start` na rodada 1 com a vez no primeiro.
- **Iniciativa do jogador:** nova função `public.set_my_initiative(p_party_id uuid, p_participant_id uuid, p_initiative int)`, SECURITY DEFINER, no modelo de `set_participant_conditions`. Ela só aceita a linha `player` cujo personagem é de quem chama e que é membro ativo da mesa, e respeita o CHECK de -10 a 99. Qualquer outra chamada devolve o mesmo erro, sem dizer se a linha existe. O mestre continua mudando qualquer iniciativa pelo caminho de hoje.
- **`encounter_turns` ganha três colunas:**
  - `initiative`: preenchida só onde `is_mine` é verdadeiro, NULL em todas as outras linhas.
  - `character_id`: só onde `is_mine`, para o link "Ver ficha".
  - `owner_username`: só em linhas `player`, NULL em NPC. Segue a regra de `party_people`: o @ só aparece se a pessoa já escolheu o username (`username_chosen`). Se não escolheu, vem NULL e a linha mostra "Jogador" como hoje. **(decisão do builder)**

  Nenhuma regra do Projeto 3 muda.

- **Mestre:** `GmRow` ganha `ownerUsername` (só jogador), com a mesma regra do `username_chosen`. O mestre não lê o `profile` dos outros por RLS (`profile_select_own`), então o repositório usa `public.party_people`, que já devolve o username de cada pessoa da mesa, e cruza com o dono de cada personagem.
- **Testes de integração como jogador:**
  - Não vê a iniciativa dos outros.
  - Vê a própria.
  - Muda só a própria.
  - Não consegue mudar a de outro jogador nem a de NPC.
  - `previous_turn` recusa o jogador.
  - Voltar pula mortos revelados, diminui a rodada ao passar do começo e recusa na rodada 1 com a vez no primeiro.

## 6. Textos

Textos novos em `pt` e `en`:

- "Voltar turno"
- "Vez voltou para {nome}"
- "Sua iniciativa"
- "Ver ficha"
- "Trocar com {nome}"
- "Ordenar por iniciativa · ordem mudou" (ou um aviso separado com o mesmo sentido)
- O erro de voltar no início do combate

Saem "Subir {nome}" e "Descer {nome}", se nada mais usar. O @ aparece como `@username`, sem tradução.

## O que fica com o builder

- O selo de estado na linha fechada (ícone e texto) e o lugar exato do @.
- A forma do aviso de "ordem mudou".
- Dividir os componentes: a linha do mestre deve ficar menor que hoje. Extrair a parte aberta para um componente próprio é bem-vindo.
- Um PR só, com commits por tema e corpo em pt e en.
