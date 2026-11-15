# Exploração: Material Surface System

Fase de exploração, feita em 15/11/2026 na branch `feat/grimoire-material-surfaces`. Os materiais **não estão no spellbook**: só existem no laboratório interno `/dev/grimoire`. Nenhum material foi aprovado ainda; este documento traz os dados para a decisão da dona.

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

- `src/frontend/components/grimoire/material-surface/types.ts`: `MATERIAL_IDS`, `MaterialId` e `CardMaterial` (`{ id, layers }`). `layers(clipped)` devolve o recorte, com a superfície e o que o card quiser recortar junto, e o ornamento.
- `src/frontend/components/grimoire/material-surface/MaterialSurface.tsx`:
  - `<MaterialLayers>`: a peça que qualquer card usa (magia, item, ficha);
  - `cardMaterial(id)`: as mesmas camadas no formato que o `SpellCard` recebe;
  - `<MaterialSurface>`: um painel completo em três camadas, com a prop `tint`.
- `src/frontend/constants/grimoire-materials.ts`: o mapa de D&D 5e, de exemplo (magia: o dano, senão a escola; item: o grupo da mochila).
- `src/frontend/components/grimoire/material-surface/materials.module.css`: os quatro materiais. É um **CSS Module**, então só é carregado onde o componente é importado.
- `src/frontend/components/character/spells/spell-card/SpellCard.tsx`: a prop opcional `material`.
- `app/[locale]/dev/grimoire/page.tsx` + `src/frontend/dev/grimoire/`: o laboratório.
- `scripts/grimoire-materials-bench.ts` e `scripts/grimoire-materials-report.ts`: o benchmark e o relatório.

### Usar em qualquer card (decisão 25 da spec-mãe)

A biblioteca não conhece magias, itens nem sistemas de jogo. O card que recebe o material:

1. é `position: relative`, com cantos arredondados;
2. define `--grimoire-tint` com a cor do conteúdo dele (`var(--spell-color)`, `var(--item-color)`, `var(--character-color)`);
3. define `--grimoire-clip-radius` se o raio interno for diferente do dele (por exemplo, `calc(var(--radius-xl) - 1px)` com borda de 1 px);
4. desenha `<MaterialLayers material="crypt-stone" />` uma vez, com o conteúdo por cima (`relative z-10`).

Qual material cada conteúdo usa fica num mapa por sistema, fora da biblioteca. O laboratório mostra os dois usos:

- `?material=auto` aplica o mapa de magias de D&D;
- a seção "Itens da mochila" usa ladrilhos com as classes do `ItemGrid` e itens reais do catálogo.

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

- **Rota:** `/dev/grimoire`, com parâmetros `?material=<id>&count=<1–100>&expanded=1`.
- **Trava:** `isGrimoireLabEnabled()` (`src/frontend/dev/grimoire/lab-access.ts`, com teste unitário). A página existe em desenvolvimento. Num build de produção, ela só existe se o build for feito com `GRIMOIRE_LAB=1`, o que só o benchmark local faz. A Vercel nunca define essa variável.
- **Verificado num build de produção normal (`next build` + `next start`):** a rota sai como página estática de 404, e `/dev/grimoire`, `?material=crypt-stone&count=100` e `/pt/dev/...` respondem 404. A página também declara `robots: noindex, nofollow`.
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

Dados brutos: [material-surfaces-bench-round1.json](material-surfaces-bench-round1.json). Para reproduzir:

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

## Rodada 2 (15/11): variantes, card aberto, dois temas e cor da magia

A rodada 1 e os seus dados ([material-surfaces-bench-round1.json](material-surfaces-bench-round1.json)) ficam como estavam, para comparação. As mudanças desta rodada:

