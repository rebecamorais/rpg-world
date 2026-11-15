# Exploração: efeitos por tipo de magia

Explorado em 14/11/2026 com a dona, numa amostra interativa: [Efeitos por Tipo de Magia](https://claude.ai/artifact/4J3ndMnmGiDi5KAm5F3x85). A amostra é privada; só a dona tem acesso. **Ainda não está no código nem no spellbook.**

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

## Próximos passos

- ~~Levar a lógica "dano, senão escola" para um mapa no código.~~ Feito para os materiais em `src/frontend/constants/grimoire-materials.ts`. Os efeitos seguem o mesmo formato quando forem para o código.
- Prototipar no laboratório (`/dev/grimoire/...`), como foi feito com os materiais, e medir com o benchmark (`scripts/grimoire-materials-bench.ts`).
- Decidir quais motivos viram material (superfície) e quais ficam como detalhe (ícone, ondulação).
