# SigilPulse (`sigil-pulse`)

Categoria: Interações · Status: proposto (fora do primeiro grupo do Playground) · Faixas: `F4` · Custo: Baixo

## 1. Identidade

- **Propósito:** um efeito curto de "magia ativada" que confirma uma ação: preparar, conjurar, gastar espaço de magia, rolar um dado, aplicar uma condição.
- **Descrição:** um pulso, um anel ou uma runa que aparece e some em 150 a 600 ms, **uma única vez**, a partir de um ponto (ícone, botão, selo).
- **Usos:** preparar uma magia, gastar um espaço, equipar um item, salvar a ficha, virar o turno no combate.

**Verificado no repositório:**

- `app/globals.css` tem o keyframe `turn-glow` (`animate-turn-glow`), que roda em **loop infinito** (2,4 s) para marcar de quem é a vez.
- A regra global de `prefers-reduced-motion` força qualquer animação a 1 iteração de 0,01 ms.

**O precedente do `turn-glow`:** o SigilPulse **não** segue esse precedente. O `turn-glow` comunica um estado persistente (de quem é a vez) e tem uma instância só, então o loop é aceitável. Um pulso confirma uma **ação** e roda uma vez, por evento. Nada aqui deve ser copiado do `turn-glow` para cards repetidos. A questão aberta (seção 10) propõe o caminho inverso: o `turn-glow` passaria a ser um pulso único.

## 2. Visual

**Direção:** confirmação breve e contida, que respeita quem está lendo. Nenhuma variante se repete sem um novo evento.

| Variante                | Aparência                                                                                      | Cor                              | Uso sugerido                            | Interação                   | Fallback estático                          |
| ----------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------- | --------------------------- | ------------------------------------------ |
| `single-pulse` (padrão) | Um halo que cresce e apaga em volta do elemento (`box-shadow` de 0 → 8 px → 0, mais `opacity`) | `*-glow`                         | Preparar, salvar, gasto de recurso      | Por evento, 1 vez, ≤ 400 ms | Nenhum: o estado final já está no controle |
| `expanding-ring`        | 1 ou 2 anéis finos crescem de 0,6× a 1,6× e somem, com atraso de 0 e 0,12 s                    | Traço `*-flare`                  | Conjurar, equipar, virar o turno        | Por evento, 1 vez, ≤ 600 ms | Nenhum                                     |
| `rune-flash`            | Uma runa (ou o sigilo de ativação) acende no centro e apaga, com escala de 1,15 a 1            | Runa `*-flare` sobre `*-surface` | Card ativado (magia conjurada), rolagem | Por evento, 1 vez, ≤ 450 ms | Nenhum                                     |

**Runas, as duas fontes:** agora, um glifo real da Noto Sans Runic (REF-84), escolhido por `rune` ou derivado do id do item. Depois, o `sigil-pulse/activation-sigil.svg` da dona (runas inventadas).

**Temas:** o preset escolhe a variante padrão. O `--grimoire-motion: none` desliga todos os pulsos do tema. O `legacy` não tem pulso.

## 3. Proposta técnica

**CSS + um hook React mínimo, sem `setState`.**

- **Animação:** `@keyframes` só com `transform` e `opacity`; o `single-pulse` anima `box-shadow` numa área pequena. O elemento é `absolute`, centrado no hospedeiro, com `pointer-events: none` e `aria-hidden`, e fora do fluxo. Não há layout shift.
- **`expanding-ring`:** é a versão CSS da REF-50. Lá o `AnimatePresence` anima `width`/`height`, o que causa layout; aqui usamos `transform: scale`. É o anel da REF-102 ou REF-55, executado uma vez. O segundo anel é um `::after` com `animation-delay: 120ms`.
- **`rune-flash`:**
  - um `span` com o glifo em `font-family: 'Noto Sans Runic'`, com texto alternativo vazio (`content: 'ᛟ' / ''` num pseudo-elemento) ou `aria-hidden`;
  - ou o asset `activation-sigil.svg` em `mask-image`.
- **Disparo (padrão `data-active`/`data-fading`, REF-35):**
  - `pulse()` grava `data-pulse` no nó pelo `ref`;
  - o CSS só anima em `[data-pulse]`;
  - o `animationend` remove o atributo.

  Para disparar de novo no meio: remove o atributo, força reflow (`void el.offsetWidth`) e grava de novo. Não usa rAF, loop nem biblioteca.

