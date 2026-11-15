# Exploração: Material Surface System

Fase de exploração, feita em 15/11/2026 na branch `feat/grimoire-material-surfaces`. Os materiais **não estão no spellbook**: só existem no laboratório interno `/dev/grimoire/materials`. Nenhum material foi aprovado ainda; este documento traz os dados para a decisão da dona.

## Objetivo

Superfícies que parecem materiais mágicos (vidro gelado, ácido, pedra, pergaminho) nos cards do Grimório, sem shaders, canvas, `requestAnimationFrame`, `backdrop-filter` nem filtros SVG pesados aplicados ao vivo. Cada material funciona parado.

## Arquitetura

O material tem três camadas:

| Camada               | O que é                                                                                  | Onde           |
| -------------------- | ---------------------------------------------------------------------------------------- | -------------- |
| **Material Surface** | Cor, textura e luz. Fica dentro do recorte arredondado do card, embaixo de tudo          | `.surface`     |
| **Ornamental Layer** | Geada, gotas, rachaduras, douração. É decorativa: `aria-hidden` e `pointer-events: none` | `.ornament`    |
| **Content Layer**    | O conteúdo do card, que não muda                                                         | o próprio card |

Arquivos:

- `src/frontend/components/grimoire/material-surface/types.ts`: `MATERIAL_IDS`, `MaterialId` e `CardMaterial` (`{ id, surface, ornament }`).
- `src/frontend/components/grimoire/material-surface/MaterialSurface.tsx`: `cardMaterial(id)`, que entrega as camadas para um card que já tem moldura, e `<MaterialSurface>`, um painel completo em três camadas.
- `src/frontend/components/grimoire/material-surface/materials.module.css`: os quatro materiais. É um **CSS Module**, então só é carregado onde o componente é importado.
- `src/frontend/components/character/spells/spell-card/SpellCard.tsx`: a prop opcional `material`.
- `app/[locale]/dev/grimoire/materials/page.tsx` + `src/frontend/dev/grimoire/`: o laboratório.
- `scripts/grimoire-materials-bench.ts` e `scripts/grimoire-materials-report.ts`: o benchmark e o relatório.

### Decisões técnicas

1. **O `SpellCard` não importa o CSS dos materiais.** Ele recebe só o tipo `CardMaterial`, por import de tipo. Quem passa as camadas é o laboratório, então o spellbook não carrega nenhum estilo de material.
2. **Sem `material`, o card fica igual ao de hoje:**
   - **classes:** a string é idêntica, e o `material && 'overflow-visible'` só entra quando há material;
   - **estrutura:** a mesma ordem de elementos, com o `SpellVFX` depois do botão;
   - **renderização:** o mesmo `content-visibility: auto`.

   Um teste unitário confirma.

3. **Com `material`:**
   - o `article` passa a `overflow-visible`, o que deixa espaço para o OverflowBorders;
   - o recorte arredondado vai para uma camada interna (`data-material-clip`, `overflow-hidden`, raio `calc(var(--radius-xl) - 1px)`, que é o raio interno da borda de 1 px);
   - dentro dela ficam a superfície, a faixa da cor da magia e o `SpellVFX` do card aberto;
   - o ornamento fica fora do recorte.
4. **Estados interativos:** a borda e o hover (`hover:border-spell-muted`) continuam no `article`. O botão que abre o card continua por cima da superfície, e o foco (`focus-visible:outline`) continua visível. Os testes confirmam que o card abre com material.
5. **Texturas:** são SVGs estáticos minúsculos, inline no CSS. São `feTurbulence` já resolvidos pelo navegador uma vez, num tile, como o grão que o `body` já usa. Não há WebP nem dependência nova.
6. **Contraste forçado:** com `forced-colors: active`, superfície e ornamento somem e fica o card simples.

### OverflowBorders e `content-visibility: auto` (conflito)

O `content-visibility: auto` **sempre** aplica _paint containment_ ao card, e não só quando ele está fora da tela. _Paint containment_ recorta tudo o que é desenhado dentro da caixa do elemento, como um `overflow: clip`. Por isso, **no `SpellCard` um ornamento não consegue passar da borda**, mesmo sem `overflow-hidden`.

O laboratório mostra isso na seção "OverflowBorders":

