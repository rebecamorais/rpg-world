# 02. Volume de tradução medido

**Data:** 2026-11-27, repositório em `3ad7d31d`. **Tudo aqui sai de um script reproduzível** (seção 1); a saída completa e literal está em [`scripts/measure-volume.output.md`](scripts/measure-volume.output.md). As tabelas abaixo são recortes dessa saída, sem números inventados.

**Regra de leitura:** o documento mistura de propósito cinco unidades diferentes e as mantém separadas.

| Unidade | Definição usada |
|---|---|
| **Arquivo** | arquivo no disco |
| **Chave / string** | uma folha de texto de um JSON (ou, em Markdown, um bloco separado por linha em branco, fora de blocos de código). "Chave" e "string" são 1:1 dentro de um idioma |
| **Única** | string distinta depois de dedup **exato** (mesmos caracteres) dentro do escopo reportado |
| **Palavra** | token separado por espaço em branco |
| **Caractere** | ponto de código Unicode |
| **Token** | **ESTIMATIVA**, nunca medida (seção 2) |

Marcação: **[MEDIDO]** = saiu do script. **[ESTIMATIVA]** = heurística. **[PROJEÇÃO]** = aritmética sobre números medidos.

## 1. Como reproduzir

Na raiz do repositório (Node 24, sem dependências, só lê arquivos e roda `git log`/`git show`):

```bash
# tudo (leva ~2 s), saída em Markdown no terminal e salva em arquivo
node docs/discovery/localization-infrastructure/scripts/measure-volume.mjs \
  > docs/discovery/localization-infrastructure/scripts/measure-volume.output.md

# sem as partes de histórico do git (mais rápido, sem seção F)
node docs/discovery/localization-infrastructure/scripts/measure-volume.mjs --no-git

# números em JSON para processar
node docs/discovery/localization-infrastructure/scripts/measure-volume.mjs --json /tmp/volume.json
```

Resultado depende do commit: os números abaixo valem para `3ad7d31d`. O cabeçalho da saída imprime o HEAD e a hora. O script exclui `docs/discovery/` (esta própria pesquisa) da contagem de `docs/`.

## 2. Heurísticas de token [ESTIMATIVA]

- **Entrada em inglês:** `tokens ≈ caracteres / 4`. Regra de bolso para tokenizadores BPE comuns; erra para mais ou para menos conforme o texto (tags `{@…}`, números e nomes próprios se partem em mais tokens).
- **Saída em pt/es:** `tokens ≈ caracteres / 3,5`. Menos caracteres por token que o inglês. Para sv o script traz 3,2 como constante, mas **não entra em nenhuma projeção** (sem dado medido de sv).
- **Expansão pt/es sobre o inglês [MEDIDO]:** nos pares já traduzidos (inglês e tradução não vazios e diferentes), pt tem **1,096× os caracteres e 1,059× as palavras**; es tem **1,135× e 1,088×**. Para sv **não há par medido**, então o script supõe 1,0× e a projeção só usa a média de pt e es (1,116× caracteres, 1,074× palavras). Viés: os pares existentes são os que a comunidade já traduziu, e podem ter mais frases curtas que o resto.
- **Os docs em português** (`docs/`, `README.md`, `CONTRIBUTING.md`, `.agents/`) têm tokens subestimados por `chars/4`, porque são português (~3,5 caracteres por token). Para eles, multiplique por ~1,14.
- Os totais de tokens não incluem prompt de sistema, glossário injetado, exemplos nem estrutura JSON de entrada/saída. Em geração por LLM, isso costuma dobrar a entrada, mas **não foi medido**.

## 3. Volume por categoria (fonte em inglês) [MEDIDO]

Strings não vazias do idioma-fonte. "Única" = dedup exato dentro da categoria.

### 3.1 Tabela principal

| Grupo | Categoria | Arquivos | Strings | Únicas | Palavras | Caracteres | Tokens est. (chars/4) |
|---|---|---:|---:|---:|---:|---:|---:|
| Interface | `messages/en.json` | 1 | 1.652 | 1.468 | 8.714 | 51.158 | 12.790 |
| SRD 5.1 | magias | 1 | 917 | 900 | 50.698 | 281.876 | 70.469 |
| SRD 5.1 | itens | 1 | 337 | 334 | 3.645 | 20.711 | 5.178 |
| SRD 5.1 | condições | 1 | 30 | 30 | 821 | 5.042 | 1.261 |
| SRD 5.1 | classes | 1 | 675 | 452 | 22.704 | 130.796 | 32.699 |
| SRD 5.2 | magias | 1 | 999 | 957 | 45.307 | 266.761 | 66.690 |
| SRD 5.2 | itens | 1 | 347 | 329 | 6.034 | 36.004 | 9.001 |
| SRD 5.2 | condições | 1 | 30 | 30 | 969 | 7.078 | 1.770 |
| SRD 5.2 | classes | 1 | 740 | 461 | 21.354 | 133.564 | 33.391 |
| `docs/plans` | Markdown pt | 26 | 832 | 717 | 36.781 | 260.270 | 65.068 |
| `docs/superpowers` | Markdown pt | 12 | 355 | 319 | 18.471 | 117.336 | 29.334 |
| `docs/revisao-telas` | Markdown pt | 11 | 610 | 589 | 55.177 | 525.467 | 131.367 |
| `docs/grimoire-enchantments` | Markdown | 21 | 730 | 608 | 38.785 | 354.680 | 88.670 |
| `docs/` (outros) | Markdown pt | 6 | 289 | 274 | 20.942 | 202.200 | 50.550 |
| Raiz `*.md` | Markdown pt | 8 | 163 | 154 | 3.960 | 28.416 | 7.104 |
| `.agents/` + `.github/` `*.md` | Markdown pt | 4 | 93 | 93 | 3.199 | 24.825 | 6.206 |
| `public/llms.txt` | texto en | 1 | 13 | 13 | 459 | 3.217 | 804 |
| `content/dnd5e/OGL-1.0a.txt` | texto legal de terceiros (não é nosso) | 1 | 21 | 21 | 1.016 | 6.593 | 1.648 |

