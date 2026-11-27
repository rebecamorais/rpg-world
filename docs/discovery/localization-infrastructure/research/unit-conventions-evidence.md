# Conversão de unidades no conteúdo aprovado: evidências

Objetivo: documentar, com contagens, como o conteúdo em português (pt) já aprovado converte medidas imperiais, para escrever uma especificação determinística de conversão sem inventar convenção diferente da que existe. Este documento só relata o que foi medido; não recomenda convenção. Os pontos de decisão estão no fim.

Tudo foi medido pelo script [`scripts/unit-conventions.mjs`](../scripts/unit-conventions.mjs) (sem dependências; `node docs/discovery/localization-infrastructure/scripts/unit-conventions.mjs` na raiz do repo; roda em cerca de 0,3 s e só lê arquivos). Os números abaixo são a saída dele.

## 1. O que foi medido

| Item                                                                                                          | Valor                                                                          |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Base principal                                                                                                | `content/dnd5e/srd-5.1/i18n/{en,pt}/{spells,items,conditions,classes}.json`    |
| Chaves de texto em en (todos os campos de texto, achatados em caminhos como `spells:acid-splash/description`) | 1.959                                                                          |
| Pares com os dois lados preenchidos e pt diferente de en ("traduzidos")                                       | 1.561                                                                          |
| Pt vazio ou en vazio / pt igual a en / chave faltando no pt                                                   | 392 / 5 / 1 (`classes:sorcerer/resources/sorcery-points/note`)                 |
| Campos traduzidos no pt 5.1                                                                                   | name 930, description 520, higherLevel 91, subclassTitle 12, note 4, trigger 4 |
| Strings com medida imperial em en                                                                             | 246 (519 medidas)                                                              |
| Strings alinhadas (mesmo número de medidas nos dois lados)                                                    | 233 (476 medidas)                                                              |
| Strings não alinhadas (contagens diferentes; ficam fora das tabelas de valor e estão listadas na seção 7)     | 14                                                                             |
| Campos das medidas alinhadas                                                                                  | description 453, higherLevel 10, name 10, trigger 3                            |

Como o script mede (fato do método, com limite):

- Em cada string, tags `{@tipo a|b|c}` são trocadas pelo texto de exibição (3º segmento, ou o 1º se não houver). As sobras entre colchetes do pt (`[20-foot cube]`) são removidas antes de extrair o valor em português.
- A extração é por regex, uma por idioma, em ordem de aparição. O pareamento en x pt é por posição, só quando a contagem é igual. Não há alinhamento por palavra.
- Em en: número (inclusive `1,000`, `1/4`, `½`) mais unidade (feet, foot, ft, mile, pound, inch, gallon, ounce, yard, pint, quart, mph), com prefixo `cubic`/`square`/`sq.`, formas `N-foot`, `N by N`, `N to N`, `N or N` e as formas sem número `half-mile`, `a/one mile|foot`, `every|per foot`, `an extra foot`.
- Em pt: número com vírgula/ponto mais unidade (metro, quilômetro, centímetro, mililitro, litro, quilo, grama, pé, milha, libra, polegada, jarda, galão, onça, pinta, abreviações, `metro³`).
- Não coberto pela extração (conferido à mão só nos casos citados): números por extenso (`ten`), `20/60 feet`, `per inch`, `a number of feet equal to ...`.
- Conferi à mão todos os desvios listados nas seções 1, 2 e 7 e uma amostra das formas da seção 6. Não conferi uma a uma as 476 medidas alinhadas.

### 1.1 Sobras em inglês entre colchetes (pt 5.1)

| Contagem                                  | Valor                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Strings pt com colchete                   | 183 (spells 181, classes 2)                                                                                                                 |
| Segmentos `[...]`                         | 402                                                                                                                                         |
| Segmentos com unidade imperial em inglês  | 399                                                                                                                                         |
| Segmentos sem unidade em inglês           | 3 (todos em português: `[60 pés]` em `classes:bard/.../bardic-inspiration`, `[20 pés]` e `[60 pés]` em `classes:monk/.../deflect-missiles`) |
| Unidades dentro dos colchetes             | ft 362, mi 18, in 15, lb 5, cu ft 3, sq ft 2, gal 1                                                                                         |
| `ft` (abreviação) no pt fora de colchetes | 0 (as 287 ocorrências de `ft` estão todas dentro de colchetes)                                                                              |

O colchete funciona como "texto de origem" da conversão. Comparei o colchete com o en.json, posição a posição, nas strings em que a contagem bate (340 pares): 330 iguais, 10 diferentes. Desses 10, 5 são artefatos do extrator (formato de milhar `40.000` x `40,000` em 3 casos, `0,5 mile` lido como `5 mile`, intervalo `20 - 50 miles`) e 5 são divergências reais entre o colchete e o en.json:

| Chave                               | en.json   | Colchete no pt | pt        |
| ----------------------------------- | --------- | -------------- | --------- |
| `spells:gust-of-wind/description`   | `2 feet`  | `[10 ft.]`     | 3 metros  |
| `spells:gust-of-wind/description`   | `1 foot`  | `[5 ft.]`      | 1,5 metro |
| `spells:plant-growth/description`   | `4 feet`  | `[20 ft.]`     | 6 metros  |
| `spells:plant-growth/description`   | `1 foot`  | `[5 ft.]`      | 1,5 metro |
| `spells:prismatic-wall/description` | `30 feet` | `[100 ft.]`    | 30 metros |

Mais 71 strings ficaram sem comparação (colchete e en com contagens diferentes).

### 1.2 Medidas dentro de tags 5etools

| Conjunto | Tags em en | Tags com medida em algum segmento (en) | Tags com medida no texto de exibição (alvo) |
| -------- | ---------- | -------------------------------------- | ------------------------------------------- |
| pt 5.1   | 343        | 0                                      | 0                                           |
| es 5.1   | 174        | 0                                      | 0                                           |
| es 5.2   | 2.264      | 0                                      | 0                                           |