- **No `<MaterialSurface>`, que não tem `content-visibility`:** um losango posicionado 10 px fora do canto aparece inteiro.
- **No `SpellCard`:** o mesmo losango é recortado.

Não tentei contornar, conforme combinado. As saídas para decidir depois:

| Opção                                                                                                                                      | Custo                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| A. Pôr o `content-visibility` num **invólucro** com uma margem interna do tamanho máximo da projeção, e o ornamento dentro desse invólucro | Muda a estrutura do card; o `contain-intrinsic-size` passa a incluir a margem                                    |
| B. Desenhar os ornamentos que projetam **fora** do elemento contido, como irmão dele num contêiner `relative`                              | O ornamento sai da árvore do card; precisa de um contêiner por card                                              |
| C. Tirar o `content-visibility` só dos cards com material que projeta                                                                      | Perde o ganho de não pintar cards fora da tela (é o que segura a renderização inicial com 100 cards, ver abaixo) |

A arquitetura atual já é compatível com A e B: o contêiner externo não recorta, e o ornamento é uma camada separada.

## Laboratório e segurança

- **Rota:** `/dev/grimoire/materials`, com parâmetros `?material=<id>&count=<1–100>&expanded=1`.
- **Trava:** `isGrimoireLabEnabled()` (`src/frontend/dev/grimoire/lab-access.ts`, com teste unitário). A página existe em desenvolvimento. Num build de produção, ela só existe se o build for feito com `GRIMOIRE_LAB=1`, o que só o benchmark local faz. A Vercel nunca define essa variável.
- **Verificado num build de produção normal (`next build` + `next start`):** a rota sai como página estática de 404, e `/dev/grimoire/materials`, `?material=crypt-stone&count=100` e `/pt/dev/...` respondem 404. A página também declara `robots: noindex, nofollow`.
- **Dados:** são magias reais do SRD, lidas do catálogo do próprio projeto (`getSpellCatalog().findAll`). Nenhum conteúdo foi copiado.
- **Texto:** o laboratório é uma ferramenta interna, não é traduzido e fica em `src/frontend/dev/`, fora das pastas que a trava `hardcoded-text` lê. A página em `app/` não tem texto.

## Os quatro materiais

| ID                     | Material            | Superfície                                                                                                                                                                     | Ornamento                                                                     |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `glacial-glass`        | Vidro gelado        | Corpo azul-gelo, faixa de reflexo no topo, brilho diagonal leve, filete claro na borda interna e geada acumulada nas bordas. O "vidro" vem da luz e do filete, não de desfoque | Facetas finas de geada só perto das bordas; o centro fica limpo               |
| `alchemical-corrosion` | Ácido viscoso       | Verde molhado com reflexo, bolhas de borda acesa, pequenas corrosões e ácido empoçado no canto                                                                                 | Gotas escorrendo do topo, com uma conta na ponta                              |
| `crypt-stone`          | Pedra necrótica     | Lajes manchadas (ruído grande), grão fino, brilho violeta subindo de baixo e vinheta pesada                                                                                    | Duas rachaduras finas, de tamanho fixo, ancoradas em dois cantos              |
| `divine-parchment`     | Pergaminho radiante | Papel manchado (fibras curtas), grão, luz suave caindo do alto e borda queimada                                                                                                | Filete dourado duplo 5 px para dentro da moldura e pontos dourados nos cantos |

### Validação visual

As capturas foram feitas no build de produção, nos temas escuro e claro, no desktop (1280 px) e no celular (390 px), em painéis de três tamanhos e no `SpellCard` real (fechado e aberto).

| Material             | Escuro                               | Claro                                                                                   | Legibilidade                                                                          | Ajustes feitos                                                                      |
| -------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Glacial Glass        | Parece vidro gelado                  | Azul claro, limpo                                                                       | Boa; o centro fica limpo                                                              | Nenhum                                                                              |
| Alchemical Corrosion | Parece ácido, com gotas e bolhas     | Funciona                                                                                | Boa; uma bolha encosta no chip "Instantaneous" do card aberto                         | Pendente: tirar bolhas da faixa dos chips                                           |
| Crypt Stone          | Parece pedra; as rachaduras aparecem | **Reprovado na 1ª versão**: as manchas escuras cortavam o contraste do texto secundário | Escuro bom; claro corrigido, falta revalidar                                          | Rachaduras com tamanho fixo (antes esticavam); manchas mais suaves só no tema claro |
| Divine Parchment     | Papel manchado, quente               | Pergaminho claro                                                                        | **Reprovado na 1ª versão**: raios fortes atrás do texto e fibras que pareciam madeira | Raios trocados por uma luz suave do alto; fibras curtas                             |

