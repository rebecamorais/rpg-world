# Suporte: mesa sem mestre

Quando um jogador pede ajuda porque outro jogador não responde a um pedido para virar mestre. Não anote
e-mails, nomes nem IDs neste repositório: rode as consultas no SQL editor do Supabase e use os dados só
na conversa com a pessoa.

## 1. Conferir o pedido

O pedido do jogador chega pelo formulário de suporte (`/support`) com o ID da mesa. No SQL editor:

```sql
SELECT * FROM public.support_party_gm_claim('<ID-DA-MESA>');
```

Cada linha é um jogador ativo que ainda não respondeu (`pending_user_id`, `pending_email`). Sem linhas, o
pedido não existe mais ou todos já responderam: não há o que fazer.

## 2. Escrever ao jogador

Escreva para o `pending_email` e conte o que acontece:

- Há um pedido para virar mestre na mesa dele, e ele precisa **Aceitar** ou **Recusar** na página da mesa.
- Se não responder em **7 dias**, o suporte o tira da mesa.
- Os personagens dele saem da mesa, mas a ficha continua com ele; para voltar, ele pede para entrar de novo pelo link.

Marque a data em que escreveu.

## 3. Sem resposta em 7 dias, tirar da mesa

```sql
SELECT public.support_remove_unresponsive_member('<ID-DA-MESA>', '<ID-DO-JOGADOR>');
```

Só funciona com um jogador que ainda está pendente em um pedido aberto (o `pending_user_id` do passo 1);
fora disso dá erro e não muda nada. O retorno diz o que aconteceu com o pedido: `pending` (ainda faltam
respostas), `approved` (o candidato virou mestre) ou `cancelled`. Repita para cada jogador pendente.

Avise quem pediu ajuda do resultado, sem passar dados de quem foi tirado.

## O que não é caso de suporte

- **Recusa.** Quem recusa está decidindo, e o suporte não decide entre jogadores. A mesa continua
  funcionando sem mestre, e o grupo pode criar outra mesa.
- O suporte não vira mestre nem lê as fichas.

## Pedido para apagar um feedback

1. Procure o e-mail da pessoa no canal do Discord que recebe as mensagens do formulário e apague as
   mensagens encontradas.
2. Apague o texto no banco (`public.feedback`) e confirme com a pessoa.

A busca no banco por e-mail só acha feedbacks de contas que ainda existem: ao excluir a conta, o e-mail é
limpo do feedback. Se a conta já foi excluída, procure o texto no Discord.
