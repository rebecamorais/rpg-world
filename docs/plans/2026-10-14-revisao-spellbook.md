# Revisão de UX/UI: Spellbook e modal de magias

**Data:** 2026-10-14
**Como:** navegação real no `next dev` (player de exemplo), desktop 1440×900 e celular 412×915,
estados: lista, card expandido, troca de página, busca sem resultado. Mais leitura do código de
`Spellbook`, `SpellSearchDialog` e `spell-card/*`.

**Status (2026-10-15):** blocos 1 a 5 entregues no PR #60; o seed do Alatar também. Ficou para
depois só o limite de preparadas ("3/7" do S3), que depende de uma regra de preparo por classe.

A pergunta que guiou a revisão: **o que o jogador faz aqui?** Fora da mesa, monta o grimório
(procura e aprende magias da sua classe). Durante a sessão, consulta rápido o que uma magia faz e
quais estão preparadas. As duas telas hoje servem bem para _ler uma magia_, e mal para essas
duas tarefas.

## Modal de magias (montar o grimório)

| #   | Problema                                                                                                                                                                    | Impacto | Proposta                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | **Não dá para ver quais magias já foram aprendidas.** True Strike, aprendida, aparece igual às outras; só ao expandir aparece "Esquecer".                                   | Alto    | Selo "Aprendida" (ícone de check + texto) no card recolhido.                                                                                         |
| M2  | **Aprender exige 3 passos:** expandir, rolar até o fim do card, clicar. Com 319 magias, montar um grimório de 15 é cansativo.                                               | Alto    | Botão de aprender/esquecer direto no card recolhido (ícone com rótulo acessível); o expandir fica só para ler.                                       |
| M3  | **Começa mostrando todas as classes e níveis.** Um mago vê magias de druida e de 9º círculo primeiro.                                                                       | Alto    | Filtro de classe já vindo com a classe do personagem (quando ela bate com uma do sistema), com a opção de trocar.                                    |
| M4  | **Busca só no Enter/botão, filtros aplicam na hora.** Dois comportamentos diferentes na mesma barra.                                                                        | Médio   | Busca enquanto digita (debounce ~300ms); o botão "Buscar" sai.                                                                                       |
| M5  | **O nível não aparece no card recolhido.** Na página 2 há truques e magias de 1º nível misturados, e não dá para distinguir sem expandir.                                   | Médio   | Nível no card ("Truque", "1º círculo") junto da escola.                                                                                              |
| M6  | **"Mostrando 12 de 319"** não diz quais; 27 páginas de 12 itens. A lista também some e reaparece a cada página (plano de performance, fase 5).                              | Médio   | "1–12 de 319"; manter a lista anterior enquanto carrega; voltar a rolagem para o topo ao trocar de página. Avaliar páginas de 24.                    |
| M7  | **No celular, busca + 4 filtros ocupam ~1/3 da tela**, sobrando pouco para a lista.                                                                                         | Médio   | No celular, filtros num botão "Filtros (n)" que abre um painel; na tela fica só a busca.                                                             |
| M8  | **"Limpar filtros" só existe na tela vazia;** não há indicação de quantos filtros estão ativos.                                                                             | Baixo   | Contador de filtros ativos e "Limpar" sempre visível quando há algum.                                                                                |
| M9  | **Acessibilidade:** busca sem rótulo (só placeholder); quantidade de resultados não é anunciada; os ícones de componente (V/S/M) são botões, 25 paradas de Tab em 12 cards. | Médio   | `aria-label` na busca; região `role="status"` com "N magias"; ícones de componente sem foco próprio (o rótulo já está no texto para leitor de tela). |

## Spellbook (consultar durante a sessão)

| #   | Problema                                                                                                                                       | Impacto | Proposta                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1  | **Preparar está escondido dentro do card expandido.** É a ação mais comum de quem joga com conjurador preparado.                               | Alto    | Marcador de "preparada" clicável no card recolhido (ícone de marcador, com estado visível).                                                            |
| S2  | **Um nível por vez (abas).** Para ver o grimório inteiro é preciso clicar em cada nível; o índice de 200px fica quase vazio com poucos níveis. | Alto    | Lista única agrupada por nível, com o índice virando atalhos (âncoras) e cabeçalhos de nível fixos ao rolar. No celular, o seletor vira atalho também. |
| S3  | **"0 preparadas" sem limite e escondido no celular** (`hidden sm:inline`).                                                                     | Médio   | Mostrar em todas as larguras; quando a regra permitir calcular, "3/7 preparadas".                                                                      |
| S4  | **"1 SPELLS FOUND"**: plural errado e vocabulário de busca numa página que não é busca. O título "Cantrips" também repete o rótulo da aba.     | Baixo   | "1 magia" / "3 magias" com plural do ICU; título do grupo menor (h2 de seção, não `text-display`).                                                     |
| S5  | **Esquecer é um clique, sem confirmação nem desfazer.**                                                                                        | Médio   | Toast "Magia esquecida" com botão "Desfazer" (mais leve que um diálogo de confirmação).                                                                |
| S6  | **Estado vazio:** sem magias o componente retorna `null`; a página fica só com o cabeçalho.                                                    | Médio   | Estado vazio com "Adicionar magia" (abre o modal).                                                                                                     |

## Visual dos cards (as duas telas)

- **Quase tudo fica amarelo.** Sem tipo de dano, o card usa o mesmo tema dourado; numa lista de
  truques, 4 em 5 cards são iguais. A cor deixa de informar.
- **Texto sobre fundo carregado.** Gradiente radial + pontilhado + ícone gigante de 160px atrás
  da descrição expandida. Ler um parágrafo de regra sobre isso cansa, e a direção decidida foi
  "fantasia sóbria".
- **Proposta:** card recolhido com superfície lisa; a cor da magia só na faixa/ícone à esquerda
  e nos selos. O fundo temático (gradiente, ícone grande) só no card expandido e bem mais fraco
  atrás do texto. Isso também remove a maior parte dos efeitos das fases 2 e 3 do plano de
  performance.
- **Chips do card expandido** repetem tempo/alcance/duração que já estão no cabeçalho do card
  recolhido. Ao expandir, o cabeçalho troca para escola + nível e os chips ficam como a única
  fonte desses dados (hoje parte some, parte duplica).

## Fora do escopo, mas encontrado

- **Seed do personagem "Alatar, o Sábio" quebrado:** id `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`
  (`database/db-dev/seeds/02-seed-mage-character.sql`) não é um UUID válido para `z.uuid()` (Zod 4
  exige versão/variante). A API responde 400 para ele, então a ficha do personagem de exemplo
  não abre. Corrigir o seed com um UUID v4 válido.

## Ordem sugerida

1. **Rápidos e de alto impacto:** M1, M2, S1, S4, M9 (selos e ações no card recolhido, plural,
   rótulos). Um commit por item.
2. **Fluxo de busca:** M3, M4, M5, M6, M8.
3. **Spellbook em lista única:** S2, S3, S5, S6.
4. **Visual dos cards** (junto das fases 2 e 3 do plano de performance), com baselines visuais.
5. **Celular:** M7.
6. Seed do Alatar (independente, pode ir a qualquer momento).
