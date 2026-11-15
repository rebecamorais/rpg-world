# Ações destrutivas: vermelho e confirmação

Regra de 2026-11-15. Foi pedida assim: "alguns botões de excluir precisam ser VERMELHOS, pra pessoa confirmar duas vezes".

## Regra

| Tipo de ação                                                                                                                                                      | Botão                                                                                                                                                                                                                 | Segunda confirmação                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Apaga **a coisa inteira** (mesa, personagem, conta)                                                                                                               | `variant="destructive"`: vermelho cheio, texto branco. Fica numa **Zona de perigo** no fim da página (borda `danger-muted`, cabeçalho `danger-surface`) ou num menu "…" com `DropdownMenuItem variant="destructive"`. | Diálogo vermelho. Quando a perda é grande, o diálogo pede para **digitar o nome**, como o `DeleteCharacterDialog` já faz. |
| **Remove uma linha** ou desfaz uma relação (tirar jogador, recusar, cancelar convite, remover imagem ou diário, sair da mesa, tirar do combate, encerrar combate) | `variant="destructive-ghost"`: texto vermelho, sem fundo.                                                                                                                                                             | `useConfirm({ destructive: true })`.                                                                                      |
| É **reversível na hora** (esquecer magia, remover item da mochila, marcar NPC como morto)                                                                         | `destructive-ghost`, ou ícone vermelho.                                                                                                                                                                               | Sem diálogo. Toast com **Desfazer**: é mais rápido no meio da sessão.                                                     |
| Pergunta que **não destrói** nada (pedir para virar mestre)                                                                                                       | Botão normal.                                                                                                                                                                                                         | `useConfirm()` sem `destructive`: diálogo neutro.                                                                         |

O diálogo de confirmação:

- se chama `useConfirm`, em `src/frontend/components/ui/confirm-dialog.tsx`;
- abre com o foco em **Cancelar**, para que um Enter logo depois do clique não apague nada;
- leva no botão o verbo da ação ("Apagar mesa", "Tirar"), nunca "OK";
- diz na descrição o que se perde.

Uso:

```tsx
const confirm = useConfirm();

const ok = await confirm({
  description: t('removeConfirm', { name }),
  confirmLabel: t('remove'),
  destructive: true,
});
if (ok) removeMember.mutate(userId);
```

`window.confirm` só continua no guarda de navegação (`useUnsavedChanges`), porque o evento `navigate` de voltar e avançar precisa de uma resposta síncrona. Todo o resto usa `useConfirm`.

## Inventário