1. **A cor do material segue a magia.**
   - Todo material usa `--m: var(--spell-color, <cor própria>)` (depois virou `--grimoire-tint`, decisão 25). A cor própria só vale onde não há magia (os painéis do laboratório).
   - As cores derivadas saem dela: o tom escuro do gelo e do ácido (`color-mix(in oklab, var(--m), black …)`) e o tom envelhecido do pergaminho.
   - A pedra também é tingida: `--stone` mistura a cor da magia com o cinza da pedra (45% no tema escuro; no claro, 60% com um cinza mais claro, para não esconder a cor nem cortar o contraste). Na primeira versão a pedra ficava cinza neutra, e a dona pediu a cor da magia.
   - As fibras do pergaminho deixaram de ser marrons (elas viravam um tom barrento por cima da cor da magia): agora só escurecem, e o papel leva mais da cor da magia. O WebP das fibras foi regerado a partir do mesmo SVG.
   - **Emenda das texturas:** a dona viu cortes retos na Crypt Stone, a cada 320 px. O `stitchTiles` do `feTurbulence` fecha a emenda na região do filtro, e essa região, por padrão, é maior que o bloco (−10% a 120%). Agora cada filtro declara `x='0' y='0' width='100%' height='100%' filterUnits='userSpaceOnUse'`, e as cinco texturas emendam sem linha. Os WebP foram regerados.
   - Essas duas mudanças só trocam cores dentro do mesmo número de camadas. Pelo resultado da Glacial (abaixo), não devem mudar o custo, mas não foram medidas de novo.
   - Assim o material nunca briga com a faixa, o ícone e os selos do card, como nos efeitos por tipo de magia.
2. **Variante `baked` da Alchemical Corrosion.** As bolhas, as gotas e a película do topo saíram dos cerca de 18 gradientes e foram para três SVGs estáticos e minúsculos em `public/grimoire/materials/`. São formas pretas usadas como **máscara** sobre a cor da magia, então funcionam com qualquer cor. As corrosões são uma imagem preta comum.
3. **Variante `webp` da Crypt Stone e do Divine Parchment.** As mesmas texturas de ruído foram pré-renderizadas em WebP pelo `scripts/grimoire-bake-textures.ts` (o Chromium desenha o mesmo SVG em 2×), no lugar do `feTurbulence`.
4. **Revalidação visual:**
   - Crypt Stone no tema claro: **aprovada** depois do ajuste.
   - Divine Parchment: **aprovado** nos dois temas.
   - `baked` contra o original: **praticamente igual**. As gotas foram reduzidas para não passar por cima do nome nos cards fechados.
   - `webp` contra o SVG: **indistinguível**.
5. **Benchmark ampliado:** os mesmos 100 cards e o mesmo método da rodada 1, agora nos **dois temas** e com uma fase nova, **"abrir o card"**. Essa fase clica no primeiro card e mede a abertura com o `SpellVFX` por cima do material.
   - **Rodada 2:** 7 cenários × 2 temas × 2 aparelhos × 5 amostras ([dados](material-surfaces-bench-round2.json)). As amostras `baked` foram descartadas, porque os SVGs mudaram no meio da medição.
   - **Rodada 2b:** a versão final, com a cor da magia e a `baked` com máscaras, comparada com o card original, a Glacial Glass e a Corrosion original ([dados](material-surfaces-bench-round2b.json)).
   - **Ambiente:** o mesmo da rodada 1 (Chromium 158 headless, WSL2), com os builds em `.next-bench`. Um servidor `next dev` parado esteve ligado durante parte da rodada 2, o que é ruído possível. Por isso só comparo cenários **dentro da mesma rodada**.

### Variante × original (mediana; variação contra o material original na mesma rodada)

| Variante                          | Aparelho | Tema   | Raster na rolagem | Composite na rolagem | Raster ao abrir |
| --------------------------------- | -------- | ------ | ----------------- | -------------------- | --------------- |
| `alchemical-corrosion+baked` (2b) | desktop  | escuro | 3127 **−59% ●**   | 123 **−68% ●**       | 544 **−44% ●**  |
|                                   | desktop  | claro  | 2639 **−59% ●**   | 111 **−42% ●**       | 444 **−51% ●**  |
|                                   | celular  | escuro | 577 **−44% ●**    | 408 −1%              | 273 **−58% ●**  |
|                                   | celular  | claro  | 499 **−44% ●**    | 405 +1%              | 180 **−67% ●**  |
| `crypt-stone+webp` (2)            | desktop  | escuro | 3209 −7%          | 127 −2%              | 554 −11%        |
|                                   | desktop  | claro  | 3125 −1%          | 123 +6%              | 540 −7%         |
|                                   | celular  | escuro | 583 **−25% ●**    | 519 +19%             | 238 −15%        |
|                                   | celular  | claro  | 548 −18%          | 533 +27%             | 211 −17%        |
| `divine-parchment+webp` (2)       | desktop  | escuro | 4024 −2%          | 120 −17%             | 767 −1%         |
|                                   | desktop  | claro  | 3426 −2%          | 109 −1%              | 639 −7%         |
|                                   | celular  | escuro | 740 −14%          | 462 −7%              | 313 −14%        |