Tipos de tag em pt 5.1: condition 199, filter 25, optfeature 25, action 16, dc 16, dice 14, item 14, damage 12, spell 7, skill 5, status 4, quickref 3, creature 2, language 1. Nenhuma medida mora dentro de tag nem no segmento de exibição, nos conjuntos medidos. (As tags `{@variantrule Sphere [Area of Effect]|XPHB|esfera}` do 5.2 têm colchetes, mas são parte da tag, não sobra de inglês.)

## 2. Tabelas dos itens 1 a 9

### Item 1. Pés para metros (pt 5.1; valores simples alinhados, 400 medidas, mais 1 intervalo)

Unidade usada no pt: m 379, cm 16, m² 5, km 1. Razão valor_pt / valor_en: 0,3 em 387 de 400 (365 em metros, 16 em centímetros, 5 em m², 1 em km). Desvios: 13 (seção 3).

| en (pés) | n   | Renderizações no pt (n)             |
| -------- | --- | ----------------------------------- |
| 1        | 14  | 30 cm (12); **1,5 m (2)**           |
| 2        | 4   | 60 cm (3); **3 m (1)**              |
| 3        | 8   | **1 m (6)**; 90 cm (1); **3 m (1)** |
| 4        | 2   | **6 m (1)**; 1,2 m (1)              |
| 5        | 60  | 1,5 m (59); 1,5 m² (1)              |
| 6        | 1   | 1,8 m (1)                           |
| 8        | 1   | 2,5 m (1)                           |
| 10       | 69  | 3 m (68); 3 m² (1)                  |
| 15       | 12  | 4,5 m (12)                          |
| 20       | 55  | 6 m (54); 6 m² (1)                  |
| 25       | 3   | 7,5 m (3)                           |
| 30       | 66  | 9 m (64); 9 m² (1); **30 m (1)**    |
| 40       | 10  | 12 m (10)                           |
| 50       | 7   | 15 m (6); 15 m² (1)                 |
| 60       | 46  | 18 m (46)                           |
| 90       | 1   | 27 m (1)                            |
| 100      | 21  | 30 m (21)                           |
| 120      | 2   | 36 m (2)                            |
| 150      | 1   | 45 m (1)                            |
| 200      | 3   | 60 m (3)                            |
| 300      | 6   | 90 m (6)                            |
| 360      | 1   | 108 m (1)                           |
| 500      | 3   | 150 m (3)                           |
| 1000     | 3   | 300 m (3)                           |
| 5000     | 1   | 1,5 km (1)                          |

Leitura da tabela: o script marca "mais de uma renderização" para 1, 2, 3, 4, 5, 10, 20, 30 e 50. Em 5, 10, 20, 30 e 50 a segunda renderização é só a forma "N metros quadrados" (ver item 6), não um valor diferente. Os valores realmente diferentes (em negrito) estão listados na seção 3, com chaves.

Intervalo (1 caso): `5 to 20 feet` vira `1,5 a 6 metros` (`spells:gate/description`, texto do pt: "de 1,5 [5 ft.] a 6 metros [20 ft.] de diâmetro"; a unidade aparece uma vez, depois do segundo número).

### Item 2. Milhas para km (pt 5.1; 22 medidas alinhadas, todas listadas)

Razão valor_pt / valor_en: **1,5 em 11**; 1,6 exato em 4; 1,556 em 2; 1,538 em 1; 1,583 em 1; 1,667 em 1; 2 em 1; mais 1 intervalo (1,6 e 1,6). Agrupando: 11 casos de ×1,5; 10 casos compatíveis com ×1,6 (com arredondamento ou truncamento: 18→28, 13→20, 120→190, 3→5); 1 caso de ×2.

| en (milhas)       | n   | Renderizações no pt (n)                               | Chaves                                                                                         |
| ----------------- | --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 0,5 (`half-mile`) | 1   | 1 km                                                  | `spells:plant-growth/description` (colchete `[0,5 mile]`)                                      |
| 1                 | 5   | 1,5 km (5; "1,5 quilômetro" 3x, "1,5 quilômetros" 2x) | alarm, find-steed, mirage-arcane, sequester, ranger/primeval-awareness                         |
| 3                 | 1   | **5 km**                                              | `spells:commune-with-nature/description`                                                       |
| 5                 | 2   | **8 km (1)**; **7,5 km (1)**                          | control-weather; locate-animals-or-plants                                                      |
| 6                 | 1   | 9 km                                                  | ranger/primeval-awareness                                                                      |
| 10                | 4   | **15 km (3)**; **16 km (1)**                          | 15: fog-cloud, incendiary-cloud, stinking-cloud; 16: phantom-steed                             |
| 13                | 1   | 20 km                                                 | phantom-steed                                                                                  |
| 18                | 2   | 28 km                                                 | teleport (2x)                                                                                  |
| 20                | 1   | 30 km                                                 | stinking-cloud                                                                                 |
| 25                | 1   | 40 km                                                 | animal-messenger                                                                               |
| 50                | 1   | 80 km                                                 | animal-messenger                                                                               |
| 120               | 1   | 190 km                                                | teleport                                                                                       |
| 20 a 50 (`mph`)   | 1   | 32 a 80 km                                            | `spells:storm-of-vengeance/description` ("entre 32 e 80 quilômetros [20 - 50 miles] por hora") |

Todas as 22 ocorrências de km no texto pt estão em strings alinhadas (nenhuma milha ficou sem par). Não existe "1 to 3 miles" no conteúdo (único intervalo de milhas: `20 to 50 miles per hour`).

### Item 3. Outras unidades (pt 5.1, alinhadas)

