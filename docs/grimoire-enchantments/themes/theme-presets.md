# Temas (presets)

Um tema é **só configuração**: um atributo `data-grimoire="<id>"` no contêiner (a ficha, o spellbook) redefine os tokens `--grimoire-*` e liga ou desliga componentes. Nenhum componente React existe em versão por tema.

O escopo, segundo a decisão da spec do tema claro: o dono do personagem escolhe o tema, e todos que veem a ficha veem o mesmo tema. O seletor fica na página "Aparência da ficha", numa fase posterior.

## Como um tema se compõe

```css
/* Theme = tokens. Components only read var(--grimoire-*). */
[data-grimoire='arcane-scholar'] {
  --grimoire-ornament: #c9a227; /* metal of corners, dividers, seals */
  --grimoire-ornament-muted: color-mix(in srgb, var(--grimoire-ornament), transparent 70%);
  --grimoire-surface: var(--card); /* card surface under the texture */
  --grimoire-texture: var(--grimoire-texture-none);
  --grimoire-glow-strength: 0.35; /* 0 disables every glow */
  --grimoire-corner-mask: url('/grimoire/arcane-corners/runic.svg');
  --grimoire-divider-variant: geometric; /* Noto Sans Runic glyphs, no asset */
  --grimoire-title-font: var(--font-display);
}
```

**Regras:**

1. **A cor do jogador continua mandando.** `--character-color` (ficha) e `--spell-color` (card) seguem sendo o destaque. O tema define o **metal** dos ornamentos, a superfície, a textura e a fonte dos títulos. Um tema pode sugerir uma cor de personagem padrão, mas nunca sobrescreve a escolha do jogador.
2. **Dois modos de luz.** Todo tema define valores para o escuro (`[data-grimoire='x']`) e para o claro (`[data-theme='light'] [data-grimoire='x']`). O teste de contraste dos tokens (`theme-tokens.unit.test.ts`) passa a percorrer os temas.
3. **Componentes ligáveis.** O tema não monta componentes. Ele só preenche as variáveis que os componentes leem. Um componente cujo token é `none` (por exemplo `--grimoire-corner-mask: none`) não renderiza nada visível.
4. **Fallback = `legacy` (RPG World Classic).** É o padrão, a menos que o dono escolha outro tema. Sem `data-grimoire`, todos os `--grimoire-*` têm um valor neutro em `:root` que reproduz o visual de hoje.

## Tokens (proposta)

| Token                        | O que controla                                           | Valor `legacy`                                                  |
| ---------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| `--grimoire-ornament`        | Cor de cantos, divisórias, selos e marca d'água          | `var(--spell-color)` no card, `var(--character-color)` na ficha |
| `--grimoire-ornament-muted`  | Versão apagada (traços finos)                            | derivada por `color-mix`                                        |
| `--grimoire-surface`         | Superfície sob a textura                                 | `var(--card)`                                                   |
| `--grimoire-texture`         | `background-image` da textura (ruído, pergaminho)        | `none`                                                          |
| `--grimoire-texture-opacity` | Força da textura                                         | `0`                                                             |
| `--grimoire-glow-strength`   | Multiplicador de todo brilho (0 a 1)                     | `0.25` (o brilho atual do hover)                                |
| `--grimoire-corner-mask`     | Asset do `arcane-corners`                                | `none`                                                          |
| `--grimoire-divider-mask`    | Asset do `rune-divider`                                  | `none` (vira uma linha simples)                                 |
| `--grimoire-watermark-mask`  | Asset do `sigil-watermark`                               | `none` (mantém o ícone gigante do `SpellVFX`)                   |
| `--grimoire-border-runes`    | Runas no `runic-border` (`none` ou a fonte de runas)     | `none`                                                          |
| `--grimoire-rune-font`       | Fonte das runas (Noto Sans Runic, depois a arte da dona) | `none` (não carrega a fonte)                                    |
| `--grimoire-title-font`      | Fonte do `arcane-title`                                  | `var(--font-display)` (Cinzel)                                  |
| `--grimoire-motion`          | `none` desliga todos os efeitos de evento do tema        | `on-event`                                                      |

