# Telas de mesa (parties), combate e NPCs

Revisão de 2026-11-15. Linhas conferidas em `70c15360`. Itens marcados **✅ neste PR** já foram resolvidos na branch `feat/revisao-telas`.

Prints usados: `desktop-dark` de mestre (`mestre@email.com`) e de jogadora (`playerchilli@email.com`) na mesa The Pioneers. O que fala de 390px e do tema claro saiu da leitura do código.

## /parties (lista)

| #   | Sev.  | Categoria   | Onde                                           | Problema                                                                                                | Proposta                                                          |
| --- | ----- | ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Baixa | Tipografia  | `CreatePartyForm.tsx:57`                       | O aviso de limite usa `text-label`, que deixa o texto em MAIÚSCULAS, negrito e espaçado.                | `text-caption text-muted-foreground`.                             |
| 2   | Baixa | Usabilidade | `PartyList.tsx:167`, `CreatePartyForm.tsx:149` | A seção "CRIAR MESA" tem logo abaixo o label "Nova mesa": dois títulos para um campo.                   | _(sugestão)_ Deixar só o título da seção; o label vira `sr-only`. |
| 3   | Baixa | Usabilidade | `PartyList.tsx:88`                             | Enquanto carrega, aparece o `LoadingState` de tela cheia. A fase 4 do plano previa skeleton nas listas. | Skeleton com 2 ou 3 `PartyRow`.                                   |

## /parties/join/[code]

| #   | Sev.  | Categoria   | Onde                                              | Problema                                                                        | Proposta                                                   |
| --- | ----- | ----------- | ------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 4   | Baixa | Tipografia  | `JoinPartyCard.tsx:79`, `join/[code]/page.tsx:88` | O nome da mesa aparece em `text-heading` (Inter). No resto do app ele é Cinzel. | `text-title`.                                              |
| 5   | Baixa | Usabilidade | `JoinPartyCard.tsx:84`                            | Depois de "Pedido enviado", não há como cancelar o pedido nessa tela.           | _(sugestão)_ Link "Cancelar pedido" ou link para /parties. |

## Mesa: aba Mesa (`/parties/[id]`)

| #   | Sev.  | Categoria       | Onde                                        | Problema                                                                                                                            | Proposta                                                                                                                                            |
| --- | ----- | --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Média | Usabilidade     | `PartyPage.tsx:104`                         | Quando o mestre aprova ou recusa um pedido, não aparece nenhum retorno: a linha só some.                                            | Toast "@fulano entrou na mesa" ou "Pedido recusado".                                                                                                |
| 7   | Média | Alinhamento     | `PartyRoster.tsx:39`                        | Na visão do jogador, cards lado a lado têm alturas diferentes: só os personagens dele têm "Ver ficha", e o `Card` não tem `h-full`. | `h-full` no `li`/`Card` e o botão em `mt-auto`.                                                                                                     |
| 8   | Média | Tipografia      | `RolePlayCard.tsx:89`, `PartyRoster.tsx:46` | "JOGADO POR @PLAYERPEPPER": o `text-label` deixa o username em caixa alta, e o username diferencia maiúsculas.                      | Só "Jogado por" em `text-label`; o `@username` em `text-caption`, sem transform.                                                                    |
| 9   | Baixa | Copy            | `messages/pt.json` (aba "Role Play")        | O título está em inglês numa interface em português.                                                                                | _(sugestão)_ "Interpretação" ou "Na mesa".                                                                                                          |
| 10  | Média | Usabilidade     | `PartyTabs.tsx:73` vs `:98`                 | O selo "Rodada N" só aparece nas abas do desktop. No celular, quem está no Baú ou no Diário não vê que há combate.                  | Ponto ou selo no ícone de Combate da barra inferior.                                                                                                |
| 11  | Baixa | Componentes     | `PartyTabs.tsx:72`                          | As abas do desktop não têm ícone; as do celular têm.                                                                                | _(sugestão)_ Ícones nas duas.                                                                                                                       |
| 12  | Média | Ação destrutiva | `PartyPage.tsx:181-211`                     | "Sair da mesa" fica dentro do diálogo "Meus personagens", cujo nome não sugere que se sai da mesa por ali.                          | _(sugestão)_ Menu "…" com "Meus personagens" e "Sair da mesa" em vermelho. **✅ neste PR:** o botão já é vermelho e a confirmação é o diálogo novo. |