- **Alternativa WAAPI para o `rune-flash`:** uma chamada `el.animate(keyframes, { duration: 450, iterations: 1 })`, sem listener (REF-104).
- Fora do `[data-pulse]`, o nó fica com `visibility: hidden` e não cria camada.

```tsx
type SigilPulseVariant = 'single-pulse' | 'expanding-ring' | 'rune-flash';

interface SigilPulseProps {
  variant?: SigilPulseVariant; // default: the theme's, else 'single-pulse'
  tone?: 'spell' | 'character' | 'primary' | 'success' | 'danger';
  rune?: string; // one Runic code point for 'rune-flash' (e.g. 'ᛟ'); falls back to the sigil asset
  className?: string;
}

// Returns a ref and the trigger; never re-renders the host.
function useSigilPulse(): {
  ref: React.RefObject<HTMLSpanElement>;
  pulse: () => void;
};

const { ref, pulse } = useSigilPulse();
<button
  className="relative ..."
  onClick={() => {
    onToggle();
    pulse();
  }}
>
  <SigilPulse ref={ref} variant="expanding-ring" tone="spell" />
  ...
</button>;
```

Também funciona sem o hook: quem já tem o estado (o `PreparedSeal` com `animateOnChange`) controla o `data-pulse` direto.

- **Estilos:** `@keyframes grimoire-pulse | grimoire-ring | grimoire-rune-flash` em `app/globals.css` (ou `grimoire.css`), só com tokens.
- **Dependências:** nenhuma.
- **Pontos de integração:**
  - `src/frontend/components/character/spells/spell-card/parts/SpellQuickAction.tsx` (`PrepareSpellAction`, `LearnSpellAction`);
  - `src/frontend/components/character/magic-system/SpellSlots.tsx` (gasto de espaço);
  - `src/frontend/components/character/magic-system/SpellPoints.tsx`;
  - a barra de turno do combate (questão aberta).

## 4. Personalização

- **Tokens:** `--pulse-color` (padrão do `tone`), `--pulse-duration` (400, 600 e 450 ms por variante), `--pulse-scale` (padrão 1,6) e `--grimoire-motion` (`none` desliga).
- **Props:** `variant`, `tone`, `rune`.

## 5. Desempenho

| Aspecto            | Avaliação                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DOM                | 1 `span` por gatilho (+1 pseudo-elemento no anel duplo), oculto quando parado                                                                                      |
| Pintura            | Camada própria só durante a animação. O `single-pulse` repinta uma área pequena por ≤ 400 ms                                                                       |
| Animação           | ≤ 600 ms, 1 iteração, `transform`/`opacity` (compositor). Nunca em loop                                                                                            |
| SVG                | O `rune-flash` com asset usa 1 máscara, cacheada. Com fonte, usa 1 glifo                                                                                           |
| Memória            | Nada fica ativo depois do `animationend`                                                                                                                           |
| Várias instâncias  | Cabe em todo card (parado, não custa nada), mas só os poucos acionados animam (`F4`)                                                                               |
| Celular            | Barato; nenhum `filter: blur`                                                                                                                                      |
| Movimento reduzido | A regra global encurta a animação para 0,01 ms e mantém o **estado final estático**. O pulso some, e a confirmação fica no controle (`aria-pressed`, ícone, toast) |

**Benchmark no `/dev/grimoire`:**

- disparar 10 pulsos seguidos em 10 cards, sem frames acima de 50 ms e com CLS 0;
- o painel Layers deve ter o mesmo número de camadas antes e depois.

## 6. Acessibilidade

- `aria-hidden="true"`. O pulso só reforça o visual; o resultado da ação é anunciado pelo controle (`aria-pressed`, rótulo) ou por um toast (o `sonner` já existe).
- Nada pisca mais de 3 vezes por segundo (WCAG 2.3.1): é um pulso único.
- Não muda o foco e tem `pointer-events: none`, então nunca bloqueia o clique seguinte.
- A runa do `rune-flash` nunca entra no nome acessível (texto alternativo vazio ou `aria-hidden`).
- `forced-colors`: o pulso some (`display: none`).
- O contraste não se aplica: o efeito é passageiro e decorativo.

## 7. Compatibilidade