Observações:
- Blocos de código cercados (` ``` `) foram **excluídos** da contagem de Markdown (por exemplo 7.795 caracteres em `docs/grimoire-enchantments`).
- Os `docs/` e `README`/`CONTRIBUTING`/`.agents` **estão escritos em português**, não em inglês; se um dia fossem traduzidos, a fonte seria pt.
- `docs/` tem também 13 JSON e 29 imagens (PNG e SVG, a maior parte em `docs/grimoire-enchantments`) que o script **não** conta (não é prosa).
- Os e-mails transacionais e as mensagens de erro de backend **não foram medidos** (seção 8, Limitações).

### 3.2 Subtotais por grupo (dedup exato em todo o grupo)

| Grupo | Arquivos | Strings | Únicas | Palavras | Caracteres | Tokens est. | Palavras (únicas) | Caracteres (únicos) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Interface | 1 | 1.652 | 1.468 | 8.714 | 51.158 | 12.790 | 8.411 | 49.348 |
| SRD 5.1 (4 tipos) | 4 | 1.959 | 1.715 | 77.868 | 438.425 | 109.606 | 73.886 | 415.947 |
| SRD 5.2 (4 tipos) | 4 | 2.116 | 1.776 | 73.664 | 443.407 | 110.852 | 70.686 | 424.425 |
| **CORPO DO PRODUTO = Interface + SRD 5.1 + SRD 5.2** | **9** | **5.727** | **4.282** | **160.246** | **932.990** | **233.248** | **151.547** | **880.747** |
| `docs/` (md, sem `docs/discovery`) | 76 | 2.816 | 2.488 | 170.156 | 1.459.953 | 364.988 (+14% se pt) | 169.034 | 1.453.243 |
| Raiz `*.md` + `.agents/.github` `*.md` | 12 | 256 | 247 | 7.159 | 53.241 | 13.310 | 7.148 | 53.193 |
| `public/llms.txt` | 1 | 13 | 13 | 459 | 3.217 | 804 | 459 | 3.217 |

**Conferência cruzada:** o Crowdin contava ~5,4 mil strings e ~158 mil palavras (dado do pedido). O corpo do produto aqui tem **5.727 strings e 160.246 palavras**: mesma ordem de grandeza, diferença plausível por segmentação e por atualizações desde então.

### 3.3 SRD por tipo, dois livros lado a lado

| Tipo | Strings 5.1 | Strings 5.2 | Palavras 5.1 | Palavras 5.2 |
|---|---:|---:|---:|---:|
| magias | 917 | 999 | 50.698 | 45.307 |
| itens | 337 | 347 | 3.645 | 6.034 |
| condições | 30 | 30 | 821 | 969 |
| classes | 675 | 740 | 22.704 | 21.354 |

Papel de cada campo (somando os dois livros, `[MEDIDO]`): `spells.description` 658 strings / 86.361 palavras; `classes.*` (nome, descrição, nota de todas as habilidades, recursos, escolhas, subclasses) 1.367 / 43.986; `items.description` 217 / 8.924; `spells.higherLevel` 215 / 5.091; `spells.material` 373 / 3.121; `conditions.description` 30 / 1.760; `spells.name` 658 / 1.226; `items.name` 467 / 755; `spells.trigger` 12 / 206. **Descrições de magia sozinhas são 54% das palavras do corpo do produto.**

### 3.4 Interface por namespace (55 namespaces; maiores por palavras)

`parties` 1.415 palavras, `common` 1.023, `privacy` 942, `features` 742, `terms` 666, `characters` 600, `combat` 291, `accountDeletion` 290, `resourceEditor` 204, `skills` 170.

**Subconjunto público/marketing/legal dentro da interface** (não é adicional ao total da interface): namespaces `landing`, `features`, `seo`, `terms`, `privacy`, `footer`, `translationInvite`, `demo`, `login`, `register`, `forgotPassword`, `resetPassword`, `maintenance`, `notFound`, `errorPage` = **299 strings, 2.997 palavras, 18.561 caracteres**; dentro deles, só Termos + Privacidade (texto legal): **1.608 palavras**. Os textos legais são os mais sensíveis: uma tradução errada de Termos/Privacidade tem consequência jurídica (LGPD).

## 4. Distribuição de comprimento por string [MEDIDO]

Caracteres por string (palavras nas duas últimas colunas).

| Categoria | Média | Mediana | p95 | Máx. | Mediana palavras | Máx. palavras |
|---|---:|---:|---:|---:|---:|---:|
| Interface | 31 | 15 | 98 | 607 | 3 | 95 |
| SRD 5.1 magias | 307 | 71 | 1.249 | 3.879 | 14 | 707 |
| SRD 5.1 itens | 61 | 13 | 313 | 766 | 2 | 152 |
| SRD 5.1 condições | 168 | 13 | 613 | 1.282 | 1 | 210 |
| SRD 5.1 classes | 194 | 25 | 718 | 5.944 | 4 | 1.042 |
| SRD 5.2 magias | 267 | 52 | 1.175 | 3.848 | 9 | 680 |
| SRD 5.2 itens | 104 | 14 | 413 | 5.429 | 2 | 1.113 |
| SRD 5.2 condições | 236 | 13 | 728 | 824 | 1 | 107 |
| SRD 5.2 classes | 180 | 25 | 773 | 4.451 | 3 | 755 |
| `public/llms.txt` | 247 | 190 | 898 | 898 | 8 | 140 |

Leitura: a distribuição é **bimodal** nas regras (muitos nomes de 1 a 4 palavras, mais uma cauda de descrições longas). A maior string (5.429 caracteres, um item do 5.2; 5.944 em uma classe do 5.1) cabe com folga num contexto de LLM, mas exige que a segmentação preserve tabelas e listas.

## 5. Elementos a preservar [MEDIDO]

Detalhe do formato em [01-current-state.md](01-current-state.md#3-formatos-de-arquivo). Números:

**Interface (ICU), em `messages/en.json`:** 180 strings com `{variável}`; 19 com `plural` (11 usam `#`); 1 com `select`; 0 com `selectordinal`; 34 com marcação rica `<tag>`; 1 com quebra de linha; 68 nomes de argumento distintos.

**Regras (en, dois livros):** 1.023 strings com ao menos uma tag `{@tipo …}`; 3.349 ocorrências; 555 com texto de exibição **traduzível** no 3º segmento; 621 expressões de dado soltas (`NdM`); 77 linhas de tabela Markdown; 370 linhas com `•`; 2.558 quebras de linha dentro de strings. Tipos de tag mais frequentes: `variantrule` 901, `condition` 491, `item` 313, `spell` 299, `damage` 232, `action` 164, `filter` 137, `5etools` 126, `dc` 105, `skill` 85, `dice` 83.

**Verificação de paridade já feita sobre o que está traduzido [MEDIDO, aproximada]:** compara o conjunto de dados `NdM`, tipos de tag `{@…}`, argumentos ICU e tags `<x>` entre fonte e tradução.

| Categoria | Idioma | Traduzidas | Quebras de paridade | Valores de comprimento fora de 0,5×–2,0× (fonte ≥ 80 caracteres) |
|---|---|---:|---:|---:|
| Interface | pt | 1.652 | 11 | 0 |
| SRD 5.1 magias | pt | 733 | 13 | 2 |
| SRD 5.1 magias | es | 917 | 15 | 1 |
| demais categorias (itens, condições, classes, 5.2) | pt, es | 3.661 | 0 | 0 |

**Como interpretar:** as 11 da interface são falsos positivos quase certos (o literal dentro de um `select`/`plural` é traduzido, por exemplo `{amount, select, all {all} other {…}}` vira `{amount, select, all {todos} other {…}}`; o script lê `{all}` como argumento). As 28 de magias 5.1 **não foram inspecionadas uma a uma**; a primeira da lista é `srd51:spells/pt/bane.description` (o inglês escreve "a d4"; o pt, "1d4"). São candidatas a revisão, não erros comprovados. **Os 0 do resto não provam ausência de erro**: a checagem só vê dado, tag, argumento e tag HTML.

## 6. Cobertura por idioma [MEDIDO]

Definições: **traduzida** = chave presente com texto não vazio; **vazia** = chave presente com `""`; **ausente** = chave inexistente (o `es.json` e o `sv.json` da interface são `{}`, então todas as chaves estão "ausentes"). "Igual ao en" = tradução idêntica ao inglês (cópia ou nome próprio legítimo), um subconjunto das traduzidas.

### 6.1 Resumo por idioma

| Idioma | Chaves en | Traduzidas | Vazias | Ausentes | % chaves traduzidas | Palavras en cobertas | Palavras en a traduzir | % palavras cobertas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| pt | 5.727 | 3.989 | 1.735 | 3 | 69,7% | 72.027 | 88.219 | **44,9%** |
| es | 5.727 | 2.974 | 1.086 | 1.667 | 51,9% | 116.805 | 43.441 | **72,9%** |
| sv | 5.727 | 0 | 4.060 | 1.667 | 0,0% | 0 | 160.246 | **0,0%** |

(Escopo: Interface + SRD 5.1 + SRD 5.2. Docs e Markdown não têm tradução.) **Surpresa: o `es` cobre mais palavras que o `pt`**, porque o espanhol tem 651 descrições de magia (5.1 e 5.2) e o português só 319 (as do 5.1); no 5.2, o `pt` tem sobretudo nomes. O `pt` tem 100% da interface; o `es` tem 0% dela. O `sv` não tem uma única palavra.

### 6.2 Por categoria

| Categoria | Idioma | Chaves en | Traduzidas | Vazias | Ausentes | % chaves | Igual ao en | % palavras en cobertas |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Interface | pt | 1.652 | 1.652 | 0 | 0 | 100,0% | 61 | 100,0% |
| Interface | es | 1.652 | 0 | 0 | 1.652 | 0,0% | 0 | 0,0% |
| Interface | sv | 1.652 | 0 | 0 | 1.652 | 0,0% | 0 | 0,0% |
| 5.1 magias | pt | 917 | 733 | 184 | 0 | 79,9% | 1 | 96,1% |
| 5.1 magias | es | 917 | 917 | 0 | 0 | 100,0% | 2 | 100,0% |
| 5.1 itens | pt | 337 | 324 | 13 | 0 | 96,1% | 3 | 87,5% |
| 5.1 itens | es | 337 | 147 | 190 | 0 | 43,6% | 1 | 6,2% |
| 5.1 condições | pt | 30 | 15 | 15 | 0 | 50,0% | 0 | 1,8% |
| 5.1 condições | es | 30 | 30 | 0 | 0 | 100,0% | 1 | 100,0% |
| 5.1 classes | pt | 675 | 494 | 180 | 1 | 73,2% | 1 | 43,8% |
| 5.1 classes | es | 675 | 146 | 522 | 7 | 21,6% | 0 | 1,3% |
| 5.2 magias | pt | 999 | 313 | 686 | 0 | 31,3% | 1 | **1,3%** |
| 5.2 magias | es | 999 | 983 | 16 | 0 | 98,4% | 3 | 95,8% |
| 5.2 itens | pt | 347 | 216 | 131 | 0 | 62,2% | 2 | 5,4% |
| 5.2 itens | es | 347 | 287 | 60 | 0 | 82,7% | 2 | 64,0% |
| 5.2 condições | pt | 30 | 15 | 15 | 0 | 50,0% | 0 | 1,5% |
| 5.2 condições | es | 30 | 15 | 15 | 0 | 50,0% | 1 | 1,5% |
| 5.2 classes | pt | 740 | 227 | 511 | 2 | 30,7% | 0 | 2,5% |
| 5.2 classes | es | 740 | 449 | 283 | 8 | 60,7% | 0 | 81,9% |

`sv` em todas as categorias de regras: **0 traduzidas**, todas as chaves vazias (ou ausentes: 7 em classes 5.1, 8 em classes 5.2).

O que isso diz: **"percentual de chaves" engana**, porque os campos curtos (nomes) estão traduzidos e os longos (descrições) não. Por exemplo, o `pt` do 5.2 tem 313 de 999 chaves de magia (31,3%) mas só **1,3% das palavras**: tem os nomes e quase nenhuma descrição. Por campo (SRD, dois livros):

| Campo | Chaves en | pt traduzidas | es traduzidas | sv |
|---|---:|---:|---:|---:|
| `classes.name` | 752 | 574 (76,3%) | 407 (54,1%) | 0 |
| `spells.name` | 658 | 632 (96,0%) | 658 (100%) | 0 |
| `spells.description` | 658 | 319 (48,5%) | 651 (98,9%) | 0 |
| `classes.description` | 603 | 128 (21,2%) | 188 (31,2%) | 0 |
| `items.name` | 467 | 467 (100%) | 326 (69,8%) | 0 |
| `spells.material` | 373 | **0 (0%)** | 372 (99,7%) | 0 |
| `items.description` | 217 | 73 (33,6%) | 108 (49,8%) | 0 |
| `spells.higherLevel` | 215 | 91 (42,3%) | 215 (100%) | 0 |
| `classes.note` | 36 | 7 (19,4%) | 0 | 0 |
| `conditions.name` | 30 | 30 (100%) | 30 (100%) | 0 |
| `conditions.description` | 30 | 0 | 15 (50%) | 0 |
| `classes.subclassTitle` | 24 | 12 (50%) | 0 | 0 |
| `spells.trigger` | 12 | 4 (33,3%) | 4 (33,3%) | 0 |

Note que `pt` **não tem nenhum `spells.material` traduzido** (0 de 373) e nenhuma descrição de condição. Parte disso é esperado no pt do 5.1 (o módulo Foundry traduz algumas coisas e não outras); a lacuna do 5.2 é a documentada.

### 6.3 "Possivelmente desatualizado"

**Não é detectável só pelos arquivos**: o arquivo traduzido não guarda de qual versão do inglês partiu (não há hash, data nem estado "fuzzy"). Duas aproximações medidas:

1. **Proxy por histórico do git [MEDIDO, com ressalvas]:** uma chave traduzida é marcada se o inglês dela mudou **depois** da última mudança da tradução (replay do valor por chave nos commits, as duas datas por chave; mesma data não marca). Resultado: **interface pt: 30 de 1.652 chaves (1,8%), 251 palavras**; **todas as categorias de regras (pt e es): 0**. Total: pt 30 de 3.989 (0,8%), es 0.
   - **O 0 das regras é pouco informativo**: o inglês das regras só mudou em grandes eventos (importação, marcação de `{@condition}` em 2026-11-01) e as traduções foram atualizadas em seguida pelo mesmo caminho (Crowdin/Weblate) ou na mesma PR. Mostra que o fluxo **manteve** o par, não que não exista defasagem semântica.
   - Falsos positivos: correção de erro de digitação no inglês marca tradução ainda válida. Falsos negativos: tradução editada por outro motivo esconde defasagem.
2. **Proxies de forma [MEDIDO]:** comprimento fora de 0,5×–2,0× e quebras de paridade (seção 5). Indicam cópia truncada ou errada, não estagnação.

A medição rigorosa exigiria o estado `needs editing`/`fuzzy` do Weblate, que **não foi consultado**.

## 7. Duplicidades (inglês) [MEDIDO]

Dedup **exato**; um "alvo" de tradução só precisa de uma passada por string única.

**Dentro de cada categoria:**

| Categoria | Strings | Únicas | Repetidas | Palavras economizadas |
|---|---:|---:|---:|---:|
| Interface | 1.652 | 1.468 | 184 | 303 |
| 5.1 magias | 917 | 900 | 17 | 319 |
| 5.1 itens | 337 | 334 | 3 | 95 |
| 5.1 condições | 30 | 30 | 0 | 0 |
| 5.1 classes | 675 | 452 | 223 | **3.567** |
| 5.2 magias | 999 | 957 | 42 | 505 |
| 5.2 itens | 347 | 329 | 18 | 620 |
| 5.2 condições | 30 | 30 | 0 | 0 |
| 5.2 classes | 740 | 461 | 279 | 1.852 |

As **classes** têm muita repetição interna (33% das strings do 5.1 e 38% do 5.2 são repetidas; provavelmente descrições idênticas de habilidades comuns replicadas em cada classe, causa não inspecionada).

**Entre categorias:** no corpo do produto há 4.282 strings distintas; **655 aparecem em mais de uma categoria** (1.413 palavras contadas uma vez). Só 7 delas têm ≥ 40 caracteres (166 palavras). As trocas mais valiosas:

| Par | Strings idênticas | Palavras |
|---|---:|---:|
| 5.1 magias ↔ 5.2 magias | 349 | 850 |
| 5.1 classes ↔ 5.2 classes | 119 | 282 |
| 5.1 itens ↔ 5.2 itens | 170 | 263 |
| 5.1 condições ↔ 5.2 condições | 15 | 15 |
| classes / magias / itens ↔ interface | 4 a 15 cada | 4 a 16 |

**Ou seja, o SRD 5.1 e o 5.2 quase não repetem texto literal** (principalmente nomes): são edições reescritas, mesmo para a mesma magia.

**5.1 × 5.2 pelo mesmo id (mesma magia nas duas edições):**

| Tipo | Chaves 5.1 | Chaves 5.2 | Mesma chave nos dois | Idênticas | Palavras idênticas | Quase iguais (Jaccard de palavras ≥ 0,8) | Palavras quase iguais | Palavras (lado 5.2) nas chaves comuns |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| magias | 917 | 999 | 905 | 352 | 862 | 100 | 10.171 | 42.447 |
| itens | 337 | 347 | 221 | 170 | 263 | 3 | 72 | 1.832 |
| condições | 30 | 30 | 30 | 15 | 15 | 0 | 0 | 969 |
| classes | 675 | 740 | 379 | 210 | 524 | 0 | 0 | 12.904 |

Nas magias, 100 chaves têm texto quase igual entre as edições, **10.171 palavras**: candidatas a sugestão por correspondência fuzzy. As "idênticas" somam só 862 palavras, em sua maioria nomes.

**Quase-duplicatas gerais** (método: strings com ≥ 8 palavras, dedup exato, shingles de 4 palavras minúsculas, índice invertido ignorando shingles com frequência > 200, Jaccard sobre os conjuntos de shingles, chaves diferentes): 2.032 strings comparadas (145.816 palavras).

| Jaccard ≥ | Pares | Strings com ≥ 1 parceiro | Palavras nessas strings |
|---:|---:|---:|---:|
| 0,9 | 21 | 36 | 2.487 |
| 0,8 | 89 | 97 | 6.884 |
| 0,7 | 169 | 165 | 12.529 |

Dos 89 pares a ≥ 0,8, **19 cruzam categorias**. O método é barato e **conservador** (shingles de 4 palavras e limite de frequência; textos reordenados escapam). Ganho possível de memória de tradução: o **dedup exato** poupa 8.699 palavras (160.246 → 151.547, **5,4%**, [MEDIDO]); as quase-duplicatas a ≥ 0,8 envolvem outras 6.884 palavras (≈ 4%) e as a ≥ 0,7, 12.529 (≈ 8%), como candidatas a correspondência fuzzy. Esses dois grupos se sobrepõem em parte, então **não os some**; e a quase-duplicata só poupa trabalho de revisão, não de tradução.

## 8. Histórico do git: quanto texto fonte novo entra por mês [MEDIDO, com ruído]

**Método.** Para cada arquivo-fonte em inglês, replay de `git log --first-parent --reverse -- <arquivo>`; compara os mapas chave→string de versões consecutivas. "Adicionada" = chave nova ou antes vazia; "alterada" = valor não vazio que mudou; palavras = as do valor **novo**. Data = data do commit (squash/merge na `main`).

**Ruído, explícito:**
- O histórico é linear (0 merges, 402 commits), mas **um commit de formatação ou de reimportação pode reescrever o valor** (por exemplo, o commit `f3c99541` de 2026-11-01, "condições nas magias e no combate", "alterou" 39.083 palavras de magias 5.2 e 15.109 de 5.1, provavelmente só para inserir as tags `{@condition …}`; isso é re-marcação, não texto novo, mas o script não distingue).
- Em `messages/en.json` não há commits de maio a setembro de 2026: hiato entre abril e outubro (causa não investigada). Média mensal depende de como se conta esses meses.
- O repositório tem 9 meses de vida, mas o conteúdo de regras em arquivo existe há **5 semanas** (primeiro commit 2026-10-21). Não há série longa para extrapolar.
- Datas são do merge; uma PR grande de 5 dias aparece num dia só.

### 8.1 Interface (`messages/en.json`), 125 commits

| Mês | Commits | Chaves adicionadas | Palavras adicionadas | Chaves alteradas | Palavras alteradas | Chaves removidas |
|---|---:|---:|---:|---:|---:|---:|
| 2026-02 | 6 | 97 | 272 | 0 | 0 | 0 |
| 2026-03 | 26 | 298 | 1.404 | 9 | 12 | 18 |
| 2026-04 | 13 | 122 | 299 | 4 | 15 | 0 |
| 2026-10 | 28 | 348 | 1.978 | 38 | 969 | 50 |
| 2026-11 (até dia 27) | 52 | 907 | 4.889 | 211 | 2.458 | 52 |

- Palavras (adicionadas + alteradas) por mês de atividade: média **2.459**, mediana **1.416**, máximo 7.347 (novembro).
- **Estimativa de ritmo atual:** média de outubro e novembro = **5.147 palavras/mês** (adicionadas 3.434 + alteradas 1.714), ou **~1.400 a ~5.100 palavras/mês** como faixa realista. Em chaves, **~350 a ~900 novas por mês** recentemente. [ESTIMATIVA sobre 2 meses, alta variância.]
- Maiores commits: `23bab4f9` (2026-11-04, +887/~473 palavras), `fe29a2d2` (2026-10-15, +708/~303), `39634141` (2026-11-15, +352/~394), `cbce7e70` (2026-11-03), `423a3056` (2026-03-12, +617).
- Ao tocar a UI em `en.json`, também há que mudar o `pt.json` na mesma PR (teste de chaves iguais), então o custo recorrente de tradução é **real para pt e vem junto de cada funcionalidade**.

### 8.2 Regras (8 arquivos `i18n/en/*.json`), 17 commits de arquivo

| Data | Commit | Arquivo | Chaves + | Palavras + | Chaves ~ | Palavras ~ |
|---|---|---|---:|---:|---:|---:|
| 2026-10-21 | `5eadcb0a` | 5.1 magias | 912 | 50.438 | 0 | 0 |
| 2026-10-22 | `22cc3e91` | 5.1 magias | 1 | 26 | 0 | 0 |
| 2026-10-22 | `21be6722` | 5.2 magias | 991 | 43.360 | 0 | 0 |
| 2026-10-23 | `d0644b07` | 5.1 magias | 4 | 67 | 0 | 0 |
| 2026-10-23 | `d0644b07` | 5.2 magias | 8 | 136 | 0 | 0 |
| 2026-11-01 | `f3c99541` | 5.1 magias | 0 | 0 | 83 | 15.109 |
| 2026-11-01 | `f3c99541` | 5.1 condições | 30 | 821 | 0 | 0 |
| 2026-11-01 | `f3c99541` | 5.2 magias | 0 | 0 | 387 | 39.083 |
| 2026-11-01 | `f3c99541` | 5.2 condições | 30 | 969 | 0 | 0 |
| 2026-11-03 | `db5ba784` | 5.1 itens | 337 | 3.645 | 0 | 0 |
| 2026-11-03 | `db5ba784` | 5.2 itens | 347 | 6.034 | 0 | 0 |
| 2026-11-13 | `9be56f6c` | 5.1 classes | 668 | 22.652 | 0 | 0 |
| 2026-11-13 | `9be56f6c` | 5.2 classes | 732 | 21.282 | 0 | 0 |
| 2026-11-23 | `9156c31d` | 5.1 classes | 1 | 11 | 0 | 0 |
| 2026-11-23 | `9156c31d` | 5.2 classes | 2 | 25 | 1 | 15 |
| 2026-11-26 | `91c07a23` | 5.1 classes | 6 | 41 | 0 | 0 |
| 2026-11-26 | `91c07a23` | 5.2 classes | 6 | 41 | 0 | 0 |

**Leitura.** O conteúdo de regras **não cresce de forma contínua: cresce por eventos de importação** (magias em 2026-10-21/22, itens em 11-03, classes em 11-13). Entre importações, o fluxo é de dezenas de palavras (11-23 e 11-26). Portanto **não existe um "ritmo mensal" estável de regras**; os números por mês seriam artefato de quando um novo tipo foi importado. Em vez disso, o que importa é o **roteiro de importações futuras**: o plano `2026-11-26-srd-o-que-falta.md` lista espécies, antecedentes, talentos, itens mágicos, maestria de armas, glossário de regras e **criaturas (~320 a 330 por edição)**. Isso **não está medido** (ainda não existe no repositório), mas as magias sozinhas (~50 mil palavras por edição) mostram que a escala de um bestiário completo pode ser da mesma ordem do corpo atual inteiro, ou maior.

### 8.3 Estimativa mensal em uma linha [ESTIMATIVA]

- **Interface:** ~1,4 a ~5,1 mil palavras/mês de texto-fonte novo ou alterado (por idioma-alvo).
- **Regras:** ~0 em um mês parado; saltos de 20 a 100 mil palavras por evento de importação de um tipo novo.
- A leitura honesta é: **a infraestrutura precisa tratar dois regimes** (fluxo contínuo pequeno da interface; lote grande, raro e previsível das regras).

## 9. Projeções [PROJEÇÃO, aritmética, não medição]

**Suposições** (as mesmas da saída completa):
- Fonte atual: **corpo do produto** = Interface + SRD 5.1 + SRD 5.2 = 160.246 palavras, 932.990 caracteres.
- Saída por idioma-alvo: caracteres = fonte × **1,116**; palavras = fonte × **1,074** (média de pt e es medidos; **sv sem medição**); tokens de saída = caracteres de saída / 3,5 [ESTIMATIVA].
- Tokens de entrada = caracteres da fonte / 4, **reenviados uma vez por idioma** (sem agrupar idiomas numa chamada) [ESTIMATIVA].
- "N idiomas" = N traduções completas do zero. **Não desconta** o que já está traduzido por humanos hoje.
- Multiplicador de conteúdo (1×, 2×, 5×, 10×) multiplica a fonte.

### 9.1 Base: corpo do produto, todas as strings, sem dedup (160.246 palavras / 932.990 caracteres)

| Conteúdo | Idiomas-alvo | Palavras de fonte | Palavras de saída | Caracteres de saída | Tokens de entrada (est.) | Tokens de saída (est.) |
|---|---:|---:|---:|---:|---:|---:|
| 1× | 2 | 160.246 | 344.132 | 2.081.985 | 466.495 | 594.853 |
| 1× | 5 | 160.246 | 860.329 | 5.204.963 | 1.166.238 | 1.487.132 |
| 1× | 10 | 160.246 | 1.720.659 | 10.409.926 | 2.332.475 | 2.974.265 |
| 1× | 20 | 160.246 | 3.441.318 | 20.819.852 | 4.664.950 | 5.948.529 |
| 2× | 2 | 320.492 | 688.264 | 4.163.970 | 932.990 | 1.189.706 |
| 2× | 5 | 320.492 | 1.720.659 | 10.409.926 | 2.332.475 | 2.974.265 |
| 2× | 10 | 320.492 | 3.441.318 | 20.819.852 | 4.664.950 | 5.948.529 |
| 2× | 20 | 320.492 | 6.882.636 | 41.639.705 | 9.329.900 | 11.897.059 |
| 5× | 2 | 801.230 | 1.720.659 | 10.409.926 | 2.332.475 | 2.974.265 |
| 5× | 5 | 801.230 | 4.301.647 | 26.024.816 | 5.831.188 | 7.435.662 |
| 5× | 10 | 801.230 | 8.603.295 | 52.049.631 | 11.662.375 | 14.871.323 |
| 5× | 20 | 801.230 | 17.206.589 | 104.099.262 | 23.324.750 | 29.742.646 |
| 10× | 2 | 1.602.460 | 3.441.318 | 20.819.852 | 4.664.950 | 5.948.529 |
| 10× | 5 | 1.602.460 | 8.603.295 | 52.049.631 | 11.662.375 | 14.871.323 |
| 10× | 10 | 1.602.460 | 17.206.589 | 104.099.262 | 23.324.750 | 29.742.646 |
| 10× | 20 | 1.602.460 | 34.413.178 | 208.198.524 | 46.649.500 | 59.485.293 |

**Pontos de referência dentro da tabela:** o caso "1× e 2 idiomas" é ~0,6 milhão de tokens de saída; o caso "1× e 3 idiomas" (pt, es, sv, completando o que falta) seria ~0,89 milhão de tokens de saída estimados, **mas** a maior parte do `es` e parte do `pt` já existe, então o **trabalho real hoje é bem menor que o "do zero"**: ficam por traduzir 88.219 palavras (pt) + 43.441 (es) + 160.246 (sv) = **291.906 palavras-fonte** (seção 6.1, [MEDIDO]).

### 9.2 Base: corpo do produto, só strings únicas (151.547 palavras / 880.747 caracteres)

Mesma tabela, 5,4% menor: 1× e 2 idiomas = 440.374 tokens de entrada e 561.544 de saída; 10× e 20 idiomas = 44.037.350 e 56.154.399 (estimativas). A tabela completa está na saída em `scripts/measure-volume.output.md` (seção G, segunda base).

### 9.3 Base: produto + `docs/` + `.md` da raiz/`.agents`/`.github` + `llms.txt` (338.020 palavras / 2.449.401 caracteres)

Só se um dia a documentação fosse traduzida (hoje **nada indica isso**; é para dar ordem de grandeza). Em 1× são 1.224.701 tokens de entrada e 1.561.682 de saída para 2 idiomas; 12.247.005 e 15.616.816 para 20. Os docs em português tendem a render mais tokens que o `chars/4` (~14% a mais), então o número real seria maior.

## Limitações

- **Weblate e Crowdin não foram consultados.** Os números de cobertura são dos **arquivos do repositório**. Strings já traduzidas no Weblate que ainda não viraram PR não aparecem; sugestões pendentes tampouco.
- "Tradução" = texto não vazio. O script **não julga qualidade**: um texto não vazio copiado do inglês ou de MT conta como traduzido; só as 61 strings idênticas ao inglês na interface pt e poucas nas regras são sinalizadas.
- Tokens são **estimativas por heurística**; nenhum tokenizador real foi executado. Erro plausível de ±20% a ±30% para pt/es, maior para texto com muitas tags.
- Expansão de caracteres medida só em pt e es. **sv não tem par medido**; a projeção usa a média de pt e es para todos os idiomas, o que é só uma suposição razoável (sueco tende a ficar próximo do inglês em caracteres, mas isso não foi verificado).
- Texto segmentado por blocos (Markdown) ou por folha (JSON). Outras estratégias de segmentação (por frase, como o Weblate/Crowdin faria) mudariam a contagem de "strings" mas não a de palavras.
- "Quase-duplicata" usa um método barato (shingles de 4 palavras, Jaccard); pode **subcontar** reordenações e variantes numéricas e não substitui um alinhamento por memória de tradução real.
- Histórico do git: janelas curtas e eventos de importação; **não extrapole** para um ritmo mensal de regras. Os commits do Crowdin/Weblate não tocam o inglês, então não inflam a medida de fonte; os commits de reimportação sim.
- Não medidos: e-mails transacionais, mensagens de erro do backend (`error-codes`, `client-messages`), textos em imagens (capturas da landing), metadados (`og:` etc.) fora de `messages/`, conteúdo de usuário. Podem acrescentar pouco, mas não foram verificados.
- O conteúdo SRD **ainda não importado** (criaturas, itens mágicos, espécies, antecedentes, talentos, glossário de regras) não está nas contagens.
- Só `docs/` em Markdown foi contado; os 13 JSON, as imagens e os SVG de `docs/grimoire-enchantments` ficaram fora.

## Nível de confiança

| Afirmação | Confiança | Motivo |
|---|---|---|
| Contagens de arquivos, strings, palavras e caracteres por categoria | alto | contagem direta por script, reproduzível |
| Strings únicas e duplicidade exata | alto | dedup por igualdade de string |
| Coincide com o Crowdin (~5,4 mil strings, ~158 mil palavras) | médio | o número do Crowdin vem do pedido, não verificado por mim |
| Cobertura por idioma (traduzida / vazia / ausente) | alto | contagem direta dos JSON |
| `es` cobre mais palavras que `pt` | alto | consequência das contagens |
| Estimativas de token | baixo a médio | heurística `chars/4` e `chars/3,5`, sem tokenizador |
| Expansão pt 1,096× e es 1,135× em caracteres | médio | medida em pares reais, mas viés de seleção |
| Expansão sv | baixo | sem dado; é suposição |
| "Possivelmente desatualizado" via git | baixo | proxy com falsos positivos e negativos; o 0 das regras é pouco informativo |
| Quase-duplicatas | médio | método simples, conservador |
| Ritmo mensal da interface (1,4 a 5,1 mil palavras) | médio-baixo | só 2 meses recentes com atividade, hiato de 6 meses antes |
| Regras crescem por eventos, sem ritmo mensal | médio | 17 commits em 5 semanas; padrão pode mudar |
| Projeções | alto como aritmética, baixo como previsão | dependem dos fatores acima e de multiplicadores arbitrários (1×–10×, 2–20 idiomas) |

## Perguntas em aberto

1. **Qual é o alvo?** Completar `pt` (88 mil palavras), liberar `es` (43 mil palavras, 100% da interface) e `sv` (160 mil), ou ir a muitos idiomas? As projeções mudam em ordens de grandeza.
2. O `es` das magias do 5.2 (983 de 999 chaves preenchidas) tem origem documentada e licença compatível? (ver 01, perguntas abertas)
3. A **interface pt já "está completa"**; a mantenedora quer que cada PR de funcionalidade continue trazendo `pt` escrito à mão ou que isso passe pelo novo fluxo?
4. O bestiário (≈ 320 criaturas por edição) entrará? É o maior fator de crescimento previsível e hoje não existe no repositório.
5. As estimativas de token devem ser trocadas por medição com o tokenizador do modelo escolhido antes de orçar? (**sim**, assim que o modelo estiver definido.)
6. A contagem de estagnação precisa do estado "fuzzy/needs editing" do Weblate: dá para exportar ou consultar uma vez, com autorização?
7. O texto jurídico (Termos e Privacidade, 1.608 palavras) deve ter regra própria (revisão humana obrigatória)?
8. O script deve virar um comando permanente (`npm run i18n:volume`) ou fica só como material desta descoberta? (Hoje é só material da descoberta; o plano de pesquisa exige não mexer em código da aplicação.)
