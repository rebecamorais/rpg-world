# Configuração de vida e sistema de magia

**Data:** 2026-10-15
**Quando:** depois de terminar a revisão do Spellbook (`2026-10-14-revisao-spellbook.md`).
**Como:** leitura de `CombatStatsSection`, `CombatStatsDialog`, `HealthPointsCard`,
`MagicSystemCard` e `magic-system/*`. Falta conferir no `next dev` (desktop e celular) antes de
começar.

A pergunta: **onde o jogador procura para mudar a vida máxima ou trocar o sistema de magia?** No
card de vida e no card de magia. Hoje a configuração dos dois fica num único botão longe deles.

## Problemas

| #   | Problema                                                                                                                                                                                                               | Impacto | Proposta                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **O botão fica no lugar errado.** O ícone de engrenagem está no cabeçalho de combate, ao lado de CA, iniciativa, deslocamento e dado de vida, mas não configura nenhum deles. O rótulo diz "Editar status de combate". | Alto    | Tirar o botão do cabeçalho de combate. Cada card ganha o seu: engrenagem pequena no canto superior direito do card de vida e do card de magia.     |
| C2  | **Um botão para duas coisas.** O mesmo diálogo mistura vida (máxima e temporária) com sistema de magia; o título diz "Configuração do Sistema Mágico" mesmo na parte de vida.                                          | Alto    | Duas configurações separadas: "Configurar vida" e "Configurar magia", cada uma aberta pelo botão do seu card.                                      |
| C3  | **Ocupa espaço.** No celular o botão de 40px fica numa linha só dele (`flex-col` + `justify-end`) embaixo dos 4 atributos.                                                                                             | Médio   | Com o botão dentro dos cards, o cabeçalho de combate fica só com os atributos. Ícone pequeno (14–16px), mas com área de toque de 44px (padding).   |
| C4  | **Dois lugares para trocar o sistema de magia.** O `Select` no cabeçalho do card e as abas do diálogo fazem a mesma coisa. O card cai em `'points'` sem valor salvo; o diálogo cai em `'none'` (nenhuma aba ativa).    | Médio   | Trocar o sistema só na configuração de magia; no card, o nome do sistema vira rótulo fixo. Um único padrão (`'points'`) em um lugar só.            |
| C5  | **"Cancelar" e "Salvar" que não fazem o que dizem.** As mudanças se aplicam na hora; "Cancelar" não desfaz, e o salvar de verdade é a barra fixa da ficha.                                                             | Médio   | Sem Cancelar/Salvar: aplica ao vivo e o diálogo tem só "Concluir" (ou fecha no X). O salvamento continua na barra da ficha, como o resto da ficha. |
| C6  | **Textos remendados.** `"{t('hitPoints')} Max"` concatenado no JSX; fallbacks em inglês (`                                                                                                                             |         | 'Combat Configuration'`, `                                                                                                                         |     | 'Hit Points'`) que nunca aparecem com as chaves existentes. | Baixo | Chaves próprias em `messages/pt.json` e `en.json` (`hpMaxLabel`, `configureHp`, `configureMagic`…) e remover os fallbacks. |

## Proposta de interface

- **Card de vida:** engrenagem no canto superior direito, alinhada com o "PV". Como são poucos
  campos (vida máxima e, se não estiver no card, temporária), um `Popover` ancorado no botão basta;
  não precisa de diálogo.
- **Card de magia:** engrenagem no canto superior direito, alinhada com o nome do sistema. Abre um
  diálogo (no celular, ocupando a tela ou como `Sheet` de baixo) com:
  - escolha do sistema (espaços de magia / pontos de magia), como controle segmentado;
  - capacidade do sistema escolhido (máximo de pontos, ou máximo por círculo de 1 a 9).
- **Botões:** `variant="ghost"`, ícone `Settings2` em `text-muted-foreground`, ficando
  `text-character-flare` no hover/foco. `aria-label` específico: "Configurar vida máxima" e
  "Configurar sistema de magia".
- **Cabeçalho de combate:** só os 4 atributos; no celular, a grade 2×2 sem a linha extra.

## Testes

- `CombatStatsSection.unit.test.tsx`: o botão sai do cabeçalho; testar cada configuração
  abrindo pelo seu card (vida máxima muda o "/ N" do card; trocar o sistema troca o card).
- E2E da ficha: abrir as duas configurações por `getByRole('button', { name: … })`.
- Baselines visuais da ficha (desktop e celular) atualizadas.

## Ordem sugerida

1. C6 (textos e chaves de i18n), base para o resto.
2. C1 + C2 + C3: botões nos cards, configurações separadas, cabeçalho de combate enxuto.
3. C4: sistema de magia trocado só na configuração.
4. C5: aplicar ao vivo e tirar Cancelar/Salvar.
5. Testes e baselines visuais. Um commit por item, num PR só.
