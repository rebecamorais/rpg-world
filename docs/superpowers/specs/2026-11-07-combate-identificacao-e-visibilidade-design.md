# Combate: identificação, visibilidade dos NPCs e NPC caído

Projeto 3 do [registro de decisões de 06/11](2026-11-06-personalizacao-e-combate-decisoes.md). Este documento junta aquele registro com a conversa de 07/11, que acrescentou o NPC caído e morto.

Legenda: **(dona)** foi decidido por ela. **(suposição aprovada)** foi aprovado na revisão de 06/11. **(decisão do builder)** é escolha técnica que não muda o que se vê.

## Por quê

O mestre precisa conduzir o combate sem estragar surpresas. Hoje todo jogador vê todos os NPCs pelo nome desde o momento em que entram na lista, e não sabe quem é aliado e quem é inimigo. O mestre não tem como guardar uma emboscada, um inimigo sem nome ou a dúvida sobre um inimigo caído ainda estar vivo.

Sucesso é o mestre montar o encontro com calma e revelar as coisas quando quiser, sem que nada vaze. Nem na tela, nem nos dados que o navegador do jogador recebe.

## Objetivos

1. Todos (mestre e jogadores) veem o tipo de cada participante: jogador, aliado, neutro ou inimigo. O mestre pode mudar o lado de um NPC no meio do combate.
2. O mestre controla a visibilidade de cada NPC: visível, anônimo ou oculto.
3. NPC com 0 PV fica caído. O mestre escolhe entre testes contra a morte e morto, e decide quando revelar a morte.
4. O servidor só manda ao jogador o que ele pode ver. Isso vale para a API e para o tempo real.

## Fora do escopo (não-objetivos)

- Mudar como funciona o jogador com 0 PV. Os testes contra a morte do jogador continuam na ficha dele, como hoje. **(decisão do builder)**
- Modo demo: a demo não tem combate (`transport.ts` responde `{}`). Nada muda lá.
- Modo claro e revisão completa de WCAG, que ficam numa issue própria. Tudo que for novo nasce em AA.

## O que seria um fracasso mesmo funcionando

- Qualquer dado de NPC oculto, ou nome e imagem de NPC anônimo, aparecer na resposta da API do jogador, no payload do tempo real ou no HTML.
- O jogador conseguir deduzir que um NPC caído está morto antes de o mestre revelar. Isso vale para texto, ícone, turno pulado e qualquer campo na resposta.
- O tipo ser indicado só por cor.

## Estado atual (para quem vai construir)

- `encounter_participants` tem `side` (`player`, `ally`, `enemy`; a CHECK `encounter_participants_side_check` e a política de INSERT citam esses valores), `label`, `hp_current`, `hp_temp`, `conditions` e `position`. Só o mestre lê e escreve nessa tabela (RLS).
- O jogador lê o combate só por `public.encounter_turns(p_party_id)` (SECURITY DEFINER), que hoje devolve todos os participantes com nome (`coalesce(label, nome da ficha)`), `is_current`, `is_mine` e condições. Não devolve imagem nem `side`.
- O tempo real manda um broadcast vazio (`private.notify_encounter`) a cada mudança, e cada pessoa busca de novo pela API (`usePartyChannel`). Por isso o filtro inteiro mora em `encounter_turns`, e nenhum payload do tempo real precisa mudar. Isso continua obrigatório: nada de dado no broadcast.
- O turno anda por `public.end_turn`, que usa `private.next_participant`.
- Na tela do mestre (`CombatRow`), a etiqueta do NPC (`t(row.side)`) some no turno dele, trocada por "turno atual". Isso muda: o tipo aparece sempre.
- Na tela do jogador (`PlayerCombatPanel`), cada linha mostra só o nome, o destaque de turno e as condições.

## 1. Identificação do tipo

- **(dona)** Todos veem o tipo de cada participante: jogador, aliado, **neutro** ou inimigo.
- **(dona)** Entra um quarto lado, `neutral`, para dar mais opções ao mestre: um NPC que ainda não escolheu lado, um mercador no meio da briga etc. Ele segue as mesmas regras de visibilidade e de caído e morto que os outros NPCs, e pode ser escolhido ao adicionar o NPC.
- **(dona)** O mestre pode mudar o lado de um NPC a qualquer momento, inclusive no meio do combate, entre aliado, neutro e inimigo. Um NPC nunca vira jogador, e um jogador nunca vira NPC. A mudança não mexe na ordem nem no turno. **(decisão do builder)**
- **(suposição aprovada)** Cada tipo tem ícone, texto e cor, para não depender só da cor. Os ícones e as cores ficam a cargo do builder, dentro da paleta "fantasia sóbria" e em AA.
- O tipo aparece sempre, inclusive no turno do participante, ao lado do indicador de turno atual.
- Vale para NPC visível e anônimo. Oculto não aparece.