## Desempenho

### Ambiente

| Item        | Valor                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Máquina     | Intel Core Ultra 9 275HX, 24 núcleos, 16 GB                                                                                                  |
| Sistema     | Linux 6.18 (WSL2)                                                                                                                            |
| Navegador   | Chromium 158.0.8127.18 (Playwright), **headless**                                                                                            |
| Node / Next | v24.22.1 / 16.4.6, **build de produção** com `GRIMOIRE_LAB=1`                                                                                |
| Commit base | `5c19f2a` (os materiais estavam no estado da validação visual, antes do ajuste de manchas do tema claro, que não afeta o tema escuro medido) |
| Data        | 15/11/2026                                                                                                                                   |

### Método

- **Cenários:** o card original (`none`) e cada material, com **100 `SpellCard`s** reais e todos fechados.
- **Aparelhos:**
  - **desktop:** 1280 × 900, DPR 1, sem limitação de CPU;
  - **celular:** 390 × 844, DPR 2, toque, **CPU 4× mais lenta**.
- **Amostras:** 5 por cenário e aparelho, **intercaladas** entre os cenários, com uma rodada de aquecimento descartada. São 50 amostras no total.
- **Duas fases medidas separadamente, cada uma com o seu trace do Chrome:**
  1. **Renderização inicial:** abrir a página e esperar 1,5 s.
  2. **Rolagem:** 110 eventos de roda do mouse de 120 px cada, cobrindo os 100 cards.
- **Métricas:**
  - **pelo trace:** `style` (UpdateLayoutTree), `layout`, `paint` (PrePaint + Paint), `raster` (RasterTask), `composite` (Layerize + Commit + UpdateLayer) e `decode`;
  - **pela página:** intervalos entre frames (p50 e p95), frames acima de 33 ms, frames longos (`long-animation-frame`) e LCP.
- **Critério:** uma diferença só é **consistente (●)** quando as faixas de amostras não se sobrepõem, ou seja, todas as amostras do material ficam acima (ou abaixo) de todas as do original.

Dados brutos: [material-surfaces-bench.json](material-surfaces-bench.json). Para reproduzir:

```bash
GRIMOIRE_LAB=1 npx next build && GRIMOIRE_LAB=1 npx next start -p 3006
SAMPLES=5 npx tsx scripts/grimoire-materials-bench.ts http://localhost:3006 bench.json
npx tsx scripts/grimoire-materials-report.ts bench.json
```

### Resultados

Valores em ms: mediana [mín–máx], e a variação da mediana contra o card original.

**Desktop: renderização inicial.** Nenhuma diferença consistente.

| Métrica   | original         | glacial-glass         | alchemical-corrosion  | crypt-stone          | divine-parchment      |
| --------- | ---------------- | --------------------- | --------------------- | -------------------- | --------------------- |
| style     | 39.4 [31.1–42.3] | 33.5 [27.7–45.8] −15% | 33.8 [30.1–36.7] −14% | 36.5 [29.2–43.0] −7% | 37.7 [29.9–48.8] −4%  |
| layout    | 13.9 [12.2–18.8] | 12.8 [12.5–23.9] −8%  | 13.6 [12.4–15.0] −2%  | 14.1 [13.0–18.4] +1% | 16.8 [10.7–19.0] +21% |
| paint     | 8.9 [6.2–15.5]   | 8.2 [6.4–9.5] −8%     | 8.6 [7.1–9.5] −4%     | 7.2 [6.3–11.6] −19%  | 8.6 [5.6–10.6] −4%    |
| raster    | 208 [195–242]    | 209 [135–254] +1%     | 210 [205–220] +1%     | 199 [140–295] −4%    | 200 [142–218] −4%     |
| composite | 2.0 [1.7–3.8]    | 1.9 [1.7–3.0] −8%     | 2.3 [1.7–2.8] +14%    | 1.9 [1.4–2.3] −6%    | 2.5 [1.5–3.8] +22%    |
| LCP       | 188 [168–236]    | 200 [196–236] +6%     | 180 [180–236] −4%     | 184 [172–220] −2%    | 208 [172–228] +11%    |