| Superfície            | Suporte                          | Nota                         |
| --------------------- | -------------------------------- | ---------------------------- |
| `spell-card-compact`  | `single-pulse`, `expanding-ring` | No `PrepareSpellAction`      |
| `spell-card-expanded` | todas                            | `rune-flash` ao conjurar     |
| `spellbook-page`      | `single-pulse`                   | Contador de espaços de magia |
| `character-sheet`     | `single-pulse`, `expanding-ring` | Ajustar PV, gastar recurso   |
| `inventory-card`      | `expanding-ring`, `rune-flash`   | Equipar/sintonizar           |
| `campaign`            | `expanding-ring`                 | Virar o turno                |

## 8. Assets

Os prompts de geração ficam fora do repositório.

- `sigil-pulse/activation-sigil.svg`: sigilo genérico de ativação (círculo com runas inventadas em volta), para o `rune-flash` quando não há glifo de fonte ou quando o tema pede a arte.

O `single-pulse` e o `expanding-ring` são desenhados só em CSS (`box-shadow`, `border` + `border-radius`).

## 9. Referências

| Ref     | Nome                                                                                                                                  | Fonte           | Tecnologia                                                   | Licença · código                        | Relevância e adaptação                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| REF-56  | [Pulsating Button](https://magicui.design/docs/components/pulsating-button)                                                           | Magic UI        | keyframe de `box-shadow` com `oklch(from …)`                 | MIT · **código reutilizável** com aviso | `single-pulse` **uma vez**, em `--spell-color` (o app já usa `oklch(from …)`)                |
| REF-14  | [Neon Glow Pulse](https://github.com/isas1/forever-ai-components/blob/main/infinite/buttons/05-neon-glow-pulse.html)                  | forever · isas1 | pulso de `box-shadow` em CSS                                 | MIT · **código reutilizável** com aviso | Mesmo pulso, alternativa                                                                     |
| REF-102 | [Concentric Pulse](https://github.com/isas1/forever-ai-components/blob/main/infinite/loaders/07-concentric-pulse.html)                | forever · isas1 | anéis para fora, só CSS                                      | MIT · **código reutilizável** com aviso | `expanding-ring` com 1 ou 2 anéis, uma vez                                                   |
| REF-55  | [Ripple](https://magicui.design/docs/components/ripple)                                                                               | Magic UI        | anéis com `scale` e atraso de `--i * .2s`                    | MIT · **código reutilizável** com aviso | Escalonamento dos anéis, sem o loop                                                          |
| REF-50  | [Ripple Buttons](https://21st.dev/@ai2/components/buttons-ripple)                                                                     | 21st · ai2      | AnimatePresence animando `width`/`height`; Sonar com 3 anéis | não declarada · **só inspiração**       | Ideia do Echo e do Sonar, refeita em CSS com `transform: scale` e removida no `animationend` |
| REF-84  | [Noto Sans Runic](https://fonts.google.com/noto/specimen/Noto+Sans+Runic)                                                             | Google Fonts    | fonte (89/89 runas Unicode)                                  | OFL-1.1 · **pode usar**                 | Glifo do `rune-flash`                                                                        |
| REF-104 | [Notification Bell](https://github.com/isas1/forever-ai-components/blob/main/infinite/ui-microinteractions/03-notification-bell.html) | forever · isas1 | SVG + onda via WAAPI                                         | MIT · **código reutilizável** com aviso | `rune-flash` com uma chamada WAAPI                                                           |
| REF-35  | [Animated Border Beam](https://21st.dev/@hyperiux/components/border-beam)                                                             | 21st · hyperiux | padrão `data-active`/`data-fading`                           | não declarada · **só inspiração**       | Só o padrão de disparo e saída                                                               |
| REF-22  | [Glow Effect](https://21st.dev/@ibelick/components/glow-effect)                                                                       | 21st · ibelick  | brilho com blur, contínuo                                    | não declarada · **só inspiração**       | Descartado (blur e loop). Não verificado pelo código                                         |

## 10. Questões em aberto

- O `turn-glow` em loop deveria virar um `expanding-ring` único na troca de turno, mais uma borda estática? Ganha desempenho e conforto, mas muda um comportamento existente fora desta coleção.
- No movimento reduzido, basta o estado final estático, ou fica uma mudança de opacidade sem escala (aceita pela WCAG 2.3.3)? Manter a opacidade exigiria uma exceção explícita à regra global.
- A runa do `rune-flash` deve ser derivada do id do item (a mesma runa sempre) ou fixa por tema?