## Mesa: aba Combate

| #   | Sev.  | Categoria   | Onde                                                  | Problema                                                                                                        | Proposta                                                                     |
| --- | ----- | ----------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 13  | Média | Componentes | `GmCombatPanel.tsx:190`                               | Sem combate, o mestre vê um `<p>` solto com um botão; o jogador vê um `EmptyState` com ícone e borda tracejada. | `EmptyState icon="Swords"` com `action={<Button>Preparar combate</Button>}`. |
| 14  | Baixa | Componentes | `GmCombatPanel.tsx:94`, `:163`                        | "Gerenciar NPCs" aparece duas vezes, em dois estilos (link sublinhado e botão ghost).                           | Um estilo só.                                                                |
| 15  | Baixa | Componentes | `CombatRowDetails.tsx:170` vs `PlayerTurnRow.tsx:210` | O botão "Condições" é `outline` para o mestre e `ghost` para o jogador.                                         | Padronizar em `outline sm`.                                                  |
| 16  | Baixa | Cores       | `CombatConnection.tsx:18`                             | "Reconectando…" em `text-muted-foreground` é discreto demais para avisar que o estado está desatualizado.       | `text-warning-flare` e mover para o `PartyFrame`, valendo em todas as abas.  |
| 17  | Média | Usabilidade | `GmCombatPanel.tsx:257`                               | "Adicionar personagens da mesa" dispara N mutations num `forEach`: se uma falha, o spinner reflete só a última. | Chamada em lote, ou `Promise.allSettled` com um toast de resumo.             |

## Mesa: aba Diário

| #   | Sev.  | Categoria   | Onde                  | Problema                                                                                                                  | Proposta                                                                                     |
| --- | ----- | ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 18  | Baixa | Usabilidade | `PartyJournal.tsx:31` | O vazio do mestre usa como título uma instrução longa, e o link leva ao topo de /settings (o card do diário fica no fim). | Título curto ("Sem diário ainda"), instrução no `description`, link para `/settings#diario`. |
| 19  | Baixa | Copy        | `messages/pt.json`    | "O Mestre ainda não configurou…" com M maiúsculo; no resto é "o mestre".                                                  | Minúscula.                                                                                   |

## Mesa: aba Baú

| #   | Sev.  | Categoria  | Onde                         | Problema                                                                           | Proposta                         |
| --- | ----- | ---------- | ---------------------------- | ---------------------------------------------------------------------------------- | -------------------------------- |
| 20  | Média | Copy       | `messages/pt.json`           | "Moedas da party" e "Baú da party" misturam "party" com "mesa".                    | "Moedas da mesa", "Baú da mesa". |
| 21  | Baixa | Tipografia | `inventory/Backpack.tsx:108` | "ADICIONAR ITEM" usa `text-label` e sai em caixa alta. Nenhum outro botão é assim. | Tirar o `text-label`.            |

## Configurações da mesa