## 2. Visibilidade dos NPCs

Cada NPC (aliado ou inimigo) tem um de três estados. Jogadores são sempre visíveis.

| Estado      | O jogador vê                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Visível** | nome, imagem e tipo, além do estado de caído ou morto (seção 3) e das condições                                             |
| **Anônimo** | "Inimigo desconhecido", "Aliado desconhecido" ou "Neutro desconhecido", sem imagem, com o tipo e o estado de caído ou morto |
| **Oculto**  | nada: a linha não existe para ele                                                                                           |

- **(dona)** NPCs novos sempre entram como ocultos.
- **(suposição aprovada)** O mestre muda o estado a qualquer momento, inclusive durante o combate. Os NPCs dos combates já em andamento quando a migração rodar ficam como visíveis (a migração preenche as linhas existentes com `visible`; o default para linhas novas é `hidden`).
- **(dona)** O controle fica na linha do NPC na tela do mestre, por ícones. O texto da ação ("Mostrar", "Anonimizar", "Ocultar") aparece ao passar o mouse, no toque e no foco, e existe para leitor de tela (rótulo acessível). A tela do mestre também mostra o estado atual de cada NPC.
- **(dona)** Nas linhas, a imagem do personagem segue o formato quadrado com cantos arredondados do Projeto 2.
- **(suposição aprovada)** O jogador pode ampliar a imagem de um NPC visível (o mesmo "ver ampliado" da ficha). NPC anônimo não tem zoom.
- **(dona)** O jogador nunca abre a ficha de um NPC nem vê PV, CA ou atributos, em nenhum estado.
- **(dona)** Na lista do jogador, as pessoas da party sempre aparecem, na ordem.
- Condições: aparecem para NPC visível e anônimo, como hoje. **(decisão do builder)**
- Anônimo não leva número ("Inimigo desconhecido 2"). Numerar entregaria quantos existem de cada ficha. Vários anônimos iguais se diferenciam pela posição e pelo estado. **(decisão do builder)**

- **(dona)** Voltar um NPC de visível para anônimo esconde só na tela. O `participant_id` e a posição continuam os mesmos, então quem inspecionar o navegador pode ligar a linha anônima ao nome que já viu antes. Isso é aceito, porque o jogador já tinha visto aquele NPC. A resposta da API continua sem nome nem imagem do anônimo. Não é preciso trocar o identificador das linhas.

### Turno de um NPC oculto

- **(dona)** No turno de um NPC oculto, nenhuma linha fica destacada na lista do jogador, e aparece a mensagem "O mestre está conduzindo o turno".
- O servidor diz ao jogador só "o turno atual é de alguém que você não vê". Não manda id, posição nem quantos estão ocultos.

## 3. NPC caído e morto

Vale para NPCs (aliados e inimigos). Jogadores ficam como estão (ver Fora do escopo).

### Para o mestre

- Quando o PV de um NPC chega a 0, ele fica **caído**: a linha fica cinza, no tamanho normal.
- **(dona)** No NPC caído, o mestre escolhe entre:
  - **Testes contra a morte:** a linha dele mostra marcações de sucesso e falha (até 3 de cada), que o mestre marca. O NPC continua tendo o turno dele.
  - **Morto.**
- **(dona)** Os testes contra a morte do NPC aparecem **só para o mestre**.
- **(dona)** O jogador não deve saber se um NPC caído está fazendo testes ou se já morreu. Por isso existe um passo a mais: **revelar a morte**. É uma ação do mestre num NPC morto.
- 3 falhas marcam o NPC como morto (ainda não revelado). 3 sucessos deixam o NPC estável, ainda caído. **(decisão do builder, aprovada em conversa como suposição)**
- Voltar atrás: o mestre pode desmarcar "morto" e desfazer a revelação. Curar (PV acima de 0) tira o NPC de caído e zera os testes, a escolha e a revelação. **(decisão do builder)**
- O NPC morto sem revelação continua tendo o turno normalmente. O mestre só encerra o turno.