| Unidade en                               | Alvo           | n   | Razão e renderizações                                                                                                                                                                        |
| ---------------------------------------- | -------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| libra (lb)                               | kg             | 11  | ×0,5 em 6 (2→1, 6→3, 10→5, 30→15, 40→20, 300→150); ×0,45 em 4 (10→4,5; 500→225 2x; 1000→450); ×0,444 em 1 (45→20)                                                                            |
| polegada (in)                            | cm             | 12  | ×2,5 em 9 (1→2,5 7x; 2→5; 6→15); ×3 em 3 (0,5→1,5 2x; 1→3 1x)                                                                                                                                |
| galão (gal)                              | l              | 8   | ×4 em 8 (1→4 3x; 3→12; 10→40 2x; 30→120; 40→160)                                                                                                                                             |
| pinta (pint)                             | ml             | 5   | 500 ml em 5 (`1 pint`→500 ml; `1½ pints`→750 ml)                                                                                                                                             |
| onça (oz)                                | g / ml         | 2   | `1 ounce`→30 g; `4 ounces`→150 ml (37,5 por onça)                                                                                                                                            |
| pé cúbico (cu ft)                        | l, cm, m³      | 9   | 30 l por pé³ em 4 (0,2→6; 1→30; 2→60; 12→360); 340 l para 12 (`secret-chest`, 28,3 por pé³); `1 cubic foot`→cubo de 30 cm de lado (2); 0,5→0,012 m³ (24 l por pé³); 4→0,16 m³ (40 l por pé³) |
| pé quadrado (sq ft)                      | m²             | 2   | 2.500→225 (0,09); 40.000→3.500 (0,0875)                                                                                                                                                      |
| jarda quadrada (sq yd)                   | jarda quadrada | 4   | mantida: `1 jarda quadrada` (só nomes de item)                                                                                                                                               |
| quart, yard (sem "quadrada"), cubic inch | n/a            | 0   | não aparecem alinhados                                                                                                                                                                       |

Unidades sem número em en ("every foot", "an extra foot") caem na seção 7 (não alinhadas).

### Item 4. Formato decimal (pt 5.1, todas as 515 medidas extraídas, alinhadas ou não)

| Formato                                                   | Contagem |
| --------------------------------------------------------- | -------- |
| Inteiro                                                   | 398      |
| Vírgula decimal ("1,5")                                   | 116      |
| Ponto como separador de milhar ("3.500 metros quadrados") | 1        |
| Ponto decimal ("1.5")                                     | **0**    |

Fora das medidas, os únicos `d.d` no texto pt são separadores de milhar (`3.500`, `1.000 PO`, `10.000 PO`, `1.000 anos`): 7 ocorrências, nenhuma é decimal. Valores com vírgula: 1,5 m (72), 4,5 m (12), 2,5 cm (8), 1,5 km (6), 7,5 m (4), 1,5 cm (2), 0,012 m³, 0,16 m³, 0,3 m, 0,6 m, 1,00 m (`1,00 x 1,50 metro`), 1,2 m, 1,5 m², 1,8 m, 2,5 m, 4,5 kg, 7,5 cm, 7,5 km (1 cada). O pt usa duas casas só em `1,00 x 1,50 metro` (`rope-trick`).

### Item 5. Singular, plural e unidade por extenso ou abreviada (pt 5.1)

Metros (sem m² nem m³):

| Valor                                  | "metro" | "metros" | "m" |
| -------------------------------------- | ------- | -------- | --- |
| Exatamente 1                           | 6       | 0        | 0   |
| Entre 0 e 1 (0,3; 0,6)                 | 2       | 0        | 0   |
| Decimal entre 1 e 2 (1,5; 1,8; 1,2)    | 68      | 4        | 1   |
| Decimal de 2 em diante (2,5; 4,5; 7,5) | 0       | 16       | 1   |
| Inteiro maior que 1                    | 0       | 308      | 0   |
| Intervalo                              | 1       | 2        | 0   |

- "1,5 metros" (plural) aparece 4 vezes: `fire-shield`, `wall-of-thorns`, `word-of-recall`, `ranger/hunter`. "1,5 m" aparece 1 vez (`barbarian/berserker/retaliation`) e "4,5 m" 1 vez (`darkness`); as duas abreviações têm espaço entre número e unidade. Não há "1,5m" sem espaço no conteúdo.
- Quilômetro: 1 → "quilômetro" (1); 1,5 → "quilômetro" (3: alarm, find-steed, mirage-arcane) e "quilômetros" (3: sequester, storm-of-vengeance, primeval-awareness); inteiros maiores que 1 e 4,5/7,5 → plural. Nenhum "km" abreviado.
- Quilo: 1 → "quilo" (1); demais → "quilos" (11). Nenhum "kg" abreviado. Centímetro: sempre plural (35, inclusive "1,5 centímetros" 2x). Litro 15, mililitro 6, grama 1: todos por extenso e no plural.
- Resumo por extenso x abreviado (todas as unidades métricas do pt 5.1): por extenso 508, abreviado 2 (os dois "m" acima).
- Concordância fora do padrão (exatamente 1 no plural, ou inteiro maior que 1 no singular): 0, em todas as unidades.
- Unidade métrica ou "pé" sem número antes (formas como "cada metro"): nenhuma de metro; as 5 de "pé/pés" são o corpo ("em pé", "batendo os pés", "pé de cabra").
- Em es 5.1 todas as unidades métricas estão abreviadas (m 362, cm 42, km 20, kg 6, l 4; item 9).

### Item 6. Formas compostas: como o pt reescreve (pt 5.1, strings alinhadas)

Contagens de en (n). A coluna "Formas no pt" resume a janela de 2 palavras antes e 3 depois da medida; "N" é o número.