| #   | Sev.     | Categoria       | Onde                                                           | Problema                                                                                                                                            | Proposta                                                                                                                           |
| --- | -------- | --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 22  | Média    | Alinhamento     | `PartySettings.tsx:41`                                         | Os três `SectionCard` encostam um no outro, sem espaço.                                                                                             | **✅ neste PR:** `flex flex-col gap-6`.                                                                                            |
| 23  | **Alta** | Ação destrutiva | `PartyManagement.tsx:204`                                      | "Apagar mesa" fica no meio do card "Gerenciar", entre "Edição das regras" e os cards de imagem e diário. Não há separação visual de zona de perigo. | **✅ neste PR:** card "Zona de perigo" no fim da página. Ver [acoes-destrutivas.md](acoes-destrutivas.md).                         |
| 24  | **Alta** | Ação destrutiva | `messages/pt.json` (`deleteConfirm`)                           | A confirmação diz só "Apagar esta mesa? Nenhum personagem é apagado." Não fala que o baú, o combate, a imagem, o diário e os convites somem.        | **✅ neste PR:** as perdas aparecem no card e no diálogo vermelho. Falta: digitar o nome da mesa, como no `DeleteCharacterDialog`. |
| 25  | Média    | Tipografia      | `PartyManagement.tsx:117`, `:184`, `JournalSettings.tsx:85`    | As dicas em `text-label` saem em caixa alta. O passo a passo do Google Docs vira três frases longas em maiúsculas, quase ilegíveis.                 | `text-caption text-muted-foreground`.                                                                                              |
| 26  | Média    | A11y            | `PartyManagement.tsx:141`                                      | Os botões "Tirar" não têm o nome do jogador no `aria-label`: o leitor de tela ouve "Tirar, Tirar".                                                  | `aria-label={t('removeFrom', { name })}`.                                                                                          |
| 27  | Média    | Usabilidade     | `PartyManagement.tsx:144`                                      | Remover um jogador não mostra toast, e o `isPending` desabilita todos os "Tirar" sem spinner em nenhum.                                             | `loading` só na linha clicada e toast de sucesso.                                                                                  |
| 28  | Baixa    | Usabilidade     | `PartyManagement.tsx:60`                                       | `clipboard.writeText` sem `try`: se a cópia falhar, nada avisa.                                                                                     | `catch` com toast de erro e o texto selecionado no input.                                                                          |
| 29  | Baixa    | Usabilidade     | `PartyManagement.tsx:160-201`                                  | O nome só salva com "Renomear", mas a edição das regras salva sozinha no select.                                                                    | _(sugestão)_ "Salvo" ao lado do select, ou o mesmo padrão nos dois.                                                                |
| 30  | Baixa    | Copy            | `PartyFrame.tsx:43`, `PartySettings`, `PartyManagement.tsx:91` | Três nomes para o mesmo lugar: "Gerenciar", "Configurações da mesa", "Gerenciar a mesa".                                                            | _(sugestão)_ "Configurações" em todos.                                                                                             |
| 31  | Baixa    | Componentes     | `PartyImageSettings`, `JournalSettings`, `PartyManagement`     | Três ações de remover na mesma página, com três estilos.                                                                                            | **✅ neste PR:** as três usam `destructive-ghost`.                                                                                 |

## Ficha vista pela mesa (`/parties/[id]/characters/[id]`)

| #   | Sev.  | Categoria   | Onde                         | Problema                                                                                                                | Proposta                                                                            |
| --- | ----- | ----------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 32  | Média | Usabilidade | `SheetFieldset.tsx:17`       | Em "Só leitura", os campos mantêm bordas, chevrons, steppers −/+ e ícones de ajuste. Parecem editáveis e só não reagem. | _(sugestão)_ Variante "plain" dos campos no `readOnly`; no mínimo, esconder os −/+. |
| 33  | Baixa | Componentes | `CharacterSheetShell.tsx:29` | "Voltar para a mesa" é link sublinhado aqui e `Button outline` em `PartySettings`.                                      | Mesmo componente nos dois.                                                          |

## /enemies → /characters/npcs

| #   | Sev.  | Categoria   | Onde                                | Problema                                                                                                     | Proposta                                                               |
| --- | ----- | ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 34  | Baixa | Componentes | abas "Meus personagens / Meus NPCs" | São um segmentado em pílula; as abas da mesa são sublinhadas. Dois estilos para navegar entre páginas irmãs. | _(sugestão)_ Um estilo para navegação; o segmentado fica para filtros. |

## Transversal

| #   | Sev.  | Categoria   | Onde                                                                                             | Problema                                                                                                                                     | Proposta                                       |
| --- | ----- | ----------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 35  | Média | Componentes | `PartyPage.tsx:226`, `PartyJournal.tsx:37`, `JoinPartyCard.tsx:42`, `CharacterSheetShell.tsx:75` | Links de ação dos vazios são `<Link className="text-primary-flare text-sm underline">` repetidos, uns com `next/link`, outros com `AppLink`. | `Button variant="link" asChild` com `AppLink`. |
