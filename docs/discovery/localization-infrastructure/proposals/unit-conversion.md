# Conversão de unidades para o português — v0.2

**Data:** 2026-11-27. **Estado:** as três escolhas abertas foram decididas pela Rebeca em 27/11 (milha × 1,5; libra × 0,5; "1,5 quilômetro"). Nada implementado ainda. A evidência, com contagens e exemplos, está em [unit-conventions-evidence.md](../research/unit-conventions-evidence.md); os números se repetem com `node docs/discovery/localization-infrastructure/scripts/unit-conventions.mjs`.

**Regra de origem:** nada aqui inventa convenção. Cada linha diz o que o português aprovado do SRD 5.1 faz (476 medidas alinhadas em 233 textos) e o que o código do app faz. Onde os dois discordam, ou o conteúdo discorda de si mesmo, a linha fica para decisão.

## Tabela

| Unidade | Proposta | No pt aprovado do 5.1 | No código do app | Estado |
|---|---|---|---|---|
| Pé → metro | × 0,3 (5 pés = 1,5 m) | 387 de 400 | × 0,3 (`useSpellDisplay.ts:135`) | Fechado |
| 1 pé | "30 cm" | 16 de 16 | — | Fechado |
| Polegada → cm | × 2,5 | 9 de 12 (3 usam × 3) | — | Fechado |
| Galão → litro | × 4 | 8 de 8 | — | Fechado |
| Pint → ml | 500 ml | 5 de 5 | — | Fechado |
| **Milha → km** | **× 1,5** (decisão da dona, 27/11) | × 1,5 em 11 de 22; × 1,6 arredondado em 10. "1 milha" é sempre 1,5 km (5 de 5). O mesmo valor aparece dos dois jeitos: 10 milhas vira 15 km (3×) e 16 km (1×) | × 1,6 (`useSpellDisplay.ts:137`): **precisa mudar para × 1,5** | Decidido |
| **Libra → kg** | **× 0,5** (decisão da dona, 27/11) | × 0,5 em 6 de 11; × 0,45 em 4 | ÷ 2, travado por teste (`useItemFormat.ts`) | Decidido |
| Onça | À mão | 2 casos (30 g; 150 ml) | — | Sem regra |
| Pé quadrado, pé cúbico, milha por hora | À mão | Fatores misturados (30, 28,3, 24 e 40 litros por pé cúbico) | — | Sem regra |

**Consequências das decisões:** a linha 137 do `useSpellDisplay.ts` passa a × 1,5 (mudança de código do app, fora desta descoberta; vale uma issue). Dez textos aprovados do 5.1 que usam × 1,6 ficam fora da convenção e entram na lista de correções à parte. O pipeline do PoC usou × 0,45 para libras e precisa ser corrigido para × 0,5.

Não foi verificado qual fator os livros oficiais em português usam.

## Escrita

| Regra | Evidência |
|---|---|
| Vírgula decimal: "1,5" | 116 a 0 |
| Unidade por extenso: "metros", não "m" | 508 de 510 |
| Singular abaixo de 2: "1,5 metro", "1 metro"; plural de 2 em diante | "1,5 metro" 68 × "1,5 metros" 4 |
| No máximo uma casa decimal; inteiro quando der | — |
| "1,5 quilômetro", no singular (decisão da dona, 27/11) | 3 a 3 no conteúdo |

## Formas compostas

O código troca só o número e a unidade, na fonte em inglês, antes do modelo. A ordem das palavras em português é do modelo.

| Inglês | Depois do código | Português esperado |
|---|---|---|
| `20-foot-radius sphere` | `6-meter-radius sphere` | esfera de 6 metros de raio |
| `10-foot cube` | `3-meter cube` | cubo de 3 metros |
| `60-foot cone`, `100-foot line` | `18-meter cone`, `30-meter line` | cone de 18 metros, linha de 30 metros |
| `5 to 20 feet` | `1.5 to 6 meters` | 1,5 a 6 metros |
| `20/60 feet` (alcance de arma) | `6/18 meters` | 6/18 metros |
| `10-foot square` | `3-meter square` | quadrado de 3 metros de lado |

**Erro no conteúdo aprovado, a corrigir à parte:** em 5 magias (por exemplo `grease`), "10-foot square" virou "3 metros quadrados", que é outra área (3 m², não 9 m²). `entangle` faz certo: "quadrado de 6 metros de lado".

## Casos que o código não converte e manda para revisão à mão

O validador marca o segmento; ele não passa calado.

- **Unidade sem número ao lado:** "a number of feet equal to 5 times your Exhaustion level", "per foot", "per inch". Aqui a conta muda (5 pés por nível vira 1,5 metro por nível); é risco de erro crítico.
- **Número por extenso:** "ten feet".
- Área, volume, velocidade e onças (tabela acima).

## O que nunca muda

Níveis, dados, CDs, durações, custos e contagens. A conversão só age em número seguido de unidade, então não toca neles. Parecidos encontrados no inglês e que ficam fora por não terem número: "land on its feet" (parte do corpo), "ice pounds" (verbo). Nenhuma medida aparece dentro de tag `{@…}` nem no texto de exibição de tag (0 em 343 tags do pt 5.1).

## Como o validador confere

Ele refaz a conversão a partir da fonte e compara com os números do alvo. Os demais números têm de ser iguais aos da fonte. Uma tradução com o número convertido errado, ou convertido duas vezes, falha.

## Outros idiomas

| Idioma | O que existe hoje | Estado |
|---|---|---|
| Espanhol | O 5.1 converte para métrico, abreviado ("m", "km"); o 5.2 mantém pés (434 de 442) | **Decidir** antes de qualquer lote em espanhol |
| Sueco | Nada | Sem revisor, sem lote |

## O que fica onde

A tabela e as regras de escrita são **política do RPGWorld**: ficam num arquivo de configuração do adaptador, por idioma. O núcleo do pipeline só sabe "aplique a política de unidades deste idioma e confira o resultado".

## Inconsistências no conteúdo aprovado (não mexer pelo pipeline)

O lote só preenche chave vazia; estas correções são trabalho separado, em PR próprio:

- 13 de 400 medidas em pés fora de × 0,3. Duas sem converter: `hunting-trap` (3 pés → "3 metros") e `prismatic-wall` (30 pés → "30 metros").
- `gust-of-wind` e `plant-growth`: 4 medidas cinco vezes maiores que a fonte; o colchete em inglês do próprio texto mostra outro número que o `en.json`.
- 183 textos com sobras em inglês entre colchetes (402 trechos).
- "5 pés" sem converter em `arcane-sword`.

## Não verificado

- A convenção dos livros oficiais em português.
- Se alguma magia tem alcance em milhas (onde a linha 137 do app agiria).
- O alinhamento da evidência é por posição; 14 textos não alinharam e ficaram só listados.
