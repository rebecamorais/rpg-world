# Party, papéis e notas de sessão

**Data:** 2026-10-15
**Status:** ideia, nada decidido. É o pré-requisito do plano `2026-10-15-sessoes-calendario-discord.md`.

Hoje cada personagem é visto só pela dona ou dono. A ideia é o usuário poder **criar uma party**,
convidar pessoas com o papel de **Mestre (Dungeon Master)** ou **Membro da party**, e os membros
**apenas visualizarem** um resumo dos personagens uns dos outros. Junto disso, um lugar para as
**notas das sessões**, ou pelo menos o link para um documento no Drive.

## Como está hoje

- `characters`, `character_lore` e `character_spells` têm RLS só para o dono
  (`auth.uid() = owner_id`). `profile` também: ninguém vê o perfil de outra pessoa.
- Não existe nenhuma tabela de grupo, convite ou papel.

## Modelo

- **`parties`:** nome, descrição curta, sistema (`rpg_system`), criada por, link de notas
  externo (opcional), datas.
- **`party_members`:** `party_id`, `user_id`, `role` (`dungeon_master` | `member`), entrou em.
  Quem cria a party entra como Mestre.
- **`party_characters`:** quais personagens de cada membro estão na party. Um personagem pode
  estar em mais de uma party? (pergunta em aberto; o modelo permite.)
- **Convites:** link com token (expira, pode ser revogado) ou convite por username. O link é
  mais simples e funciona bem para mandar no Discord.

### Papéis

| Ação                                       | Mestre              | Membro           |
| ------------------------------------------ | ------------------- | ---------------- |
| Editar a party, convidar, remover pessoas  | sim                 | não              |
| Adicionar/remover **o próprio** personagem | sim                 | sim              |
| Ver o resumo dos personagens da party      | sim                 | sim (só leitura) |
| Ver a ficha completa dos personagens       | a decidir           | não              |
| Editar personagem de outra pessoa          | não                 | não              |
| Escrever notas da party                    | sim                 | a decidir        |
| Sair da party                              | sim (passa o papel) | sim              |

Mais de um Mestre por party? O modelo aceita; a interface pode começar com um só.

## Só visualizar: o que os outros veem

Ponto técnico importante: **RLS no Postgres filtra linhas, não colunas.** Uma política "membro da
mesma party pode ler `characters`" liberaria a linha inteira, incluindo `system_data` (PV,
magias, moedas…). Para mostrar só alguns campos:

- **Proposta:** uma função `security definer` (ou view) `party_character_cards(party_id)` que
  confere se quem chama é membro e devolve só os campos públicos. As tabelas originais continuam
  com RLS só do dono.
- **Campos públicos (primeira versão):** nome, avatar, cor, classe, nível, raça/espécie e
  antecedente. O nome e a foto do jogador vêm do `profile` pelo mesmo caminho (hoje ninguém vê o
  perfil dos outros).
- "Background" pode ser duas coisas, e vale decidir qual:
  - o **antecedente** de D&D (Acólito, Soldado…), que está em `system_data.background`;
  - a **história** do personagem (`character_lore.backstory`), que é texto longo e pessoal.
    Talvez a dona do personagem escolha se compartilha ou não.
- **Depois:** cada pessoa escolhe o que mostrar (ex.: "mostrar história para a party"), e o
  Mestre talvez veja mais (PV e CA durante o combate, por exemplo).

## Notas de sessão

Do mais simples para o mais completo:

1. **Link externo na party:** um campo com a URL do documento no Drive (ou Notion, Obsidian…).
   Mostrar como botão "Abrir notas". Validar só que é `https://`.
2. **Notas por sessão:** `session_notes` com party, data da sessão, título, texto em Markdown e
   link externo opcional. Vira a lista "Diário da campanha" da party. Encaixa com as sessões do
   plano de calendário/Discord quando elas existirem.
3. **Visibilidade por nota:** pública para a party, só do Mestre (segredos, planejamento) ou
   pessoal de cada jogador.

Sugestão: começar pelo 1 e já desenhar o 2 com o 3 em mente (coluna `visibility` desde o início).

## Interface

- Nova seção "Parties" no menu: lista das parties, criar, entrar por link.
- Página da party: membros com papel, cards dos personagens (resumo só leitura), botão de notas,
  e depois as sessões.
- Na ficha do personagem: em quais parties ele está.
- Card de personagem de outra pessoa sem nenhum controle de edição (nem os inputs "fantasma"
  da ficha).

## Testes importantes

- RLS e a função de resumo com usuários diferentes (dono, membro, Mestre, quem não é da party,
  membro removido): ninguém além do dono lê `characters`/`system_data` direto.
- Convite expirado ou revogado não deixa entrar.
- Seguir o padrão dos testes de integração de RLS que já existem em
  `supabase-character.repository` (`rls.integration.test.ts`).

## Política de Privacidade

A política atual (atualizada em 15/10/2026) diz que **personagens e perfil são vistos só pelo
dono**. Com parties isso deixa de ser verdade, então a política precisa mudar **no mesmo PR** que
liberar o resumo dos personagens para a party, antes de ir para produção:

- **2. Uso dos Dados:** voltar a ter o item "mostrar seu perfil (nome de usuário e avatar) e o
  resumo dos seus personagens aos membros das parties em que você está", listando exatamente os
  campos públicos decididos acima.
- **1. Dados Coletados:** incluir parties (nome, membros e papéis), convites e notas de sessão
  (quando existirem).
- **3. Compartilhamento:** trocar "vistos apenas por você" por "vistos por você e pelos membros das
  suas parties, só o resumo"; se o Mestre puder ver a ficha completa, dizer isso.
- **7. Retenção:** o que acontece com notas e com o vínculo dos personagens quando alguém sai da
  party ou a party é apagada.
- Atualizar a data da política (pt e en) e avisar os usuários se a mudança for significativa,
  como os Termos (seção 7) prometem.

## Perguntas em aberto

- "Background" é o antecedente, a história, ou os dois?
- O Mestre vê a ficha completa (só leitura)? Faz sentido para preparar encontros.
- Membros escrevem notas da party ou só o Mestre?
- Um personagem em várias parties ao mesmo tempo?
- O que acontece com os personagens quando a party é apagada? (Só desvincula, nunca apaga.)

## Ordem sugerida

1. Tabelas `parties`, `party_members`, `party_characters` com RLS e testes de integração.
2. Criar party e entrar por link de convite.
3. Função de resumo e página da party com os cards só leitura, **com a Política de Privacidade
   atualizada no mesmo PR** (ver acima).
4. Link de notas externo na party.
5. Notas por sessão com visibilidade.
6. Sessões, calendário e Discord (outro plano).