| Forma em en                                                           | n                     | Formas no pt (contagem)                                                                                                                                                                                      | Exemplos reais                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `N-foot-radius` / `N-foot radius` (esfera, cilindro, emanação)        | 26 + 27               | "raio de N m" (35); "esfera de N m de raio" (8); "cilindro de N m de raio" (4); "N m de raio" após substantivo (resto). Em geral: palavra "raio" antes do número 41 vezes, depois 16, nenhuma 2 (59 medidas) | `antimagic-field`: "A 10-foot-radius invisible sphere" → "esfera antimagia invisível, com 3 metros de raio"; `calm-emotions`: "a 20-foot-radius sphere" → "uma esfera de 6 metros de raio"; `antilife-shell`: "in a 10-foot radius" → "em um raio de 3 metros"                                                   |
| `N-foot cube`                                                         | 21                    | "cubo de N m" (20 de 21); com "de lado" 3 vezes em todo o pt de magias e itens, sem "de lado" 21                                                                                                             | `alarm`: "no larger than a 20-foot cube" → "um cubo de 6 metros de lado"; `conjure-elemental`: "cubo de 3 metros"                                                                                                                                                                                                |
| `N-foot cone`                                                         | 6                     | "cone de N m" (6 de 6)                                                                                                                                                                                       | `burning-hands`: "a 15-foot cone" → "um cone de 4,5 metros"; `cone-of-cold`: "a 60-foot cone" → "um cone de 18 metros"                                                                                                                                                                                           |
| `N-foot line` / `N feet long and N feet wide`                         | 3+                    | "linha de N m de comprimento por N m de largura"                                                                                                                                                             | `lightning-bolt`: "a line 100 feet long and 5 feet wide" → "uma linha de 30 metros de comprimento por 1,5 metro de largura"; `sunbeam`: "5-foot-wide, 60-foot-long line" → "linha de 1,5 metro de largura por 18 metros de comprimento" (a ordem dos adjetivos de en é mantida)                                  |
| `N-foot-wide`, `N feet wide`, `tall`, `high`, `long`, `deep`, `thick` | 13 / 30 / 16 / 6 / 10 | "N m de largura / altura / comprimento / profundidade / espessura" (substantivo depois do número, preposição "de")                                                                                           | `blade-barrier`: "100 feet long, 20 feet high, and 5 feet thick" → "30 metros de comprimento, 6 metros de altura e 1,5 metro de espessura"; `passwall`: "5 feet wide, 8 feet tall, and 20 feet deep" → "... 2,5 metros de altura e 6 metros de profundidade"                                                     |
| `N-foot square` / `N feet square`                                     | 10                    | "N m²" por extenso: "área de 3 metros quadrados" (5 + 2 casos de pé quadrado); "quadrado de N m de lado" (3)                                                                                                 | `grease`: "a 10-foot square" → "uma área de 3 metros quadrados"; `entangle`: "in a 20-foot square" → "um quadrado de 6 metros de lado"; `control-water`: "50 feet square" → "15 metros [50 ft.] quadrados"                                                                                                       |
| `N-foot-by-N-foot`, `N by N`, `N x N`                                 | 2 + 1                 | unidade escrita uma vez no fim: "3 por 6 metros"; ou "1,00 x 1,50 metro"; ou "1d10 x 3 metros de profundidade"                                                                                               | `wall-of-stone`: "10-foot-by-20-foot" → "3 por 6 metros"; `rope-trick`: "3-foot-by-5-foot window" → "janela de 1,00 x 1,50 metro"; `earthquake`: "1d10 x 10 feet deep" → "1d10 x 3 metros de profundidade"                                                                                                       |
| Intervalo `N to M feet/miles`                                         | 2                     | "de N a M metros" (unidade uma vez); "entre N e M quilômetros por hora"                                                                                                                                      | `gate`: "5 to 20 feet in diameter" → "de 1,5 a 6 metros de diâmetro"; `storm-of-vengeance`: "20 to 50 miles per hour" → "entre 32 e 80 quilômetros por hora"                                                                                                                                                     |
| `within N feet`                                                       | 93                    | "a até N m" (67); "alcance de N m" (6); "menos de" (3); "de até" (3)                                                                                                                                         | `acid-splash`: "within 5 feet of each other" → "a 1,5 metro uma da outra"; `alarm`: "within 60 feet" → "dentro de um alcance de 18 metros"                                                                                                                                                                       |
| `to N feet`, `up to N feet`                                           | 33                    | "a até N m" (12); "de até N m" (5); "aumenta para N m" (4)                                                                                                                                                   | `arcane-eye`: "up to 30 feet in any direction" → "por até 9 metros em qualquer direção"                                                                                                                                                                                                                          |
| `more than N feet`, `at least N feet away`                            | 14 + 9 + 2            | "mais de N m" (6); "do que N m" (5); "pelo menos N m de você / de distância"                                                                                                                                 | `blink`: "more than 60 feet away" → "a uma distância de até 18 metros" (reescrito); `faithful-hound`: "more than 100 feet away" → "a mais de 30 metros dele"                                                                                                                                                     |
| `additional N feet`                                                   | 13                    | "por mais N m" (10); "por N m adicionais" (3)                                                                                                                                                                | `daylight`: "for an additional 60 feet" → "por mais 18 metros"                                                                                                                                                                                                                                                   |
| `every N feet`, `every foot`, `per foot`                              | 4 + 1                 | "para cada N m" (4); `every foot` → "cada 0,3 metro"                                                                                                                                                         | `gust-of-wind`: "2 feet of movement for every 1 foot" → "3 metros [10 ft.] de deslocamento para cada 1,5 metro [5 ft.]"; `wall-of-thorns`: "For every 1 foot ... spend 4 feet" → "Para cada 30 centímetros ... 1,2 metro"; `etherealness`: "every foot ... an extra foot" → "cada 0,3 metro ... custa 0,6 metro" |
| `N feet per round`                                                    | 3                     | "N m por rodada"                                                                                                                                                                                             | uma delas: "reduzida para N m por rodada"                                                                                                                                                                                                                                                                        |
| `N miles per hour`                                                    | 5                     | "N quilômetros por hora" ("pelo menos 15 quilômetros por hora")                                                                                                                                              | `fog-cloud`, `stinking-cloud`                                                                                                                                                                                                                                                                                    |
| `N-foot` como parte de nome de item                                   | 4                     | "(N metros)"                                                                                                                                                                                                 | `Ladder (10-foot)` → "Escada (3 metros)"; `Pole (10-foot)` → "Vara (3 metros)"; `Chain (10 feet)` → "Corrente (3 metros)"; `Hempen Rope (50 feet)` → "Corda de Cânhamo (15 metros)"                                                                                                                              |