| #   | Ação                                                    | Onde                                                  | Antes                                                                                                           | Agora                                                                                                                          |
| --- | ------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Apagar mesa                                             | `PartyDangerZone.tsx`                                 | Vermelho com texto preto, no meio do card "Gerenciar". `window.confirm` dizia só "nenhum personagem é apagado". | ✅ Zona de perigo própria, vermelho com texto branco, diálogo vermelho listando o que se perde. Falta: digitar o nome da mesa. |
| 2   | Tirar jogador                                           | `PartyManagement.tsx`                                 | Ghost neutro + `window.confirm`.                                                                                | ✅ `destructive-ghost` + diálogo. Falta: `aria-label` com o nome e toast.                                                      |
| 3   | Trocar link de convite                                  | `PartyManagement.tsx`                                 | Ghost neutro + `window.confirm`.                                                                                | ✅ Botão neutro; diálogo vermelho, porque o link antigo morre.                                                                 |
| 4   | Recusar pedido                                          | `PartyRequests.tsx`                                   | Ghost neutro + `window.confirm`.                                                                                | ✅ `destructive-ghost` + diálogo.                                                                                              |
| 5   | Cancelar convite                                        | `PartyRequests.tsx`                                   | Ghost neutro + `window.confirm`.                                                                                | ✅ `destructive-ghost` + diálogo ("Cancelar convite").                                                                         |
| 6   | Recusar convite (jogador)                               | `PartyList.tsx`                                       | Ghost neutro + `window.confirm`.                                                                                | ✅ `destructive-ghost` + diálogo.                                                                                              |
| 7   | Retirar meu pedido                                      | `PartyList.tsx`                                       | Ghost neutro + `window.confirm`.                                                                                | ✅ `destructive-ghost` + diálogo.                                                                                              |
| 8   | Sair da mesa                                            | `PartyPage.tsx` (MyPartyMenu)                         | Ghost vermelho à mão + `window.confirm`.                                                                        | ✅ `destructive-ghost` + diálogo. Falta: quando é o último jogador e a mesa vai junto, botão `destructive` cheio.              |
| 9   | Remover imagem da mesa                                  | `PartyImageSettings.tsx`                              | Ghost vermelho à mão + `window.confirm`.                                                                        | ✅ `destructive-ghost` + diálogo.                                                                                              |
| 10  | Remover diário                                          | `JournalSettings.tsx`                                 | Ghost neutro + `window.confirm`.                                                                                | ✅ `destructive-ghost` + diálogo.                                                                                              |
| 11  | Tirar do combate                                        | `CombatRowDetails.tsx`, `GmCombatPanel.tsx`           | Ghost vermelho à mão + `window.confirm`.                                                                        | ✅ `destructive-ghost` + diálogo.                                                                                              |
| 12  | Encerrar combate                                        | `GmCombatPanel.tsx`                                   | Ghost vermelho à mão + `window.confirm`.                                                                        | ✅ `destructive-ghost` + diálogo vermelho.                                                                                     |
| 13  | Descartar alterações da ficha                           | `SaveControls.tsx`                                    | Ghost + `window.confirm`.                                                                                       | ✅ Diálogo vermelho.                                                                                                           |
| 14  | Pedir para virar mestre                                 | `PartyGmClaim.tsx`                                    | `window.confirm`.                                                                                               | ✅ Diálogo neutro.                                                                                                             |
| 15  | Excluir personagem / NPC                                | `CharacterCard.tsx`, `DeleteCharacterDialog.tsx`      | Menu "…" vermelho + diálogo com o nome digitado.                                                                | ✅ Já estava bom; agora compara o nome com `trim()`.                                                                           |
| 16  | Excluir conta                                           | `DeleteAccountCard.tsx`, `ConfirmAccountDeletion.tsx` | Duas etapas (senha + link por e-mail). O título da zona de perigo não era vermelho.                             | ✅ Título vermelho. Falta: "Manter minha conta" na etapa final e trocar o `DANGER_BUTTON` por `variant="destructive-soft"`.    |
| 17  | Esquecer magia                                          | `SpellActions.tsx`                                    | Cinza; só ficava vermelho no hover. Tinha Desfazer.                                                             | ✅ Vermelho sempre.                                                                                                            |
| 18  | Remover item da mochila                                 | `QuantityStepper.tsx`                                 | O "−" vira lixeira quando a quantidade chega a 1. Tem Desfazer.                                                 | Falta: tirar a lixeira do lugar do "−" (toques repetidos apagam o item).                                                       |
| 19  | Zerar testes contra a morte                             | `DeathSavesCard.tsx`                                  | Ícone de 14px, sem confirmação.                                                                                 | Falta: toast com Desfazer.                                                                                                     |
| 20  | Cancelar meu pedido de mestre e recusar o voto de outro | `PartyGmClaim.tsx:87,110`                             | Ghost neutro, sem confirmação.                                                                                  | Falta _(sugestão)_: diálogo neutro explicando o efeito.                                                                        |
| 21  | Sair (logout)                                           | `UserMenu.tsx`, `Sidebar.tsx`                         | Ghost no header; hover vermelho na gaveta.                                                                      | Não é destrutivo: deixar neutro nos dois.                                                                                      |

## Próximos passos

1. `variant="destructive-soft"` no Button, para substituir `profile/danger-button.ts`.
2. Digitar o nome da mesa para apagá-la, reaproveitando o padrão do `DeleteCharacterDialog`.
3. Separar remover e diminuir no `QuantityStepper`.
4. Zerar testes contra a morte com Desfazer.
