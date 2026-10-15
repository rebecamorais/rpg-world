# Sessões: calendário e Discord

**Data:** 2026-10-15
**Status:** só ideias. Ainda falta pensar no que se quer de verdade antes de planejar a
implementação.

O objetivo é ajudar a organizar as sessões de jogo: marcar data, saber quem vai, lembrar todo
mundo e ter isso no calendário e no Discord, onde a mesa já conversa.

## Pré-requisito: mesa/campanha

Hoje o app só tem personagens (`characters`, `lore`, `spells`, `users`, `feedback`). Sessão
pertence a um grupo, então antes de tudo é preciso:

- **Campanha** (ou "mesa"): nome, sistema, mestre, jogadores (convite por link), personagens
  vinculados. Detalhado em `2026-10-15-party-e-notas.md` (party, papéis, notas).
- **Sessão:** campanha, data/hora com fuso, duração, status (marcada, confirmada, cancelada,
  realizada), local (online/presencial, link da call), notas/resumo depois.
- **Presença:** cada membro responde vou / talvez / não vou.

Isso por si só já é útil, mesmo sem calendário e Discord.

## Calendário

| Opção                              | Como funciona                                                                                  | Prós                                                                 | Contras                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Feed ICS** (recomendado começar) | Cada campanha (ou cada usuário) tem uma URL `.ics` secreta que o Google/Apple/Outlook assinam. | Sem OAuth, funciona em qualquer calendário, pouca coisa para manter. | Atualização depende do calendário (Google demora horas); só leitura.   |
| Botão "adicionar ao calendário"    | Link/arquivo `.ics` por sessão.                                                                | Trivial.                                                             | Mudou a data, o evento de cada um fica desatualizado.                  |
| Google Calendar API                | OAuth com o Google; o app cria/atualiza os eventos e convida os jogadores.                     | Atualiza na hora, convites nativos.                                  | OAuth, verificação do app pelo Google, tokens para guardar, só Google. |

## Discord

| Opção                                | O que dá para fazer                                                                                                                         | Infra                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Webhook** (recomendado começar)    | Mensagem no canal da mesa quando uma sessão é marcada/alterada e lembrete antes.                                                            | Só uma URL de webhook por campanha. Lembretes precisam de um agendador (cron).              |
| **Bot com interações HTTP**          | Comandos (`/sessao proxima`, `/sessao marcar`), botões de presença na mensagem, criar **evento agendado do servidor** (aparece no Discord). | Endpoint HTTP de interações; roda como função serverless, sem processo ligado o tempo todo. |
| Bot com gateway (conexão permanente) | O mesmo + reagir a mensagens, voz, presença online.                                                                                         | Processo sempre ligado (fora do modelo serverless). Provavelmente desnecessário.            |

- **Vincular contas:** login com Discord (o Supabase Auth tem esse provedor) ou vincular depois
  no perfil, para saber qual membro do servidor é qual jogador.
- **Eventos agendados do Discord** cobrem boa parte do "calendário" para quem vive no Discord:
  as pessoas marcam "interessado" e o Discord avisa quando começa.

## Perguntas para pensar

- Quem marca a sessão: só o mestre, ou qualquer um propõe e o grupo vota (enquete de datas)?
- A fonte da verdade é o app (Discord e calendário só refletem) ou o Discord também pode
  marcar/alterar?
- Lembretes: quanto tempo antes? Configurável por campanha?
- Mesa presencial e online têm necessidades diferentes (endereço vs link da call)?
- O resumo da sessão (diário) entra aqui ou é outro recurso, ligado ao `lore`?

## Ordem possível (quando decidir)

1. Campanha, membros e sessões no app, com presença.
2. Feed ICS por campanha.
3. Webhook do Discord com aviso de sessão marcada e lembrete.
4. Bot com comandos, botões de presença e eventos agendados do servidor.
