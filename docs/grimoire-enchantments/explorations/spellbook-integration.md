# Grimório no spellbook (17/11)

A integração das decisões 26 a 30 aos cards reais de magia: o spellbook e a busca de magias (onde se aprende). Decisão 31 na [spec-mãe](../../superpowers/specs/2026-11-13-grimoire-enchantments-design.md).

## O que entrou

- **Card fechado:** o emblema da escola no cabeçalho, em todas as magias, como máscara WebP pintada na cor da magia (decisão 30). O dano continua na linha de detalhes, com o ícone do tipo. Dá para ver a escola e o dano sem abrir a magia. Anel de luz no hover (só onde existe mouse).
- **Card aberto:** o efeito por `spellEffectOf` (o dano, senão a escola), o texto das regras na caixa de leitura (`effectTextBackdrop`), a Borda arcana parada e o Giro de luz uma vez (`SPELL_CARD_BORDER`).
- **Onde:** `spellGrimoireOf(spell)` em `src/frontend/components/character/spells/spell-card/spell-grimoire.tsx`, espalhado no `<SpellCard>` do `Spellbook` e do `SpellSearchDialog`. Os objetos (efeitos, emblemas, borda) são criados uma vez, no módulo, e o memo do `SpellCard` continua valendo: abrir um card só re-renderiza os cards que mudaram (teste do `Spellbook`).
- **Fora:** inventário, ficha, seletor de tema, materiais e componentes novos do catálogo.

## Volta ao estilo de hoje

`NEXT_PUBLIC_GRIMOIRE_SPELLBOOK=off` e uma build nova (na Vercel: a variável do projeto e um redeploy). `spellGrimoireOf` passa a não dar nada, e o `SpellCard` sem `effect`, `icon` e `border` é o de hoje. Nenhum dado muda.

## O efeito entra um quadro depois

A primeira medição achou um quadro de 67 ms ao abrir no celular lento, contra 50 ms hoje. O traço mostrou o porquê: o desenho do efeito (markup SVG de até 54 KB, o do frio) era interpretado na mesma tarefa do clique, que passou de 38 para 53 ms. Agora o efeito monta dois `requestAnimationFrame` depois (`AfterNextFrame`, no `SpellCard`): o card abre no quadro do clique e o desenho entra no seguinte. Ele já entra com um fade, então a espera não aparece. Só o invólucro re-renderiza, não o card.

## Validação

Com um personagem com uma magia de cada dano (13) e de cada escola sem dano (8), no computador e no celular (Pixel 7), nos dois temas:

- os 21 cards fechados e abertos (capturas de tela);
- teclado: Tab chega ao card, Enter abre e fecha;
- movimento reduzido: nenhuma animação rodando depois de abrir;
- `forced-colors`: os enfeites somem, o emblema fica na cor do texto do sistema (como o ícone de hoje);
- aprender, preparar e esquecer: `e2e/spells.spec.ts` e os testes unitários, com o Grimório ligado.

**Achado que já existia:** no card **aberto**, o anel de foco do teclado não aparece, porque o fundo do card aberto fica por cima do botão. Acontece igual no card de hoje (conferido nas duas builds); fica como sugestão fora deste PR.

## Medição

`scripts/grimoire-spellbook-bench.ts`: builds de produção com e sem Grimório, lado a lado, contra o banco de teste; um personagem com 100 magias (todas as de dano primeiro, as 13 tipos); 3 amostras por cenário, intercaladas. Fases: carga (LCP, CLS), rolagem da lista inteira, hover em 6 cards (computador) e abrir 3 cards seguidos. Celular = 390 × 844, DPR 2, CPU 4x mais lenta. Dados em [spellbook-bench.json](spellbook-bench.json) (final) e [spellbook-bench-round1.json](spellbook-bench-round1.json) (antes do `AfterNextFrame`).

| Aparelho | Tema   | Build    | CLS máx | Rolagem: quadro p95 | Rolagem: quadros > 33 ms | Rolagem: style (ms) | Abrir: quadro mais longo | Abrir: frames longos (LoAF) | Abrir: quadros > 33 ms (9 aberturas) |
| -------- | ------ | -------- | ------- | ------------------- | ------------------------ | ------------------- | ------------------------ | --------------------------- | ------------------------------------ |
| desktop  | escuro | Grimório | 0,0027  | 16,8                | 0                        | 172                 | 16,8                     | 0                           | 0                                    |
| desktop  | escuro | hoje     | 0,0027  | 16,8                | 0                        | 140                 | 16,8                     | 0                           | 0                                    |
| desktop  | claro  | Grimório | 0,0027  | 16,7                | 0                        | 177                 | 16,8                     | 0                           | 0                                    |
| desktop  | claro  | hoje     | 0,0027  | 16,8                | 0                        | 140                 | 16,8                     | 0                           | 0                                    |
| celular  | escuro | Grimório | 0       | 16,8                | 0                        | 329                 | 50,1                     | 6 por amostra               | 5                                    |
| celular  | escuro | hoje     | 0       | 16,8                | 0                        | 311                 | 50,0                     | 6 por amostra               | 1                                    |
| celular  | claro  | Grimório | 0       | 16,8                | 0                        | 340                 | 50,0                     | 6 por amostra               | 6                                    |
| celular  | claro  | hoje     | 0       | 16,7                | 0                        | 302                 | 33,4                     | 6 por amostra               | 0                                    |

- **CLS:** o Grimório não acrescenta nada. Os 0,0027 do computador existem nas duas builds e vêm do aviso "Novo: edição e recursos aqui" que aparece no cabeçalho da página depois do primeiro quadro. Numa lista curta há ainda o tamanho reservado dos cards antes de renderizar (`contain-intrinsic-size`), igual nas duas.
- **Rolagem:** sem regressão nos quadros (p95 de 16,7 ms, nenhum acima de 33 ms nas duas). O style da rolagem inteira sobe uns 20% no computador (máscara do emblema e o anel dentro de `(hover: hover)`), sem efeito nos quadros.
- **Abrir:** no computador, nenhum quadro acima de 16,8 ms. No celular lento:
  - **Frames longos (acima de 50 ms):** o card de hoje já tem 2 por abertura nesse aparelho, da renderização do React, e o Grimório não acrescenta nenhum (cerca de 325 ms nas três aberturas, nas duas builds; antes do `AfterNextFrame` eram 435 ms).
  - **Quadro mais longo:** 50 ms, três atualizações de tela, como hoje no tema escuro. Uma amostra mediu 50,1 ms, que conta como acima de 50 ms pelo arredondamento do relógio.
  - **Quadros de 33 ms (um quadro perdido):** o Grimório acrescenta. Foram 11 em 18 aberturas, contra 1 hoje. O `AfterNextFrame` tirou a leitura do desenho do quadro do clique, mas ela continua custando um quadro logo depois, quando o efeito entra (com fade). O próximo passo, se for preciso, é baratear o próprio desenho: o do frio tem 54 KB de SVG. Esperar mais quadros só mudaria o quadro perdido de lugar.
  - **Paint e raster:** sobem ao abrir (de 490 para 830 ms nas três aberturas), fora da thread principal.