### Contra o card original (rodada 2b, tema escuro; mediana e variação)

| Fase                    | Aparelho | Glacial Glass   | Corrosion original | Corrosion `baked` |
| ----------------------- | -------- | --------------- | ------------------ | ----------------- |
| Rolagem: raster         | desktop  | +246% ●         | +552% ●            | **+170% ●**       |
| Rolagem: raster         | celular  | +65% ●          | +161% ●            | **+46% ●**        |
| Rolagem: frames > 33 ms | desktop  | 0 (original: 0) | 0 [0–2]            | 0                 |
| Abrir: raster           | desktop  | +201% ●         | +319% ●            | **+135% ●**       |
| Abrir: raster           | celular  | +232% ●         | +628% ●            | **+206% ●**       |
| Abrir: frame p95        | desktop  | 16,7 ms         | 16,8 [16,8–33,3] ● | 16,7 ms           |

### Leitura da rodada 2

1. **A `baked` resolveu a Corrosion.** O raster caiu de 44% a 67%, de forma consistente nos dois aparelhos, nos dois temas e nas duas fases. Ela não perde frames, e agora custa **menos que a Glacial Glass**. O que pesava era a pilha de gradientes, não o visual em si.
2. **O WebP não compensa.** A queda de raster vai de 1% a 25%, e só um caso é consistente (pedra no celular, tema escuro). Em troca:
   - os arquivos pesam cerca de **490 KB** (de 63 a 135 KB cada; ruído fino quase não comprime), contra menos de 1 KB de cada SVG inline;
   - surge algum tempo de decodificação de imagem;
   - os frames não melhoram.

   **Recomendação: manter o `feTurbulence` inline.**

3. **Abrir o card com o `SpellVFX`:** todos os materiais aumentam o raster da abertura. Só a Corrosion original pesa a ponto de mexer no p95 dos frames; os demais abrem com frames de 16,7 ms.
4. **O tema claro segue o padrão do escuro.** Nenhum material mostra custo diferente por tema.
5. **A cor da magia não mudou o custo.** A Glacial ficou na mesma faixa da rodada 2. Trocar a cor fixa por `var(--spell-color)` é o mesmo `color-mix`.

## Recomendação (atualizada na rodada 2)

| Material                                                     | Visual                       | Legibilidade                               | Desempenho                                                                           | Recomendação                                 |
| ------------------------------------------------------------ | ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| **Alchemical Corrosion** (versão em máscaras, antes `baked`) | Aprovado (igual ao original) | Ok; as gotas ficam acima do nome           | Raster −44% a −67% contra o original, sem perda de frames; mais barato que a Glacial | **Candidato.** Substitui a original          |
| **Crypt Stone**                                              | Aprovado                     | Aprovada nos dois temas (claro revalidado) | O mais barato entre os originais                                                     | **Candidato**                                |
| **Glacial Glass**                                            | Aprovado                     | Ok                                         | Raster +65% a +246%, sem perda de frames                                             | **Candidato**                                |
| **Divine Parchment**                                         | Aprovado depois do ajuste    | Ok nos dois temas                          | Raster +113% a +211%, sem perda consistente de frames                                | **Candidato**                                |
| Alchemical Corrosion original                                | Aprovado                     | Ok                                         | A única que perde frames                                                             | **Descartar** em favor da `baked`            |
| Variantes `webp`                                             | Iguais ao SVG                | —                                          | Ganho pequeno e quase nunca consistente, com cerca de 490 KB de imagens              | **Não usar.** Manter o `feTurbulence` inline |

Recomendação geral, que continua valendo:

- **Material em 100 cards fechados de uma vez é o pior caso**, e mesmo assim só a Corrosion original perdeu frames.
- Antes de integrar, vale escolher **onde** o material aparece. Por exemplo: só no card aberto, só nos preparados, ou numa versão "leve" nos cards fechados.
- Também vale medir num Android real.
- **Lição:** o custo vem do número de camadas pintadas por card. Juntar detalhes em poucos assets estáticos (máscaras) é o que mais reduz o custo sem mudar o visual.

## Estado final da exploração (15/11)

A exploração está **concluída** como estudo técnico. O PR continua como rascunho e **nenhum material foi integrado ao spellbook**.

**Limpeza das variantes descartadas:**

