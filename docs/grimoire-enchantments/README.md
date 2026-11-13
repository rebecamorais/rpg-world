# Grimoire Enchantments

Catálogo de encantamentos visuais do RPG World: bordas, fundos, ornamentos, tipografia, acessórios e interações que fazem a interface parecer um objeto encantado. As decisões estão na [spec-mãe](../superpowers/specs/2026-11-13-grimoire-enchantments-design.md).

- **Épico:** [#194](https://github.com/rebecamorais/rpg-world/issues/194)
- **Fase atual:** 1, pesquisa e especificação ([#195](https://github.com/rebecamorais/rpg-world/issues/195)). Nada daqui existe no código ainda.

## Como ler

| Arquivo                                                                  | O que tem                                                                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [research/repository-audit.md](research/repository-audit.md)             | O que o app já tem (tokens, fundos de magia, ícones, fontes), com os caminhos no repositório                                                                             |
| [research/component-references.md](research/component-references.md)     | **Biblioteca de referências** `REF-NN`: URL, autor, licença, técnica lida no código, notas e o que pode virar código no repositório. Consulte antes de pesquisar de novo |
| [research/performance-guidelines.md](research/performance-guidelines.md) | Faixas de uso, técnicas permitidas e proibidas, orçamento e benchmark                                                                                                    |
| [catalog/](catalog/)                                                     | Uma spec por componente, organizadas por categoria                                                                                                                       |
| [themes/theme-presets.md](themes/theme-presets.md)                       | `legacy` (RPG World Classic) + 6 temas montados com os componentes                                                                                                       |
| [component-registry.json](component-registry.json)                       | Metadados dos 12 componentes, para filtrar                                                                                                                               |
| [playground-roadmap.md](playground-roadmap.md)                           | Pontuação, primeiro grupo e plano da fase 2 (`/dev/grimoire`)                                                                                                            |

## Componentes

| ID                  | Componente       | Categoria  | Variantes                                                        | Spec                                                                                 |
| ------------------- | ---------------- | ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `runic-border`      | RunicBorder      | Bordas     | `static`, `hover-glow`, `active`, `ritual`                       | [catalog/borders/runic-border.md](catalog/borders/runic-border.md)                   |
| `arcane-corners`    | ArcaneCorners    | Bordas     | `geometric`, `runic`, `ornamental`, `filigree`                   | [catalog/borders/arcane-corners.md](catalog/borders/arcane-corners.md)               |
| `astral-dust`       | AstralDust       | Fundos     | `static-stars`, `arcane-gradient`, `cosmic-dust`, `ambient-glow` | [catalog/backgrounds/astral-dust.md](catalog/backgrounds/astral-dust.md)             |
| `ancient-parchment` | AncientParchment | Fundos     | `light`, `dark`, `weathered`, `manuscript`                       | [catalog/backgrounds/ancient-parchment.md](catalog/backgrounds/ancient-parchment.md) |
| `sigil-watermark`   | SigilWatermark   | Ornamentos | `arcane`, `celestial`, `alchemical`, `botanical`                 | [catalog/ornaments/sigil-watermark.md](catalog/ornaments/sigil-watermark.md)         |
| `school-emblem`     | SchoolEmblem     | Ornamentos | molduras `tile`, `ring`, `shield`, `medallion`                   | [catalog/ornaments/school-emblem.md](catalog/ornaments/school-emblem.md)             |
| `rune-divider`      | RuneDivider      | Ornamentos | `minimal`, `geometric`, `ornamental`, `botanical`                | [catalog/ornaments/rune-divider.md](catalog/ornaments/rune-divider.md)               |
| `arcane-title`      | ArcaneTitle      | Tipografia | `scholarly`, `manuscript`, `celestial`, `runic`                  | [catalog/typography/arcane-title.md](catalog/typography/arcane-title.md)             |
| `magic-bookmark`    | MagicBookmark    | Acessórios | `ribbon`, `arcane-tab`, `metallic`                               | [catalog/accessories/magic-bookmark.md](catalog/accessories/magic-bookmark.md)       |
| `prepared-seal`     | PreparedSeal     | Acessórios | `wax`, `arcane-stamp`, `glowing-glyph`, `minimal`                | [catalog/accessories/prepared-seal.md](catalog/accessories/prepared-seal.md)         |
| `enchanted-hover`   | EnchantedHover   | Interações | `border-glow`, `surface-shimmer`, `gradient-highlight`           | [catalog/interactions/enchanted-hover.md](catalog/interactions/enchanted-hover.md)   |
| `sigil-pulse`       | SigilPulse       | Interações | `single-pulse`, `expanding-ring`, `rune-flash`                   | [catalog/interactions/sigil-pulse.md](catalog/interactions/sigil-pulse.md)           |

## Convenções

- **Idioma:** o texto dos docs é em português. Tudo o que é código fica em inglês: IDs, componentes, props, valores, tokens, classes, `data-*`, nomes de arquivo e de pasta, e comentários.
- **IDs:** estáveis e em kebab-case. São os mesmos na spec, no registro, nos temas e nos assets (`arcane-corners/geometric.svg`). Os tokens de tema usam o prefixo `--grimoire-*`.
- **Faixas de uso** (detalhe em [research/performance-guidelines.md](research/performance-guidelines.md)):

  | Faixa | Onde pode                                     |
  | ----- | --------------------------------------------- |
  | `F1`  | Card repetido (dezenas na tela)               |
  | `F2`  | Card aberto, diálogo (1 a 3 por vez)          |
  | `F3`  | Fundo de página (uma instância)               |
  | `F4`  | Interação ocasional (um evento, efeito único) |

- **Custo:** Muito baixo, Baixo, Moderado ou Alto. São estimativas de engenharia; o benchmark do Playground confirma.
- **Cores:** só tokens (`--spell-*`, `--character-*`, `--primary-*`, `--grimoire-*`). O `design-tokens.unit.test.ts` barra a paleta crua.
- **Runas:** as runas reais vêm da Noto Sans Runic (REF-84) e são sempre decorativas (`aria-hidden`). As runas inventadas da arte da dona entram depois, como alternativa.
- **Código de terceiros:** só se copia o que a biblioteca de referências marca como **Código: Sim** (MIT: Magic UI, forever, 3 itens do 21st), e o aviso vai para o `NOTICE.md`. Aceternity, SVGBackgrounds e itens sem licença declarada servem só de inspiração.
- **Pasta futura do código:** `src/frontend/components/grimoire/`, um arquivo por componente. O CSS compartilhado fica em `@utility`/`@layer components`.
- **Estrutura de cada spec:** as specs seguem 11 seções, nesta ordem:
  1. Identidade
  2. Variantes / design visual
  3. Técnica
  4. API proposta
  5. Personalização
  6. Desempenho
  7. Acessibilidade
  8. Compatibilidade
  9. Assets
  10. Referências
  11. Questões em aberto
- **Status das afirmações:** as specs marcam o que é **verificado** (lido no código ou na fonte), **proposta** (opinião de design) e **não verificado**.