Ressalvas da extração desta tabela: a coluna 6b do script (posição da palavra da dimensão) usa janela de 3 palavras e pode contar medida vizinha; trate esses números como aproximados. "thick" aparece traduzido para "espessura" e, uma vez, "altura" (`floating-disk`: "1 inch thick" → "2,5 centímetros de altura"), o que é escolha de palavra, não de unidade.

### Item 7. Não convertido (unidade imperial mantida ou número igual)

| Caso                                                     | Contagem | Exemplos                                                                                                                                                |
| -------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unidade imperial por extenso mantida no texto do pt      | 1        | `spells:arcane-sword/description`: "dentro de 5 pés da espada" (o en tem `5 feet` e `20 feet`; o pt só tem essa medida)                                 |
| Unidade imperial mantida em nome de item                 | 4 + 1    | `Canvas/Cotton Cloth/Linen/Silk (1 sq. yd.)` → "(1 jarda quadrada)"; `Ale (gallon)` → "Cerveja (galão)" (sem número; o galão do texto vira litros: 4 l) |
| Sobras entre colchetes em português com unidade imperial | 3        | `[60 pés]`, `[20 pés]`, `[60 pés]` (bard, monk)                                                                                                         |
| Mesmo número, unidade métrica (30 ft → 30 m)             | 2        | `spells:prismatic-wall/description` ("30 feet" → "30 metros [100 ft.]"); `items:hunting-trap/description` ("3 feet long" → "3 metros")                  |
| `ft` ou `pés` fora de colchete e sem conversão ao lado   | 1        | `arcane-sword` (o mesmo caso de cima)                                                                                                                   |
| Unidade imperial no pt 5.1, qualquer string              | 5        | as acima (`jarda quadrada` 4, `pés` 1)                                                                                                                  |

Não alinhadas (14 strings; fora das tabelas): `arcane-hand` (en 6 medidas, pt 7), `arcane-sword`, `call-lightning`, `create-or-destroy-water/higherLevel`, `etherealness`, `rope-trick`, `spiritual-weapon`, `wall-of-force`, `wall-of-ice`, `wall-of-stone`, `items:backpack`, `items:climber-s-kit` (`25 feet`, `25 feet` → "7,5 metros" uma vez), `classes:monk/deflect-missiles` (`20/60 feet` → "6 metros" e "18 metros"), e `classes:rogue/thief` (en "a number of feet equal to your Dexterity modifier" → pt "30 centímetros para cada ponto"). As causas observadas são: pt escreve a unidade uma vez para dois números, pt junta ou separa medidas, forma de en que o extrator não pega (`20/60`, `a number of feet`). Não classifiquei cada uma como erro ou escolha.

### Item 8. Números que nunca mudam, e parecidos

Teste feito: nenhuma medida extraída (en ou pt) se sobrepõe a nível, círculo, dado, CD, duração ou custo.

| Categoria (en)                                  | Strings | Ocorrências | Sobreposição com medida extraída |
| ----------------------------------------------- | ------- | ----------- | -------------------------------- |
| nível (`5th level`)                             | 232     | 342         | 0                                |
| dados (`2d6`)                                   | 170     | 257         | 0                                |
| CD (`DC 15`)                                    | 4       | 4           | 0                                |
| duração (`N minutes`, `N hours`, `N rounds`...) | 95      | 143         | 0                                |
| custo (`N gp`)                                  | 4       | 6           | 0                                |

No pt, a conferência equivalente (círculo/nível, CD, dados, duração) também deu 0 sobreposições. A extração exige número seguido de unidade imperial, então "nível 5", "5d6" e "5 minutos" não casam por construção.

Parecidos (palavras de unidade em en que a regex numérica não pega; todas as ocorrências):

| Tipo                                           | Contagem | Onde                                                                                                                                                           |
| ---------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "feet" como parte do corpo ou sem número       | 5        | `feather-fall` ("land on its feet"), `irresistible-dance` ("tapping its feet"), `arcane-hand`, `etherealness`, `rogue/thief` ("a number of feet equal to ...") |
| "pounds" como verbo                            | 1        | `ice-storm` ("rock-hard ice pounds to the ground")                                                                                                             |
| "gallon(s)" sem número                         | 2        | `ale-gallon/name` ("Ale (gallon)"), `create-or-destroy-water/higherLevel` ("additional gallons")                                                               |
| "foot" com número por extenso                  | 1        | `items:backpack` ("one cubic foot"), e `plant-growth` ("half-mile", tratado como medida)                                                                       |
| Nome de item com medida (convertida no pt)     | 10       | ver tabela de nomes abaixo                                                                                                                                     |
| "5-foot step", "Ten-foot pole" como termo fixo | 0        | não existem no conteúdo medido; "Pole (10-foot)" é um item comum com a medida no nome, convertido para "Vara (3 metros)"                                       |

Nomes de item com medida (campo `name`, 10 pares, todos alinhados): `Canvas (1 sq. yd.)` → `Lona (1 jarda quadrada)`; `Chain (10 feet)` → `Corrente (3 metros)`; `Cotton Cloth (1 sq. yd.)` → `Tecido de Algodão (1 jarda quadrada)`; `Hempen Rope (50 feet)` → `Corda de Cânhamo (15 metros)`; `Ink (1-ounce bottle)` → `Tinta (frasco de 30 gramas)`; `Ladder (10-foot)` → `Escada (3 metros)`; `Linen (1 sq. yd.)` → `Linho (1 jarda quadrada)`; `Pole (10-foot)` → `Vara (3 metros)`; `Silk (1 sq. yd.)` → `Seda (1 jarda quadrada)`; `Silk Rope (50 feet)` → `Corda de Seda (15 metros)`. O id da chave (`hempen-rope-50-feet`) também carrega a medida em inglês (ver `src/frontend/components/character/inventory/item-visuals.ts:82-83`), e o nome em pt não muda o id.