**Desktop: rolagem.**

| Métrica        | original         | glacial-glass                | alchemical-corrosion         | crypt-stone                  | divine-parchment             |
| -------------- | ---------------- | ---------------------------- | ---------------------------- | ---------------------------- | ---------------------------- |
| style          | 121 [110–150]    | 159 [132–243] +31%           | 194 [174–203] +60% ●         | 138 [130–165] +14%           | 148 [133–205] +22%           |
| layout         | 64.3 [53.8–77.7] | 69.7 [56.2–86.1] +8%         | 57.1 [51.7–63.9] −11%        | 58.4 [57.1–61.8] −9%         | 67.3 [58.3–77.6] +5%         |
| paint          | 209 [148–230]    | 223 [178–291] +7%            | 225 [194–245] +8%            | 210 [175–269] +1%            | 234 [207–261] +12%           |
| **raster**     | 1529 [1427–1698] | 4454 [4254–5481] **+191% ●** | 8214 [7928–8528] **+437% ●** | 3878 [3660–4078] **+154% ●** | 5181 [4597–5413] **+239% ●** |
| composite      | 147 [120–188]    | 203 [189–338] +38% ●         | 508 [502–582] +245% ●        | 197 [171–235] +34%           | 210 [196–263] +42% ●         |
| frame p95      | 16.7 [16.7–16.8] | 16.8 [16.7–16.8]             | 16.8 [16.8–33.3] ●           | 16.8 [16.7–16.8]             | 16.7 [16.7–16.8]             |
| frames > 33 ms | 0 [0–0]          | 0 [0–1]                      | **3 [2–6] ●**                | 0 [0–1]                      | 1 [0–2]                      |
| frames longos  | 0                | 0                            | 0                            | 0                            | 0                            |

**Celular (CPU 4×): renderização inicial.** Nenhuma diferença consistente. As medianas ficaram entre −40% e +33%, com faixas sobrepostas (por exemplo, paint 42,0 [39–68] no original contra 56,0 [39–60] no Glacial). Isso é variação de amostra, não sinal.

**Celular (CPU 4×): rolagem.**

| Métrica        | original         | glacial-glass             | alchemical-corrosion         | crypt-stone              | divine-parchment           |
| -------------- | ---------------- | ------------------------- | ---------------------------- | ------------------------ | -------------------------- |
| style          | 139 [136–213]    | 159 [124–769] +14%        | 158 [143–163] +14%           | 155 [142–163] +12%       | 158 [156–220] +14%         |
| layout         | 388 [344–491]    | 394 [351–2024] +2%        | 372 [360–412] −4%            | 365 [335–399] −6%        | 357 [349–479] −8%          |
| paint          | 932 [864–1294]   | 1049 [955–5217] +13%      | 1078 [1022–1163] +16%        | 1067 [1032–1214] +14%    | 1069 [1019–1370] +15%      |
| **raster**     | 450 [427–497]    | 792 [701–3988] **+76% ●** | 1261 [1186–1465] **+180% ●** | 873 [810–970] **+94% ●** | 953 [939–1139] **+112% ●** |
| composite      | 661 [594–948]    | 724 [620–4651] +9%        | 695 [636–725] +5%            | 735 [695–896] +11%       | 696 [666–940] +5%          |
| frame p95      | 50.0 [50.0–66.7] | 66.6 [50.0–317]           | 50.1 [50.0–66.7]             | 50.1 [50.0–66.7]         | 50.1 [50.0–66.7]           |
| frames > 33 ms | 32 [26–48]       | 35 [32–96]                | 34 [31–37]                   | 33 [28–35]               | 31 [28–45]                 |
| frames longos  | 5 [2–9]          | 5 [4–71]                  | 7 [5–8]                      | 6 [4–7]                  | 5 [5–14]                   |

### Leitura