### Para o jogador

| Situação real                                                 | O jogador vê                                                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| PV > 0                                                        | linha normal                                                                                                      |
| 0 PV, sem escolha, com testes, estável ou morto sem revelação | **caído**: linha cinza, tamanho normal                                                                            |
| morto e revelado                                              | **morto**: linha fina e tracejada, miniatura cinza, nome riscado e caveira no fim (modelo A, escolhido pela dona) |

- No NPC anônimo, a linha de morto mostra "Inimigo desconhecido" riscado e não tem miniatura (ou mostra o marcador de anônimo).
- **(dona)** O turno do NPC morto e revelado é pulado automaticamente. Antes da revelação, o turno passa por ele normalmente.
- Se o mestre revela a morte de um NPC durante o turno dele, o turno não avança sozinho: segue até o mestre encerrar. Só os turnos seguintes pulam o NPC. Desfazer a revelação também não mexe no turno atual. **(decisão do builder)**
- O servidor manda ao jogador só três estados: `normal`, `caído`, `morto`. Ele nunca recebe PV, testes, a escolha do mestre ou se está estável.
- O caído e o morto aparecem também para o mestre: a linha dele fica cinza no caído, e o morto revelado fica no formato recolhido. O mestre ainda consegue expandir a linha para editar ou desfazer. **(decisão do builder)**

## 4. Exigência de segurança

- Esconder é feito no servidor, em `encounter_turns`. A função passa a:
  - excluir as linhas de NPC oculto;
  - para NPC anônimo, devolver nome nulo (o texto "Inimigo desconhecido" sai da tradução no cliente), imagem nula e `side`;
  - devolver `side`, a imagem (só de jogador e NPC visível) e o estado de vida (`normal`, `down`, `dead`), sem distinguir morto não revelado de caído. As linhas de jogador vêm sempre como `normal`: o PV da ficha de um jogador não entra na função, e a tela dele não muda **(decisão do builder)**;
  - quando o turno atual é de um NPC oculto, devolver `is_current = false` em todas as linhas e um sinal à parte de "turno de alguém oculto".
- O tempo real continua mandando broadcast vazio.
- `end_turn` e `next_participant` pulam o NPC morto e revelado. Se todos os participantes estiverem mortos e revelados, o combate não pode travar. O builder decide o comportamento, por exemplo não pular quando não sobra ninguém.
- Os novos campos de NPC (visibilidade, testes, escolha e revelação) seguem a regra atual de escrita: só o mestre, por RLS ou por funções SECURITY DEFINER que conferem `is_party_gm`.
- Testes de integração do banco cobrem, como jogador: oculto não aparece; anônimo vem sem nome e sem imagem; turno de oculto não marca ninguém; morto sem revelação vem como `down`; morto revelado vem como `dead` e tem o turno pulado. O teste de RLS existente (todas as tabelas públicas com RLS) continua passando.

## 5. Textos

Novos textos em `pt` e `en` no mesmo PR (Crowdin manual, como hoje): rótulos dos tipos, "Inimigo desconhecido", "Aliado desconhecido", "Neutro desconhecido", o rótulo "Neutro", a ação de mudar o lado, ações de visibilidade, "O mestre está conduzindo o turno", caído, morto, testes contra a morte do NPC, "Revelar morte" e os desfazer.

## O que fica com o builder

- Onde fica o controle de mudar o lado na linha do mestre, e o ícone e a cor do neutro.
- Atualizar o tipo `Side`/`NpcSide`, `NPC_SIDES`, a CHECK de `side` e a política de INSERT que cita `('ally', 'enemy')`. Mudar o lado exige permitir UPDATE de `side` só pelo mestre e só entre os lados de NPC.

- Formato das colunas novas: por exemplo `visibility text CHECK (...)`, `npc_fate`, contadores de testes e `death_revealed`. As CHECKs devem garantir que jogador não tenha esses campos.
- Ícones e cores dos tipos, e a forma exata dos controles do mestre, dentro do que está acima.
- Como o mestre escolhe entre "testes" e "morto" na linha: botões, menu etc.
- Divisão em commits, num PR só (preferência da dona: um PR por fase, com commits por tema, corpo em pt e en).