- A **Alchemical Corrosion** passou a ser a versão em máscaras SVG estáticas (a antiga variante `baked`). A versão só com gradientes saiu, porque era a única que perdia frames.
- A variante **`webp`** saiu:
  - os 5 arquivos WebP (cerca de 500 KB, que ficariam públicos em `public/`);
  - as regras de CSS;
  - o `scripts/grimoire-bake-textures.ts`.

  As texturas continuam em `feTurbulence` inline (menos de 1 KB cada).

- Sem variantes restantes, o mecanismo de variantes também saiu: `data-variant`, `?variant=` e a seção "original × otimizada" do laboratório.
- **O histórico das medições continua inteiro.** Ficam os três arquivos de dados (rodada 1, rodada 2 e rodada 2b) e as seções acima. O `grimoire-materials-report.ts` ainda lê as variantes desses arquivos antigos. As versões removidas estão no histórico do git do PR.

**Revisão visual final:** os quatro materiais foram vistos nos dois temas, no desktop e no celular, nos painéis do laboratório e na lista de `SpellCard`s com um card aberto, sempre na cor de cada magia. Todos aprovados.

**Detalhe anotado para uma próxima etapa:** no celular, a rachadura do canto superior direito da Crypt Stone cruza os ícones de componente (V, S, M). É só decorativa e não atrapalha a leitura.

**Fica para outra etapa:**

- **OverflowBorders.** A direção preferida é a opção B: o ornamento como irmão do elemento com `content-visibility`, dentro de um invólucro. Antes, é preciso validar o custo e a semântica.
- Medir num Android real.
- Decidir **onde** os materiais aparecem no spellbook: no card aberto, nos preparados ou em todos.

## Tema claro: revisão (15/11)

A dona viu os materiais no tema claro e pediu ajustes:

- **Glacial Glass:** a base virou quase branca, com reflexos brancos, a borda tingida e uma linha clara em cima e outra mais escura embaixo, que dão a espessura. A geada virou cristais brancos, só nas bordas. Antes eram linhas tingidas, que pareciam uma tela de arame.
- **Alchemical Corrosion:** as gotas e as bolhas ganharam um tom mais escuro da cor da magia, e a superfície ganhou um brilho úmido e uma poça mais forte.
- **Crypt Stone e Divine Parchment:** destoavam dos outros por causa do "preto de fundo". As texturas de ruído preto (granulado, manchas e fibras) viravam uma película cinza suja no fundo claro. A pedra virou uma pedra clara tingida, e o pergaminho, um velino claro. As texturas continuam por baixo de um véu claro, a vinheta ficou só um toque, e as rachaduras da pedra seguem a cor da magia.

O tema escuro não mudou.

## Efeitos do card aberto (15/11)

Os 21 efeitos por tipo usam o mesmo laboratório (`/dev/grimoire`) e o mesmo benchmark, com cenários `fx:<id>`. Foram medidos em duas rodadas: [card-effects-bench-round1.json](card-effects-bench-round1.json) e [card-effects-bench-round2.json](card-effects-bench-round2.json).

- **Frames:** nenhum efeito aumentou os frames lentos ao abrir o card, nem no celular lento.
- **Custo:** abrir custa mais estilo, pintura e raster, uma vez só.
- **Rolagem:** não muda, porque com os cards fechados não há efeito.

Os detalhes estão em [spell-type-effects.md](spell-type-effects.md).

## Próximos passos (para a dona decidir)

1. Aprovar ou recusar cada material pelo visual, no `/dev/grimoire`.
2. Escolher a saída do OverflowBorders (A, B ou C acima), se ornamentos que passam da borda continuarem no plano.
3. ~~Refazer a Corrosion como textura única e medir de novo.~~ Feito na rodada 2 (`baked`).
4. Medir num celular real.

## Ácido sem gotas no topo (15/11)

A pedido da dona, as gotas da borda de cima do Alchemical Corrosion saíram (`acid-drips.svg` foi apagado). No lugar entrou um respingo espalhado pelo card todo: bolinhas cheias e anéis num ladrilho estático pequeno (`acid-spatter.svg`, 160 × 120). O mesmo ladrilho aparece duas vezes:

- **No fundo, em preto translúcido:** as bolinhas escuras.
- **Na camada da cor da magia, como máscara:** as bolinhas verdes, maiores e deslocadas, para não caírem em cima das escuras.

A película do topo e os anéis das bolhas nos cantos continuam. Com o desenho do ácido aberto por cima, o topo agora tem só as gotas do desenho, não duas camadas de gotas.