"Pé" como parte do corpo no pt (sem número): "em pé", "batendo os pés", "pé de cabra" (5 ocorrências). "Libra" e "polegada" não aparecem no texto pt.

### Item 9. pt 5.2, es 5.1 e es 5.2

| Conjunto            | Pares traduzidos | Campos traduzidos                                                  | Medidas en | Medidas alinhadas | Colchetes                                          |
| ------------------- | ---------------- | ------------------------------------------------------------------ | ---------- | ----------------- | -------------------------------------------------- |
| pt 5.1 (referência) | 1.561            | name 930, description 520, higherLevel 91, ...                     | 519        | 476               | 183                                                |
| **pt 5.2**          | 768              | **name 765, note 3**                                               | **0**      | **0**             | 0                                                  |
| es 5.1              | 1.236            | name 623, description 334, material 184, higherLevel 91, trigger 4 | 437        | 408               | 0                                                  |
| es 5.2              | 1.728            | name 788, description 628, material 188, higherLevel 124           | 516        | 491               | 0 (as 2 strings com `[...]` são parâmetros de tag) |
| sv 5.1 e 5.2        | 0                | (tudo vazio)                                                       | 0          | 0                 | 0                                                  |

Conclusão de fato sobre pt 5.2: só os nomes estão traduzidos (765 de 768 pares). Nenhuma descrição está traduzida, então **não há evidência de convenção de unidades no pt 5.2**. O pt 5.1 também não tem tradução de `material`.

**es 5.1 converte para o sistema métrico, em abreviação** (contrário à hipótese de que o es mantém os pés):

| Unidade                                 | es 5.1                                                                     | es 5.2                                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Pé                                      | m 333 (×0,3 em 330); cm 26 (30 cm por pé em 25)                            | pés mantidos em 434 (×1); `pies cuadrados` 5; 3 em cm no campo `material` (`secret-chest`: 3 ft → 90 cm, 2 ft → 60 cm 2x) |
| Milha                                   | km 19 (×1,5 em 18, mais 1 intervalo)                                       | milhas mantidas em 9                                                                                                      |
| Libra                                   | kg 6 (×0,5 em 6)                                                           | mantidas em 10                                                                                                            |
| Polegada                                | cm 15 (×2,5 em 14)                                                         | mantidas em 8                                                                                                             |
| Galão                                   | l 3 (×4 em 3)                                                              | mantidos em 6                                                                                                             |
| Onça, pinta                             | não aparecem alinhadas                                                     | mantidas (3, 2)                                                                                                           |
| Pé cúbico                               | metro cúbico escrito "m3", 3 (0,03 m3 em 2; 0,34 m3 em 1, que é 12 pés³)   | pé cúbico 4, pé 4                                                                                                         |
| Pé quadrado                             | "m2", 2 (×0,1: 2.500 → 250 m2; 40.000 → 4000 m2; o pt 5.1 usa 225 e 3.500) | mantido em 2                                                                                                              |
| Formato numérico                        | inteiro 328, vírgula 106                                                   | inteiro 504, milhar com ponto 5                                                                                           |
| Unidade métrica por extenso x abreviada | tudo abreviado: m 362, cm 42, km 20, kg 6, l 4                             | cm 3                                                                                                                      |
| Unidade imperial no alvo                | 0                                                                          | 506                                                                                                                       |

Observação sobre es 5.1: o fator dominante por unidade é o mesmo do pt 5.1 (0,3; 1,5; 0,5; 2,5; 4), e com bem menos desvios (milhas: 18 de 19 em ×1,5, contra 11 de 22 no pt). Um desvio ("60 feet" → "30 cm" em `etherealness`) é artefato de pareamento (o texto es traduz "every foot" para "por cada 30 cm"). O es 5.1 não tem sobras entre colchetes.

**es 5.2 mantém os pés** (434 de 442 medidas em pés ficam em pés; as 8 exceções são "pies cuadrados" e o campo `material` do `secret-chest`). O es 5.1 e o es 5.2 têm convenções opostas. Se isso é decisão de produto ou subproduto de processos diferentes (ex.: tradução automática ou do Weblate vs. outra fonte) não foi verificado.

## 3. Inconsistências no conteúdo aprovado (pt 5.1)

Medidas, não interpretações. Chaves entre parênteses; todas em `description` salvo indicação.

1. **Milhas, dois fatores no mesmo conteúdo.** ×1,5 em 11 de 22 casos, ×1,6 (arredondado) em 10, ×2 em 1. Mesmo valor com duas renderizações: 5 milhas → 8 km (`control-weather`) e 7,5 km (`locate-animals-or-plants`); 10 milhas → 15 km (`fog-cloud`, `incendiary-cloud`, `stinking-cloud`) e 16 km (`phantom-steed`). "1 milha" sempre vira 1,5 km (5 de 5). `half-mile` vira "1 quilômetro" (`plant-growth`), que não bate com ×1,5 (0,75) nem com ×1,6 (0,8). Resultado arredondado para baixo ou para dezena nos casos 18→28 (2x), 13→20, 120→190.
2. **Pés: 387 de 400 em ×0,3; 13 desvios.**
   - 3 pés → 1 m em 6 casos (`detect-evil-and-good`, `detect-magic`, `detect-poison-and-disease`, `floating-disk` 2x, `secret-chest`), mas 3 pés → 90 cm em 1 (`message`) e 3 pés → 3 m em 1 (`items:hunting-trap`, número sem conversão).
   - 8 pés → 2,5 m (`passwall`; ×0,3 daria 2,4).
   - Reescala ×5 em 4 casos (`gust-of-wind`: 2 pés → 3 m e 1 pé → 1,5 m; `plant-growth`: 4 pés → 6 m e 1 pé → 1,5 m). O colchete traz `[10 ft.]`, `[5 ft.]` e `[20 ft.]` no lugar do número do en.json. Em `wall-of-thorns` (texto equivalente: "For every 1 foot ... must spend 4 feet") o pt usa ×0,3 ("30 centímetros" e "1,2 metro"). Duas convenções para o mesmo trecho de regra.
   - 30 pés → 30 m em `prismatic-wall` (colchete diz `[100 ft.]`, en.json diz 30 feet; o pt parece vir de outro texto-fonte).
   - 1 pé → 30 cm em 12 e 1,5 m em 2 (os dois casos de reescala acima).
