# Revisão das telas (2026-11-15)

Revisei todas as telas do app (41 rotas). Para isso:

- tirei prints do app rodando, com o banco local e as contas `mestre` e `playerChilli`, no desktop escuro e claro e em 390px;
- li o código de cada tela;
- conferi o design system inteiro.

Isto continua o [plano de 2026-10-14](../plans/2026-10-14-revisao-frontend-ui-ux.md), cujas fases 0–2 já foram entregues, e não repete o que ele já resolveu.

Severidade: **Alta** atrapalha o uso ou pode fazer perder dados. **Média** é inconsistência visível ou atrito. **Baixa** é acabamento. Sugestões subjetivas aparecem como _(sugestão)_.

## Documentos

| Documento                                                        | O que tem                                                                                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [fase-3-resultados.md](fase-3-resultados.md)                     | Fase 3 (configurações da mesa, convite, perfil e conta, novo personagem, Lore e Aparência): causas, achados de uma tela só e o status dos achados antigos |
| [fase-2-resultados.md](fase-2-resultados.md)                     | Fase 2 (mesa, baú, diário, listas e navegação): causas, achados de uma tela só e o status dos achados antigos                                             |
| [fase-1-resultados.md](fase-1-resultados.md)                     | Fase 1 (ficha, combate e modais): 12 causas, achados de uma tela só e o status dos achados antigos                                                        |
| [plano-por-tela.md](plano-por-tela.md)                           | O plano de review de UX/UI de cada tela e modal: método, checklist, ordem e pontos de cada uma                                                            |
| [acoes-destrutivas.md](acoes-destrutivas.md)                     | A regra de vermelho e confirmação, e o inventário das 21 ações que apagam ou removem algo                                                                 |
| [componentes-e-design-system.md](componentes-e-design-system.md) | Cores e tokens (inclusive o tema claro), tipografia, espaçamento, raio e sombra, ícones e primitivos duplicados                                           |
| [telas-publicas-e-conta.md](telas-publicas-e-conta.md)           | Landing, features, login, cadastro, senha, username, perfil, exclusão de conta, header, sidebar e footer                                                  |
| [telas-personagens-e-ficha.md](telas-personagens-e-ficha.md)     | Lista de personagens e NPCs, novo personagem, ficha (status, lore, grimório, inventário), modo só leitura e demo                                          |
| [telas-mesas.md](telas-mesas.md)                                 | Lista de mesas, convite, abas Mesa, Combate, Diário e Baú, configurações e ficha vista pela mesa                                                          |

## Feito neste PR

- **Confirmação dentro do app** (`useConfirm`) no lugar dos 13 `window.confirm`. Quando apaga algo, o diálogo é vermelho, o foco começa em Cancelar e o botão diz o verbo da ação.
- **Variante `destructive-ghost`** (texto vermelho) em todos os botões de remover linha: tirar jogador, recusar, cancelar convite, remover imagem e diário, sair da mesa, tirar do combate, encerrar combate. O botão de esquecer magia agora é vermelho sempre, não só no hover.
- **Vermelho de verdade:** o botão destrutivo passou de texto preto sobre `#ef4444` (parecia placa de aviso) para texto branco sobre `#dc2626` (4,8:1, AA).
- **Zona de perigo da mesa:** "Apagar mesa" saiu do meio do card Gerenciar e foi para um card próprio no fim das configurações. O card e o diálogo dizem o que se perde.
- Detalhes: espaço entre os cards das configurações da mesa, título vermelho na zona de perigo da conta, e `trim()` no nome digitado para excluir um personagem.

## Prioridades sugeridas (próximos PRs)

1. **Tema claro com camadas visíveis:** card, muted e secondary têm a mesma cor, e a borda fica em 1,2:1 ([design system #1–3](componentes-e-design-system.md#cores-e-tokens)).
2. **`text-label` fora de textos de ajuda e botões:** frases longas em caixa alta nas configurações da mesa, nos botões da ficha e no "Jogado por @USERNAME" ([design system #13](componentes-e-design-system.md#tipografia)). _Em parte resolvido: as dicas das configurações da mesa já estão em `text-caption` (mesas 25, [fase 3](fase-3-resultados.md#achados-antigos)); sobram rótulos e o botão "CONCLUIR" do Configurar card ([fase 3, causa 11](fase-3-resultados.md#11-modais-da-status))._
3. **Perfil:** a cor do tema é salva mas não é usada em lugar nenhum, nenhum swatch aparece selecionado, e não há onde trocar a senha ([públicas #1–3](telas-publicas-e-conta.md#configurações--perfil-settingsprofile)). _Continua aberto: a fase 3 confirmou os três e achou que o perfil não apaga o nome nem a cor ([fase 3, causas 3 e 5](fase-3-resultados.md#3-perfil-nao-apaga))._
4. **Rótulos dos números de combate** sempre visíveis na ficha ([ficha #1](telas-personagens-e-ficha.md#ficha-status)).
5. **Modo só leitura** sem controles desabilitados: lixeiras e steppers que não fazem nada ([ficha #12](telas-personagens-e-ficha.md#ficha-modo-só-leitura-mestre-e-demo), [mesas #32](telas-mesas.md#ficha-vista-pela-mesa-partiesidcharactersid)).
6. **Primitivos que faltam:** `Button size="icon-sm"/"xl"`, `variant="destructive-soft"`, `Card padding` e um `Badge` com tom ([design system](componentes-e-design-system.md#primitivos-e-duplicação)).
7. **Ações destrutivas restantes:** digitar o nome da mesa para apagá-la, separar remover de diminuir no estoque, e Desfazer ao zerar os testes contra a morte ([acoes-destrutivas.md](acoes-destrutivas.md#próximos-passos)).
