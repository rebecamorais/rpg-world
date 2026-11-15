# Exploração: efeitos por tipo de magia

Explorado em 14/11/2026 com a dona, numa amostra interativa: [Efeitos por Tipo de Magia](https://claude.ai/artifact/AtKgqUc3DDRpAZfNgCTpfm#efeitos). A amostra é privada; só a dona tem acesso. **Desde 15/11 está no laboratório (`/dev/grimoire`), mas não no spellbook.**

## Ideia (dona)

Cada tipo de magia ganha um efeito especial próprio no card aberto, do mesmo jeito que já ganha uma cor própria. Uns tipos têm efeitos específicos (os mais comuns), e outros têm efeitos de família (psíquico, necrótico...).

## Regra de escolha (igual à da cor)

O app já escolhe a cor e o ícone de cada magia em `useSpellDisplay` (`src/frontend/components/character/spells/spell-card/hooks/useSpellDisplay.ts`): **o tipo de dano primeiro, depois a escola**. O efeito segue a mesma regra:

- **com dano:** o efeito do tipo de dano (`DAMAGE_THEMES`, 13 tipos);
- **sem dano:** o efeito da escola (`SCHOOL_THEMES`, 8 escolas).

Assim, toda magia tem um efeito. Cerca de **77% das magias não causam dano**: 499 das 658, somando o SRD 5.1 e o 5.2. Por isso as escolas importam tanto quanto os danos.

**Cor (dona):** o efeito usa **sempre a cor da magia** (`--spell-color`), a mesma do card, da faixa e dos selos. Nunca uma cor fixa do efeito. Fora das magias, vale a cor do card que recebe o efeito, por `--grimoire-tint` (decisão 25 da spec-mãe).

## Os mais comuns

Os números são quantas magias de cada tipo existem nos SRD 5.1 e 5.2 somados.

| Tipo         | Magias | Motivo no card aberto                      | Ao abrir                  |
| ------------ | ------ | ------------------------------------------ | ------------------------- |
| Fogo         | 29     | Brasa subindo do pé do card, com fagulhas  | Sobe um pouco ao aparecer |
| Necrótico    | 21     | Névoa baixa e bordas escuras               | Aparece suave             |
| Radiante     | 18     | Raios descendo do alto, como luz de vitral | Aparece suave             |
| Psíquico     | 16     | Ondas concêntricas ecoando de um ponto     | Cresce do centro          |
| Transmutação | 108    | Círculo alquímico no canto                 | Uma luz gira pela borda   |
| Abjuração    | 83     | Malha hexagonal de proteção                | Aparece suave             |
| Conjuração   | 79     | Portal: anel duplo com brilho              | Cresce do centro          |

**Os demais danos:**

- **Força:** ondas de choque (o fundo que o app já usa para força).
- **Frio:** gelo vitrificado (ver abaixo).
- **Relâmpago:** um raio que pisca uma vez.
- **Ácido:** gotas escorrendo.
- **Veneno:** névoa verde com bolhas.
- **Trovão:** ondas de som.
- **Concussão:** uma marca de impacto.
- **Perfurante:** uma estocada.
- **Cortante:** três cortes em diagonal.

**As demais escolas:**

- **Adivinhação:** um mapa estrelado.
- **Encantamento:** um redemoinho.
- **Ilusão:** faixas de miragem.
- **Evocação:** uma explosão de raios.
- **Necromancia:** névoa de cripta.

## O que a dona aprovou na exploração

1. **Superfície tingida.** Em vez de só um fundo, o card inteiro ganha a superfície de um material na cor da magia:
   - **Frio:** gelo vitrificado, com reflexo no topo e filete claro na borda. Foi feito sem `backdrop-filter`: o glassmorphism por desfoque não teria nada atrás para desfocar e pesaria na rolagem.
   - **Ácido:** verde viscoso.
   - **Necrótico:** pedra de cripta.
   - **Radiante:** dourado iluminado.

   Essa linha virou o estudo dos materiais: [material-surfaces.md](material-surfaces.md).

2. **Ícones como detalhe.** Em vez do padrão de fundo, cada tipo usa o seu ícone: um grande e apagado, e alguns pequenos espalhados. Por exemplo, flocos de neve no frio, gotas no ácido, crânios no necrótico e estrelas no radiante. Os ícones são máscaras sobre a cor da magia.
3. **O brilho muda de posição** conforme o tipo, para os tipos não ficarem todos iguais:
   - frio: canto de cima à esquerda;
   - ácido: canto de baixo à direita;
   - necrótico: de baixo;
   - radiante: do alto, no centro.
4. **Ondulação (ripple) por tipo**, para diferenciar ainda mais:
   - **quando:** uma vez ao abrir, saindo do ícone da magia, e depois uma a cada clique ou toque no card aberto, saindo do ponto tocado;
   - **formato por tipo:**

     | Formato         | Tipos                             |
     | --------------- | --------------------------------- |
     | Losangos        | Frio, Abjuração                   |
     | Respingo        | Ácido                             |
     | Tracejado       | Psíquico, Encantamento, Ilusão    |
     | Grossa e rápida | Trovão, Força                     |
     | Com brilho      | Radiante, Conjuração, Adivinhação |
     | Difusa          | Necrótico, Necromancia            |
     | Anel simples    | Os demais                         |

   - **técnica:** de 1 a 3 anéis temporários, só com escala e transparência, removidos no `animationend` e desligados com movimento reduzido.

## Regra de desempenho (a mesma do resto do Grimório)

- Só o card aberto recebe o motivo, e só um card fica aberto por vez.
- Tudo é gradiente, máscara ou SVG estático, pintado uma vez.
- Movimento só por evento (abrir, hover, toque), sempre com fim. Nada de loop, canvas, WebGL ou blur.
- O texto de regras fica sempre legível: o motivo some antes dele ou fica fraco nos cantos.

## No laboratório (15/11)

**Código:**

- `src/frontend/components/grimoire/card-effect/`:
  - `types.ts`: o catálogo `EFFECTS`, com 21 efeitos. Cada um diz como é montado (motivo em gradiente, brilho com ícones, ou motivo com raio), a entrada ao abrir e a ondulação (formato e número de anéis);
  - `effects.module.css`: o CSS aprovado na amostra, com `--spell` trocado por `--grimoire-tint`;
  - `CardEffect.tsx`: `<EffectLayers>`, a peça que qualquer card usa, e `cardEffect(id)`, no formato que o `SpellCard` recebe.
- `src/frontend/constants/grimoire-effects.ts`: o mapa de D&D 5e (dano, senão escola). Todo dano e toda escola têm um efeito.
- `SpellCard`: prop opcional `effect`. Com ela, o efeito entra no lugar do fundo atual do card aberto (`SpellVFX`); sem ela, nada muda. O ícone da magia ganhou `data-grimoire-origin`, um atributo inerte que marca de onde sai a ondulação.

**Como um card usa:** além do que os materiais pedem (`position: relative`, `--grimoire-tint`), o card marca `data-grimoire-host` (os toques nele soltam ondulações) e desenha `<EffectLayers>` só enquanto está aberto.

**Ondulação:** são de 1 a 3 anéis criados direto no DOM e removidos no `animationend`, ou quando o card fecha. Com movimento reduzido, não são criados.

**Achado:** no `SpellCard`, tocar no card aberto **fecha o card**. Por isso a ondulação "a cada toque" quase não aparece ali; a que sai do ícone ao abrir aparece sempre. Nos painéis do laboratório, o toque funciona.

**Ícones:** o teste do sprite de ícones lê todo texto entre aspas do código. `thrust` e `splash` também são nomes de ícones de jogo, então o sprite ganhou esses 2 ícones (alguns bytes), como o próprio script prevê.

### Medição (rodada 1)

Dados em [card-effects-bench-round1.json](card-effects-bench-round1.json). Foi o mesmo benchmark dos materiais (`scripts/grimoire-materials-bench.ts`, com cenários `fx:<id>`), num build de produção:

- 100 cards;
- 5 amostras;
- os dois temas;
- desktop e celular com a CPU 4x mais lenta.

Foram medidos 4 efeitos, um de cada jeito de montar: `frost` (brilho e ícones), `embers` (gradientes), `alchemy-circle` (luz girando pela borda) e `bolt` (raio piscando).

**Ao abrir o card (onde o efeito aparece):**

| Celular, tema escuro (mediana) | sem efeito | frost  | embers | alchemy-circle | bolt  |
| ------------------------------ | ---------- | ------ | ------ | -------------- | ----- |
| style                          | 16 ms      | 44 ms  | 57 ms  | 58 ms          | 47 ms |
| paint                          | 52 ms      | 115 ms | 104 ms | 99 ms          | 99 ms |
| raster                         | 69 ms      | 102 ms | 167 ms | 134 ms         | 82 ms |
| frames acima de 33 ms          | 3          | 1      | 1      | 1              | 1     |

**Leitura:**

1. **Nenhum efeito fez perder frames.** Os frames lentos ao abrir não aumentaram em nenhum cenário, nem no celular lento.
2. **Abrir custa mais, uma vez só.** Estilo, pintura e raster sobem de 10 a 100 ms, espalhados pela animação de abertura. É o trabalho de desenhar as camadas novas. Com um card aberto por vez, esse custo não se soma.
3. **`embers` e `alchemy-circle` são os mais caros no raster.** São os que animam o motivo inteiro ao entrar: a brasa sobe, e a luz gira pela borda.
4. **A rolagem não muda.** Com os cards fechados não há efeito. As diferenças na rolagem ficam dentro do ruído das amostras.

### Medição (rodada 2): os outros 17 efeitos

Dados em [card-effects-bench-round2.json](card-effects-bench-round2.json). É o mesmo benchmark da rodada 1, com 3 amostras em vez de 5, os dois temas, desktop e celular. A linha de base (o card de hoje) foi medida de novo na mesma rodada.

**Ao abrir o card no celular com a CPU 4x mais lenta (mediana dos dois temas):**

| Efeito     | style | paint | raster | frames > 33 ms |
| ---------- | ----- | ----- | ------ | -------------- |
| sem efeito | 13    | 46    | 62     | 2              |
| grave-mist | 40    | 94    | 93     | 1              |
| sunlight   | 43    | 95    | 117    | 1              |
| echo       | 44    | 86    | 106    | 1              |
| shockwave  | 50    | 90    | 96     | 1              |
| impact     | 41    | 87    | 112    | 1              |
| drips      | 44    | 97    | 105    | 1              |
| thrust     | 41    | 88    | 109    | 1              |
| miasma     | 46    | 83    | 130    | 2              |
| soundwave  | 55    | 82    | 88     | 1              |
| slashes    | 38    | 83    | 113    | 2              |
| ward-mesh  | 46    | 86    | 119    | 1              |
| portal     | 44    | 87    | 119    | 1              |
| star-map   | 40    | 82    | 116    | 1              |
| swirl      | 44    | 88    | 108    | 2              |
| mirage     | 45    | 86    | 110    | 1              |
| burst      | 47    | 90    | 104    | 1              |
| crypt-fog  | 41    | 78    | 104    | 1              |

Os tempos estão em ms.

**Leitura das duas rodadas (todos os 21 efeitos):**

1. **Nenhum efeito aumentou os frames lentos ao abrir.** A mediana ficou igual ou abaixo da linha de base em todos.
2. **Todos custam a mesma faixa:** de 25 a 45 ms a mais de estilo, de 30 a 70 ms a mais de pintura e de 25 a 85 ms a mais de raster, uma vez, na abertura.
3. **Os mais caros no raster** são os que animam o motivo inteiro ao entrar: `embers` (148 ms), `alchemy-circle` (134 ms) e `miasma` (130 ms). Se um dia for preciso cortar, a primeira troca é a entrada deles para `fade`.

## Efeitos desenhados pela dona (15/11)

A dona desenhou efeitos novos em SVG e pediu que entrassem na biblioteca. Os dois seguem as regras do Grimório: cor da magia (`--grimoire-tint`), só no card aberto e parados depois de aparecer. Os efeitos antigos desses tipos (`sunlight`, `shockwave` e `echo`) continuam no catálogo, para comparar.

**Como entra um desenho novo:** a dona manda o SVG estático, de 740x168, e ele vai para `docs/grimoire-enchantments/effects-art/<id>.svg`. Depois:

1. `npx tsx scripts/grimoire-svg-effect.ts docs/grimoire-enchantments/effects-art/<id>.svg <id>` gera `src/frontend/components/grimoire/card-effect/art/<id>.ts`. O script troca cada cor fixa por um de quatro tons da cor da magia, pela luminosidade. Também dá a cada card os seus próprios ids de gradiente e tira do desenho a máscara, o título e qualquer animação.
2. O efeito entra em `EFFECTS` (`types.ts`) com `parts: 'art'`.
3. A máscara do desenho vira CSS em `effects.module.css` (`.art[data-art='<id>']`), para acompanhar o tamanho do card.
4. O mapa do sistema (`grimoire-effects.ts`) liga o tipo ao efeito.
5. Se o nome do efeito também for o nome de um ícone de jogo (como `resonance`), rode `npm run icons`: o teste do sprite lê todo texto entre aspas do código.

O teste `types.unit.test.ts` confere que todo efeito `art` tem desenho e que nenhum desenho ficou com cor fixa.

| Efeito                 | Tipo de dano | Como foi feito                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sunburst`             | Radiante     | Só CSS: raios longos alternados, num `repeating-conic-gradient`, saindo de um ponto logo acima da borda a 68% da largura, com um halo na origem. As máscaras apagam os raios para longe da origem e de cima para baixo, até no máximo 150 px do topo, para não chegar às regras no card alto do celular.                                                                                                                                                                                                                 |
| `arcane-paths`         | Força        | A geometria do SVG estático da dona (32 trilhas finas, 3 trilhas de energia, 3 pontos de energia e poeira) convertida em desenho de efeito (`art/arcane-paths.ts`, ver abaixo), em quatro tons da cor da magia. Fica no canto de cima à direita, com no máximo 168 px de altura, e some em direção ao título e no terço de baixo.                                                                                                                                                                                        |
| `resonance`            | Psíquico     | O SVG estático da dona com contornos de onda de pensamento em volta de um ponto focal à direita, com traços pontilhados e poeira. Usa as mesmas máscaras do original: começa a 42% da largura e some antes de 93% da altura.                                                                                                                                                                                                                                                                                             |
| `flame-ribbons`        | Fogo         | O SVG estático da dona (Flame Ribbons V1): fitas de chama curvas e pontiagudas, trilhas de calor, línguas soltas, faíscas e brasas, saindo do canto de cima à direita. Geometria própria, diferente do Sunburst, das trilhas da Força e da Ressonância. Como são formas preenchidas, e não traços finos como nos outros desenhos, entra com metade da intensidade. A máscara começa a 44% da largura e apaga as chamas antes de 72% da altura, para não chegar às regras. O `embers` continua no catálogo para comparar. |
| `frost-crystals`       | Frio         | O SVG estático da dona: facetas de gelo vítreo e um cristal de seis braços à direita. Substitui o `frost` (brilho e ícones de floco), que continua no catálogo. O material de vidro (Glacial Glass) segue igual por baixo, e o desenho entra só no card aberto. A máscara começa a 40% da largura e derrete o gelo antes de 76% da altura.                                                                                                                                                                               |
| `toxic-mist-filaments` | Veneno       | O SVG estático da dona (Toxic Mist & Filaments V1): névoa orgânica, filamentos ramificados, gotas e esporos, mais concentrados no topo e à direita. Substitui o `miasma`, que continua no catálogo. A máscara começa a 40% da largura e assenta a névoa antes de 76% da altura.                                                                                                                                                                                                                                          |
| `thunder-soundwaves`   | Trovão       | O SVG estático da dona: ondas de pressão que se curvam do topo para baixo, à direita. Substitui o `soundwave`, que continua no catálogo. É o único desenho que ocupa o card inteiro, de cima a baixo (esticado, `preserveAspectRatio="none"`, na lista `FULL_CARD` do `EffectArt`), sem máscara. O trovão não tem material: o card fica só com o desenho, com 70% da força para o texto continuar legível, e um brilho da cor da magia acompanhando as ondas.                                                            |
| `lightning-branches`   | Elétrico     | O SVG estático da dona: um raio principal com galhos e faíscas, descendo do canto de cima à direita. Substitui o `bolt`, que continua no catálogo. Como o trovão, ocupa o card inteiro (`FULL_CARD`) e vem com um gradiente da cor da magia: um brilho onde o raio cai e uma faixa ao longo do caminho dele. Entra com 55% da força, porque os zigue-zagues finos e claros cortam o texto mais que as ondas do trovão.                                                                                                   |

**Decisões da dona:**

- O Sunburst aparece **só no card aberto**, como os outros efeitos. O pedido original também falava em cards compactos.
- Os SVGs são **estáticos**. A versão animada do Floating Paths, com o fluxo sem fim, ficou de fora.

**O que mudou em relação aos pedidos:**

- **Cores:** o roxo e o ciano do Floating Paths e o dourado fixo do Sunburst viraram tons da cor da magia. Na Força, que é quase branca, as trilhas ficam prateadas.
- **Tema claro:** os dois usam tons mais escuros da cor, para aparecer no fundo claro.

**Medição do Sunburst** ([card-effects-bench-sunburst.json](card-effects-bench-sunburst.json), 5 amostras, os dois temas). Mediana ao abrir o card, em ms:

|                     | style | paint | raster | frames > 33 ms |
| ------------------- | ----- | ----- | ------ | -------------- |
| Celular, sem efeito | 15    | 55    | 63     | 1              |
| Celular, `sunlight` | 61    | 117   | 116    | 2              |
| Celular, `sunburst` | 55    | 98    | 147    | 1              |
| Desktop, sem efeito | 6     | 17    | 239    | 0              |
| Desktop, `sunburst` | 16    | 25    | 354    | 0              |

**Leitura:** o Sunburst não aumentou os frames lentos. Ele custa mais raster que o `sunlight`, por causa dos gradientes cônicos com máscara, mas fica na mesma faixa do `embers`. O `arcane-paths` é um SVG parado, pintado uma vez ao abrir.

## Próximos passos

- ~~Levar a lógica "dano, senão escola" para um mapa no código.~~ Feito: `grimoire-materials.ts` e `grimoire-effects.ts`.
- ~~Prototipar no laboratório e medir com o benchmark.~~ Feito em 15/11 (acima): os 21 efeitos medidos em duas rodadas.
- Revisão visual dos 21 efeitos pela dona, em `/dev/grimoire`.
- Decidir a ondulação por toque no `SpellCard`, já que o toque fecha o card.
- Decidir quais motivos viram material (superfície) e quais ficam como detalhe (ícone, ondulação).
