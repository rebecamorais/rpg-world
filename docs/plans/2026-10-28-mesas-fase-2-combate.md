# Mesas — fase 2: modo Combate (iniciativa em tempo real)

**Data:** 2026-10-28
**Status:** design para revisão. Depende da fase 1
([`2026-10-28-mesas-fase-1-role-play.md`](2026-10-28-mesas-fase-1-role-play.md)) estar no ar.

## Por quê

No combate o mestre precisa bater o olho no estado de todo mundo e controlar de quem é a vez, e os
jogadores precisam saber quando é a vez deles sem perguntar. Hoje isso é feito de cabeça ou no
Discord.

## O que a Rebeca decidiu

- O **modo Combate** é um **rastreador de iniciativa**: uma lista em ordem de iniciativa com os
  personagens dos jogadores **e inimigos**.
- **Inimigos**, por enquanto, são **fichas do próprio mestre** (personagens que ele cria no app).
  Uma ficha própria de monstro fica para depois.
- Há **rodada** e **turno atual**.
- **O jogador pode encerrar o próprio turno**; **o mestre pode encerrar o turno de qualquer um**.
- **Os jogadores veem a ordem e de quem é a vez**, só com os **nomes** — sem PV de ninguém, nem dos
  inimigos.
- Para o mestre, cada linha mostra: iniciativa, nome, **PV (com temporários, e testes contra a morte
  a 0)**, **CA**, **percepção passiva** e **espaços de magia**. A linha abre a ficha (só leitura nos
  jogadores; o mestre edita as fichas de inimigo, que são dele).

## Objetivos

1. Iniciar um combate numa mesa, adicionar participantes (personagens da mesa + fichas do mestre
   como inimigos), definir a iniciativa de cada um e ordenar.
2. Avançar turno e rodada (mestre, ou o próprio jogador no turno dele).
3. Encerrar o combate.
4. **Tempo real:** mudanças no combate (turno, ordem, entra/sai) aparecem para todos sem recarregar;
   e o PV/estado que o mestre vê acompanha quando o jogador salva a ficha.

## Não-objetivos

- Ficha de monstro, bestiário, rolagem automática de iniciativa ou de dados.
- Mostrar PV dos inimigos aos jogadores (nem "ferido/sangrando").
- O mestre alterar o PV de um jogador.
- Condições no combate (as condições são outro projeto; quando existirem, entram aqui).
- Mais de um combate ao mesmo tempo na mesma mesa.

## Anti-objetivos

- Um jogador ver PV, CA ou qualquer número de outro participante — pela tela ou pela API/canal de
  tempo real.
- Um jogador conseguir passar o turno de outro, ou mexer na ordem.
- A tela de um jogador ficar dessincronizada sem perceber (precisa reconectar e se atualizar sozinha
  depois de cair a conexão).

## Restrições

- Supabase Realtime (o projeto já usa Supabase). O que trafega no canal dos jogadores não pode
  carregar dados que eles não podem ver.
- A regra de quem pode passar turno vale no banco/servidor, não só no botão.
- As fichas de inimigo do mestre são personagens normais dele; não podem aparecer como "personagem
  levado" por outro jogador.

## Como, nas partes decididas

- **Inimigo = personagem do mestre.** Nada de tabela de monstros agora.
- **Uma ficha, vários inimigos** (decisão da Rebeca): três goblins usam a mesma ficha, e o **PV de
  cada um fica no participante do combate**, não na ficha. Ao entrar no combate, o participante
  começa com o PV máximo da ficha. Cada participante tem um rótulo (ex.: "Goblin 2").
- **Duplicar ficha** (decisão da Rebeca): o mestre pode copiar uma ficha (por exemplo, para um
  goblin chefe com outros números). Vale para qualquer personagem do mestre.
- **Quem muda o PV** (decisão da Rebeca):
  - **Jogadores:** só o próprio jogador, na ficha dele; a tela do mestre acompanha quando ele salva.
  - **Inimigos:** o mestre muda **direto na linha do combate**, ou abre a ficha e muda lá.
    Interpretação do Claude: a linha muda o PV daquele participante; a ficha muda a ficha-modelo
    (afeta quem entrar no combate depois).
- **Iniciativa digitada pelo mestre** (ele também pode reordenar). Rolagem fica para depois.
- **Visões separadas:** o jogador recebe só `{ ordem, nomes, turno atual, rodada }`, **sem os
  valores de iniciativa** (decisão do Claude: "só com os nomes"); o mestre recebe o estado completo
  das fichas.
- **Realtime:** o app ainda não usa; as tabelas envolvidas entram na publicação `supabase_realtime`
  numa migração, e o que trafega para jogadores respeita a visão acima.

## Fica a cargo de quem implementa

- Modelo do combate (tabelas de encontro e participantes) e onde mora o turno atual.
- Canal de tempo real (Postgres Changes com RLS ou Broadcast a partir do servidor) e como garantir
  que o jogador só receba os campos permitidos.
- Desempate de iniciativa e o que acontece se um personagem sair da mesa no meio do combate.
- Testes: RLS/servidor de quem passa turno, e2e com dois navegadores (mestre e jogador) vendo o
  turno mudar.