1. **Renderização inicial: sem diferença mensurável** nos dois aparelhos. O `content-visibility: auto` só deixa pintar os cards visíveis, então o custo dos materiais não se multiplica pelos 100 cards ao abrir a página.
2. **Rolagem: o custo existe e está no _raster_.** É consistente em todos os materiais e nos dois aparelhos: de +76% a +437%. O raster roda fora da thread principal (são as tarefas que transformam o desenho em pixels). A thread principal quase não muda: paint de +1% a +16%, sem consistência. Gradientes e texturas **não são de graça**: cada card que entra na tela precisa ser rasterizado com todas as camadas.
3. **Impacto em frames:**
   - **Desktop:** só a **Alchemical Corrosion** tem efeito visível e consistente: 2 a 6 frames acima de 33 ms em cada rolagem, contra 0 no original. Os outros três ficam em 0 ou 1.
   - **Celular emulado:** o card **original já perde frames** nesse cenário (32 frames acima de 33 ms e p95 de 50 ms). Nenhum material piora isso de forma consistente. A Glacial Glass teve **uma** amostra muito fora da curva (p95 de 317 ms e 71 frames longos), mas as outras quatro ficaram dentro da faixa do original. Isso não é conclusivo, e pede repetição.
4. **O custo acompanha o número de camadas.** A Corrosion tem a maior pilha, com cerca de 18 gradientes entre superfície e ornamento, e o maior custo. A Crypt Stone, com 6 camadas, a maioria texturas em tile, tem o menor.

### Limites desta medição (o que ela não prova)

- **Headless e WSL2:** o Chromium headless costuma rasterizar por software, e uma GPU real faria o raster bem mais rápido. Os números de raster servem para **comparar materiais entre si**, não para prever o tempo num aparelho real.
- **Celular emulado não é celular:** o limitador de CPU não simula a GPU nem a memória de um telefone. Antes de aprovar para produção, vale medir em um Android intermediário de verdade, pelo Chrome remote debugging.
- **5 amostras:** são suficientes para os sinais grandes (raster e frames da Corrosion), mas não para as diferenças pequenas de style, layout e paint. Essas ficam como **não conclusivas**.
- **Só cards fechados:** a medição foi feita com todos os cards fechados. O card aberto (com `SpellVFX`) e o tema claro não foram medidos.

## Recomendação

| Material                 | Visual                    | Legibilidade                                | Desempenho                                                                     | Recomendação                                                                                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Crypt Stone**          | Aprovado no escuro        | Escuro ok; claro corrigido, falta revalidar | O menor custo de raster (+154% desktop, +94% celular), sem impacto em frames   | **Candidato.** Revalidar o tema claro                                                                                                                               |
| **Glacial Glass**        | Aprovado                  | Ok                                          | Raster +191% / +76%, sem impacto em frames; 1 amostra fora da curva no celular | **Candidato.** Repetir a medição no celular                                                                                                                         |
| **Divine Parchment**     | Aprovado depois do ajuste | Ok depois do ajuste                         | Raster +239% / +112%; 0 a 2 frames > 33 ms no desktop (não consistente)        | **Candidato com ressalva.** Reduzir uma camada de textura e medir de novo                                                                                           |
| **Alchemical Corrosion** | Aprovado                  | Uma bolha encosta nos chips                 | **O único com perda de frames consistente** no desktop; raster +437%           | **Não aprovar como está.** Juntar bolhas, gotas e corrosões numa textura estática única (1 SVG ou WebP em tile) no lugar de cerca de 18 gradientes, e medir de novo |

Recomendação geral:

- **Antes de qualquer integração**, considerar o material **só no card aberto**, ou em poucos cards (por exemplo, os preparados), e não nos 100 de uma vez. O custo está no raster de cada card que aparece na tela durante a rolagem. Uma alternativa é medir uma versão "leve" de cada material, só com a cor e a luz, para os cards fechados.
- Medir num aparelho Android real antes de levar qualquer material ao spellbook.

## Próximos passos (para a dona decidir)

1. Aprovar ou recusar cada material pelo visual, no `/dev/grimoire/materials`.
2. Escolher a saída do OverflowBorders (A, B ou C acima), se ornamentos que passam da borda continuarem no plano.
3. Refazer a Corrosion como textura única e medir de novo.
4. Medir num celular real.