3. **Libras:** ×0,5 em 6; ×0,45 em 4 (`mage-hand` 10 → 4,5; `floating-disk` e `levitate` 500 → 225; `telekinesis` 1000 → 450); ×0,444 em 1 (`create-food-and-water`: 45 → 20). Mesmo valor 10 lb → 5 kg (`instant-summons`) e 4,5 kg (`mage-hand`).
4. **Polegadas:** ×2,5 em 9; ×3 em 3 (`forcecage` 0,5 pol → 1,5 cm 2x; `message` 1 pol → 3 cm, enquanto `arcane-eye`, `detect-*` etc. usam 2,5 cm para 1 pol).
5. **Pé cúbico:** 30 l em 4 casos, 28,3 l em 1 (`secret-chest`: 12 → 340 l, `chest`: 12 → 360 l), 24 l em 1 (0,5 → 0,012 m³), 40 l em 1 (4 → 0,16 m³ no `barrel`, ao lado de "40 galões → 160 litros"); "1 cubic foot" vira "cubo de 30 cm de lado" em `prestidigitation` e "30 litros" em `sack`. `Ounce`: 1 → 30 g; 4 → 150 ml (outra unidade, outro fator).
6. **Pé quadrado e "N-foot square":** "N-foot square" vira "N × 0,3 metros quadrados" em 5 casos (`grease` 10 pés → "3 metros quadrados"), que é área de 3 m², enquanto o quadrado de 10 pés tem 9 m²; mas `entangle` usa "quadrado de 6 metros de lado". Pé quadrado → m² (2.500 → 225 m²; 40.000 → 3.500 m²) usa ×0,09 (o fator de área real é 0,0929).
7. **Singular e plural de 1,5.** "1,5 metro" 68x, "1,5 metros" 4x; "1,5 quilômetro" 3x, "1,5 quilômetros" 3x. Em centímetro só plural.
8. **Unidade por extenso x abreviada.** Por extenso em 508 de 510 medidas; "m" abreviado em 2 (`darkness` "4,5 m"; `retaliation` "1,5 m"). A abreviação do app (`{meters}m`) não tem espaço, as duas do conteúdo têm.
9. **Unidade imperial mantida.** `jarda quadrada` em 4 nomes, `galão` em 1 nome, `5 pés` em `arcane-sword`, e `[60 pés]` em colchetes de `classes` (bard, monk).
10. **Colchetes.** 183 strings, 402 segmentos, 5 deles divergem do en.json (seção 1.1). Os colchetes só existem em `spells` (181) e `classes` (2); `items` não tem.
11. **Quantidade de strings sem alinhamento** (14) e o pt 5.1 sem `material`: parte do conteúdo não tem evidência de convenção.

## 4. O que o código do app faz

Fatos lidos do código, com arquivo e linha:

| Onde                                                                                                                                               | O que faz                                                                                                                                                                                                     | Fator                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/frontend/components/character/spells/spell-card/hooks/useSpellDisplay.ts:134-137`                                                             | Alcance da magia: passa `feet`, `meters`, `miles`, `km` à mensagem. `meters = Math.round(((rangeValue) / 5) * 1.5 * 10) / 10` (linha 135); `km = Math.round(rangeValue * 1.6 * 10) / 10` (linha 137)          | pés ×0,3 (por 1,5 m a cada 5 pés), uma casa decimal; milhas ×1,6, uma casa decimal |
| `messages/pt.json:1248`                                                                                                                            | `"feet": "{meters}m ({feet} ft.)"`, ou seja, "9m (30 ft.)": métrico abreviado sem espaço e o pé entre parênteses                                                                                              | n/a                                                                                |
| `messages/pt.json:1249`                                                                                                                            | `"mile": "{miles} {miles, plural, one {milha} other {milhas}} ({km} km)"`: a milha continua em milhas, com km abreviado entre parênteses                                                                      | n/a                                                                                |
| `messages/en.json:1248-1249`                                                                                                                       | `"{feet} ft."` e `"{miles} {mile                                                                                                                                                                              | miles} ({km} km)"`                                                                 | n/a |
| `src/frontend/components/character/inventory/useItemFormat.ts:11,20-25`                                                                            | `metric = useLocale() === 'pt'`; peso em pt = libras ÷ 2 com até 2 casas, em en libras com até 1 casa. Comentário nas linhas 6-7: "as the pt-BR books do (1 lb = 0,5 kg)"                                     | libras ×0,5                                                                        |
| `messages/pt.json:430`, `messages/en.json:430`                                                                                                     | `"{weight} kg"` / `"{weight} lb"`                                                                                                                                                                             | n/a                                                                                |
| `src/frontend/components/character/inventory/useItemFormat.unit.test.tsx`                                                                          | trava o comportamento: 65 lb → "32,5 kg"; 1 → "0,5 kg"; 0,25 → "0,13 kg"; en "65 lb"                                                                                                                          | libras ×0,5                                                                        |
| `shared/systems/dnd5e/factory.ts:34`, `src/backend/contexts/characters/domain/entity/DnD5eCharacter.ts:118`, `src/frontend/demo/data/sheets.ts:22` | A ficha guarda o deslocamento em **metros** (padrão 9, "o 30 ft do SRD"), para todos os idiomas                                                                                                               | pés ×0,3                                                                           |
| `messages/en.json:663` e `messages/pt.json:663`                                                                                                    | `"speedUnit": "m"` nos **dois** idiomas; `src/frontend/components/character/stats/VitalsBar.tsx:35` mostra `` `${character.speed ?? 30}${t('speedUnit')}` `` (o fallback 30 vira "30m")                       | n/a                                                                                |
| `shared/systems/dnd5e/content/class.schema.ts:94`                                                                                                  | Comentário: bônus de deslocamento da tabela de classe vem "em pés (como no livro); a ficha mostra metros". Não encontrei o código que converte (não existe `* 0.3` ou equivalente em `shared/` nem em `src/`) | n/a                                                                                |
| `shared/systems/dnd5e/content/item.schema.ts:29,40`, `src/backend/contexts/items/domain/item.repo.ts:15`                                           | Peso em libras e alcance (`range`) em pés, nos dados                                                                                                                                                          | n/a                                                                                |
| `messages/es.json`, `messages/sv.json`                                                                                                             | Os dois arquivos são `{}` (vazios); nenhuma chave de unidade                                                                                                                                                  | n/a                                                                                |

Comparação com o conteúdo, só fatos: o código usa ×0,3 para pés (igual ao dominante, 387 de 400); ×0,5 para libras (dominante, 6 de 11; o conteúdo tem 5 casos com ×0,45 ou ×0,444); e ×1,6 para milhas, enquanto o texto aprovado usa ×1,5 em 11 de 22 casos e ×1,6 em 10. O código arredonda a uma casa; o conteúdo usa 1 m para 3 pés (código daria 0,9).

## 5. Pontos abertos (escolhas, sem recomendação)

Isto é interpretação minha; os fatos estão nas seções 2 a 4.

1. **Fator de milhas:** ×1,5 (11 casos), ×1,6 (código do app e 10 casos), arredondamento de saída. Define a saída para 5, 10, 18, 120 milhas.
2. **Regra de arredondamento:** o pt tem 1 m para 3 pés, 30 cm para 1 pé, 2,5 m para 8 pés, 20 para 13 milhas (13×1,6=20,8), 190 para 120 milhas. Sem regra única observada.
3. **Escolha de unidade por tamanho:** pt usa cm para 1 pé, 2 pés e (uma vez) 3 pés; m para o resto; km a partir de 5.000 pés. Limites não são uniformes (3 pés é 1 m em 6 casos e 90 cm em 1).
4. **Unidade por extenso ou abreviada**, e espaço antes de "m": pt 5.1 é por extenso em 508 de 510; es 5.1 é sempre abreviado; app usa "m" sem espaço.
5. **Plural de 1,5:** singular (71 de 78) ou plural (7 de 78, somando metro e quilômetro).
6. **Formas sem número, "N-foot square", unidade escrita uma vez ("3 por 6 metros"), intervalo:** formas diferentes convivem; a regex precisa decidir qual padrão ela cobre.
7. **Reescala ×5 de "per foot":** 4 casos do pt reescalam, 1 não. Não se sabe se vem do livro oficial pt-BR.
8. **Colchetes:** a sobra em inglês é por vezes a única fonte do número convertido; a especificação precisa dizer se gera ou ignora essa parte.
9. **Unidades que o pt mantém:** jarda quadrada, galão (nome), pés em `arcane-sword`.
10. **es 5.1 x es 5.2 divergem** (métrico abreviado x pés mantidos); qual vale para o es futuro é decisão de produto.
11. **Ficha e UI:** deslocamento em metros também em en (`speedUnit` "m" nos dois idiomas) e o fallback "30" com "m".

## 6. Não verificado

- Origem e revisão do pt 5.1 e do es 5.1/5.2: não sei se vêm de livro oficial, de humano ou de ferramenta. O INDEX diz que es/sv vêm do Weblate; não conferi no Weblate.
- Se a convenção do pt coincide com o livro oficial pt-BR (o comentário do código afirma para o peso; não consultei o livro).
- O pt 5.2 não tem nenhuma descrição traduzida, então a convenção de unidades do 5.2 em pt é desconhecida.
- Campo `material` do pt 5.1: vazio no pt; não há evidência de unidades nele. Em es 5.2 o `material` do `secret-chest` está em cm.
- Formatação em tempo de execução: não rodei o app nem os testes. Não sei se `{meters}` e `{km}` (números passados à mensagem ICU) aparecem com vírgula ("1,5") em pt; os testes do repo só cobrem o peso.
- Se algum alcance de magia usa `rangeUnit` em milhas e, com isso, mostra "1 milha (1,6 km)": não olhei os dados de intervalos (só o código).
- Extração: o pareamento é por posição e só se a contagem for igual; 14 strings (seção 2, item 7) ficaram sem pareamento e foram só listadas. Números por extenso (`ten`), `20/60 feet`, `per inch`, `a number of feet equal to ...` não são extraídos. A comparação colchete x en.json usa o mesmo extrator (3 falsos positivos de formato de milhar). A tabela de posição de palavra (seção 2, item 6) é aproximada.
- Conferência manual: revisei à mão os desvios das seções 1, 2 e 7 e as formas da seção 6, não as 476 medidas alinhadas.
- Texto de `classes` e `conditions` no pt 5.1: conditions tem 15 descrições vazias (só nomes traduzidos); classes tem 180 vazias. Parte do universo de medidas em en (classes, condições) não tem par.
- `srd-5.2` en x pt só mede nomes; es 5.2 só mede o que está em `description`, `higherLevel` e `material`.
- sv: totalmente vazio em 5.1 e 5.2; sem evidência.
