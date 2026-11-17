# Exploração: efeitos do card aberto

Explorado em 14/11/2026, com a dona, numa amostra interativa: [Card Aberto do Grimório](https://claude.ai/artifact/AtKgqUc3DDRpAZfNgCTpfm#card-aberto). A amostra é privada; só a dona tem acesso. **Ainda não vai para o spellbook**, e a exploração de outros efeitos continua.

## Regra que guiou tudo

O card aberto pode ter um efeito especial **sem penalizar o desempenho** (decisão da dona). Na prática:

- **Só um card aberto por vez.** O efeito fica só nele, como o `SpellVFX` atual (`src/frontend/components/character/spells/spell-card/SpellCard.tsx`), e nunca se multiplica pela lista.
- **A base é parada.** São gradientes e máscara em CSS: o navegador pinta uma vez ao abrir e depois o card custa o mesmo que um card comum.
- **Movimento só por evento:**
  - **Hover:** só no card sob o mouse e só com `@media (hover: hover)`. No celular, nada acontece.
  - **Abertura:** roda uma vez (até ~1,1 s) e some.
  - **Movimento reduzido:** nada se mexe.
- **Os efeitos ficam presos ao anel da borda**, uma camada com `mask-composite: exclude`, e nunca passam por cima do texto.
- **Fora:** canvas, WebGL (shaders), blur, laços de animação, código que segue o mouse e dependências novas.

## Aprovado (dona)

### Base parada do card aberto

| ID                   | Efeito                                                                                        | Técnica                                                                                                                  | Origem                                               |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `open-border-arcane` | **Borda arcana:** gradiente cônico na cor da magia, parado                                    | `linear-gradient(var(--card)) padding-box, conic-gradient(from 210deg, var(--spell-color) …) border-box` num elemento só | Info Card (REF-111)                                  |
| `open-bg-aura`       | **Aura:** luz da cor da magia vinda do canto, que some antes do texto, mais uma vinheta suave | 2 `radial-gradient` com `color-mix(var(--spell-color) …)` + vinheta (REF-116) + `mask-image` de cima para baixo          | Violet Nocturne e Oceanic Shimmer (REF-112, REF-113) |
| `open-bg-ember`      | **Brasa:** luz baixa subindo do pé do card, como uma vela                                     | 1 `radial-gradient` ancorado em `50% 105%` + vinheta                                                                     | Ember Bloom e Amber Glow (REF-114, REF-115)          |

A Borda arcana combina com qualquer um dos dois fundos. A sugestão em aberto é usar Brasa nas magias de luz e calor (fogo, radiante, relâmpago, trovão) e Aura nas outras.

### Efeitos de hover (cards fechados)

| ID                  | Efeito                                                                  | Técnica                                                                                                             | Origem                                 |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `hover-glow-ring`   | **Anel de luz:** um brilho na cor da magia acende no canto da borda     | Anel mascarado com um `radial-gradient` fixo; só `opacity` faz transição                                            | Spotlight (REF-21), sem seguir o mouse |
| `hover-shine-sweep` | **Brilho que percorre:** uma luz atravessa a borda uma vez a cada hover | Anel mascarado com uma faixa em `linear-gradient`; animação de `background-position` só durante o `:hover`, uma vez | Shine Border (REF-16, MIT)             |
| `hover-border-turn` | **Borda que gira:** a luz da borda gira um pouco e volta                | `@property --a` (ângulo) com **transição** no hover, sem laço                                                       | Info Card (REF-111)                    |

### Efeitos de abertura (uma vez)

| ID                  | Efeito                                                                            | Técnica                                                                                      | Origem                    |
| ------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------- |
| `open-beam-lap`     | **Feixe:** um ponto de luz dá uma volta pela borda e some                         | `offset-path: rect(0 auto auto 0 round …)` + `@keyframes` de `offset-distance`, uma iteração | Border Beam (REF-34, MIT) |
| `open-light-spin`   | **Giro de luz:** uma luz gira uma vez em volta da borda e some                    | Quadrado com `conic-gradient` girando por `rotate` (roda no compositor), dentro do anel      | Animated Border (REF-17)  |
| `open-corner-flare` | **Cantos:** os quatro cantos acendem em sequência e ficam marcados, mais apagados | 4 marcas com `opacity`/`scale` defasados em 0, 80, 160 e 240 ms                              | Focus Frame (REF-38)      |

## Rejeitado (dona)

- **Revelação:** a Aura com uma entrada única ao abrir, em que o sigilo girava até o lugar e um brilho atravessava o nome da magia.
- **Shaders (WebGL) e Motion (#156) por enquanto:** a dona não quer penalizar o desempenho. A análise dos shaders, com as regras de uso (uma instância por página, pausas obrigatórias, opt-in), fica registrada na biblioteca de referências caso a ideia volte.

## Na biblioteca e a escolha do card de magia (17/11)

As bordas aprovadas viraram a peça `card-border` da biblioteca (`src/frontend/components/grimoire/card-border/`), com o CSS da amostra e a cor do card (`--grimoire-tint`, decisão 25):

- **Base parada:** o card aberto ganha sempre a Borda arcana.
- **Hover:** `glow` (Anel de luz), `shine` (Brilho que percorre) e `turn` (Borda que gira). Ficam todos dentro de `@media (hover: hover)`: no celular nada disso existe.
- **Abertura:** `beam` (Feixe), `spin` (Giro de luz) e `corners` (Cantos), uma vez, num anel ou nos cantos que só existem com o card aberto.
- **Tema claro:** a cor fica 30% mais funda, senão um tom claro (lima, amarelo) some numa borda fina.
- **Movimento reduzido:** nada se mexe. **Alto contraste (`forced-colors`):** os enfeites somem e o card fica com a borda do sistema.

O `SpellCard` ganhou a prop opcional `border` (só no laboratório). Os fundos Aura e Brasa ficaram de fora: os desenhos da dona e o fundo de cor dos emblemas ocupam esse lugar.

**Escolha da dona:** no card de magia, o **Anel de luz** no hover e o **Giro de luz** ao abrir, que se conectam (a luz do canto vira a luz que dá a volta). Está em `SPELL_CARD_BORDER`, em `src/frontend/constants/grimoire-effects.ts`. O Brilho que percorre, a Borda que gira, o Feixe e os Cantos ficam na biblioteca como opção para outros lugares.

No laboratório: `/dev/grimoire?hover=glow&opening=spin` (ou o link "o card de magia escolhido", com desenhos e ícones).

### Medição

Build de produção, 100 cards, 4 amostras por cenário, mediana em ms. A medição ganhou uma fase de hover, só no computador: o mouse passa por 6 cards fechados, 450 ms em cada. Em nenhum cenário houve quadro lento (`frameP95` 16,7 ms, nenhum quadro acima de 33 ms).

Computador, tema escuro ([card-effects-bench-borders.json](card-effects-bench-borders.json)):

| Cenário                    | hover: style | hover: raster | abrir: raster | abrir: composite | rolagem: raster |
| -------------------------- | ------------ | ------------- | ------------- | ---------------- | --------------- |
| sem bordas                 | 22           | 186           | 177           | 30               | 1039            |
| Anel de luz + Feixe        | 33           | 351           | 218           | 109              | 1076 (+4%)      |
| Brilho que percorre + Giro | 34           | 407           | 230           | 35               | 1160 (+12%)     |
| Borda que gira + Cantos    | 63           | 694           | 310           | 48               | 1868 (+80%)     |

- O **Anel de luz** é o hover mais barato. A **Borda que gira** é o mais caro, e é a única que pesa na rolagem: ela pinta uma borda em gradiente em todos os cards fechados.
- O **Giro de luz** é a abertura mais leve no composite (gira só por `rotate`); o **Feixe** (`offset-path`) triplica o composite da abertura.

Celular com a CPU 4x mais lenta, tema escuro ([card-effects-bench-borders-phone.json](card-effects-bench-borders-phone.json), medido depois de pôr o hover dentro de `(hover: hover)`):

| Cenário                     | abrir: style | abrir: paint | abrir: raster | abrir: composite | rolagem: paint |
| --------------------------- | ------------ | ------------ | ------------- | ---------------- | -------------- |
| sem bordas                  | 13           | 36           | 67            | 95               | 390            |
| Anel de luz + Giro de luz   | 26           | 53           | 86            | 100 (+6%)        | 404 (ruído)    |
| Brilho que percorre + Feixe | 27           | 79           | 81            | 357 (+278%)      | 388            |
| Borda que gira + Cantos     | 26           | 59           | 90            | 108              | 375            |

A rolagem no celular ficou igual à de hoje nos três cenários. Na primeira rodada, o anel dos cards fechados existia também no celular, onde nunca roda, e custava +9% de pintura; ele passou para dentro de `(hover: hover)`, o que a segunda rodada confirma. Abrir o card com Anel + Giro custa uns 13 ms de style e 19 ms de raster a mais, uma vez, sem quadro lento.

## Para medir quando for ao spellbook

- A abertura do card não pode ter frame acima de 50 ms (`long-animation-frame`) e precisa de CLS 0.
- O hover só repinta o anel do card sob o mouse (paint flashing).
- O `offset-path: rect()` do Feixe precisa de fallback: onde não houver suporte, o card abre sem o feixe.
- O `@property` da Borda que gira, onde não houver suporte, vira um card sem a transição do ângulo.
- Teste nos dois temas e com movimento reduzido.