## Os temas

As cores abaixo são **propostas iniciais** e serão ajustadas no Playground com o teste de contraste. As fontes extras só entram se a fase de tipografia aprovar (ver [arcane-title](../catalog/typography/arcane-title.md)); até lá, todos usam Cinzel.

### 0. `legacy`: RPG World Classic

- **Cores:** as atuais (`--brand` #663399, a cor do personagem, a cor da magia).
- **Fundo:** a atmosfera do `body` mais os 6 fundos do `SpellVFX`.
- **Borda:** a borda de 1px atual, que no hover vira `border-spell-muted`.
- **Ornamentos:** a faixa lateral da cor e o ícone gigante no card aberto.
- **Tipografia:** Cinzel em `display`/`title`, Inter no resto.
- **Efeitos:** os de hoje.
- **Componentes:** nenhum ligado. Serve de referência visual nos testes de screenshot.

### 1. `arcane-scholar`: o estudioso arcano

- **Cores:** ornamento em ouro velho (#c9a227 no escuro, #8a6d12 no claro); o destaque continua sendo a cor do personagem.
- **Fundo:** `astral-dust` `arcane-gradient` no card aberto; `static-stars` no fundo de página (segunda leva).
- **Borda:** `runic-border` `static` (anel com máscara e runas da Noto Sans Runic), `hover-glow` no hover e no foco, `active` na magia preparada.
- **Ornamentos:** `arcane-corners` `runic`, `rune-divider` `geometric` (runas reais), `sigil-watermark` `arcane` no card aberto.
- **Tipografia:** `arcane-title` `scholarly` (Cinzel).
- **Efeitos:** `sigil-pulse` `expanding-ring` ao preparar.
- **Combinação:** `runic-border` + `arcane-corners` + `rune-divider` + `sigil-watermark` (**o primeiro grupo do Playground inteiro**) + `prepared-seal` `glowing-glyph`.
- **Por que começar por ele:** só usa F1 e F2 e funciona sem arte nova (runas em fonte e placeholders). É o primeiro tema a ser implementado.

### 2. `ancient-manuscript`: o manuscrito antigo

- **Cores:** tinta sépia; ornamento em vermelho rubrica (#9b2c2c no claro, #d26a5c no escuro).
- **Fundo:** `ancient-parchment` `manuscript`: pergaminho claro com pautas no tema claro, `dark` no escuro.
- **Borda:** `runic-border` `static`, sem runas e sem brilho.
- **Ornamentos:** `arcane-corners` `ornamental`, `rune-divider` `ornamental`.
- **Tipografia:** `arcane-title` `manuscript` (IM Fell English, que carrega só neste tema).
- **Efeitos:** nenhum brilho (`--grimoire-glow-strength: 0`). O hover só escurece a tinta (`enchanted-hover` `gradient-highlight`).
- **Combinação:** `ancient-parchment` + `arcane-corners` + `rune-divider` + `magic-bookmark` `ribbon` + `prepared-seal` `wax`.

### 3. `wildwood-codex`: o códice da floresta

- **Cores:** ornamento em verde musgo (#6b8e4e no escuro, #3f5e2a no claro), com um acento âmbar.
- **Fundo:** `ancient-parchment` `weathered` com um tom esverdeado.
- **Borda:** `runic-border` `static`, sem runas.
- **Ornamentos:** `arcane-corners` `ornamental`, `rune-divider` `botanical`, `sigil-watermark` `botanical`.
- **Tipografia:** `arcane-title` `scholarly`.
- **Efeitos:** `enchanted-hover` `surface-shimmer`, bem suave.
- **Combinação:** `ancient-parchment` + `runic-border` + `arcane-corners` + `rune-divider` + `sigil-watermark`.

### 4. `shadow-archive`: o arquivo das sombras

- **Cores:** ornamento em prata fria (#9aa3b5 no escuro, #4a5263 no claro); superfície mais escura que o `--card`.
- **Fundo:** liso, com vinheta radial na página.
- **Borda:** `runic-border` `static` discreto; as runas aparecem no `hover-glow`.
- **Ornamentos:** `arcane-corners` `geometric`, `sigil-watermark` `alchemical`.
- **Tipografia:** `arcane-title` `runic` (Uncial Antiqua + runas da Noto Sans Runic).
- **Efeitos:** `sigil-pulse` `rune-flash`.
- **Combinação:** `runic-border` + `arcane-corners` + `sigil-watermark` + `prepared-seal` `minimal`.
- **Cuidado:** a superfície mais escura precisa manter o `--muted-foreground` em 7:1, e o teste de contraste confere isso.

### 5. `celestial-codex`: o códice celeste

- **Cores:** ornamento em azul-estrela (#9cc2ff no escuro, #2d4f8a no claro) e prata.
- **Fundo:** `astral-dust` `static-stars` na página e `arcane-gradient` no card aberto. O `ambient-glow` é opcional, **só no fundo de página** (F3) e sem `prefers-reduced-motion`.
- **Borda:** `runic-border` `static`; `active` com brilho na magia preparada.
- **Ornamentos:** `arcane-corners` `geometric`, `rune-divider` `minimal`, `sigil-watermark` `celestial` e `school-emblem` com `frame="ring"`.
- **Tipografia:** `arcane-title` `celestial` (Cinzel Decorative, que carrega só neste tema).
- **Efeitos:** brilho moderado.
- **Combinação:** `astral-dust` + `runic-border` + `arcane-corners` + `rune-divider` + `sigil-watermark`.

### 6. `elemental-archive`: o arquivo elemental

- **Cores:** o ornamento acompanha a **cor do elemento da magia** dentro do card (`--grimoire-ornament: var(--spell-color)`) e usa o metal neutro (bronze #b08d57) fora dele.
- **Fundo:** os fundos atuais do `SpellVFX` (que já variam por dano ou escola) mais o `astral-dust` `cosmic-dust` na página.
- **Borda:** `runic-border` `static` na cor do elemento, `ritual` uma vez ao abrir o card.
- **Ornamentos:** `school-emblem` com `frame="medallion"` no card aberto, `rune-divider` `minimal`.
- **Tipografia:** `arcane-title` `scholarly`.
- **Efeitos:** `sigil-pulse` `single-pulse` na cor do elemento, ao lançar ou preparar.
- **Combinação:** `school-emblem` + `runic-border` + `sigil-pulse` + o `SpellVFX` atual.
- **Observação:** é o tema mais perto do spellbook atual; quase só liga peças que já existem.

## Ordem sugerida

1. `legacy` (já existe, só formalizar os tokens com valor neutro).
2. `arcane-scholar`: usa o primeiro grupo inteiro do Playground, só em F1 e F2, e valida a estrutura de temas.
3. `elemental-archive`: reaproveita o `SpellVFX`.
4. Os demais, conforme a arte da dona chegar (cantos, divisórias, sigilos) e as fontes extras forem medidas.

## Questões em aberto

- Os 6 temas ficam todos, ou alguns fogem da "fantasia sóbria"? (`ancient-manuscript` no claro muda bastante a cara do app.)
- O tema vale só para a ficha e o spellbook do personagem, ou também para a página da mesa quando a ficha aparece lá? A sugestão é **sim**, porque é "visto por todos".
- Uma fonte nova por tema (IM Fell English, Cinzel Decorative, Uncial Antiqua, Noto Sans Runic) vale o custo de carregamento? A sugestão é carregar só a fonte do tema ativo. Como o `next/font` não carrega sob demanda por atributo, isso fica para medir no `/dev/grimoire`.
