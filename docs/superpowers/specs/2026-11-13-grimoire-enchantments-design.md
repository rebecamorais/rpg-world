# Grimoire Enchantments: catálogo de encantamentos visuais

**Issue:** [#194](https://github.com/rebecamorais/rpg-world/issues/194) (épico); fase 1 em [#195](https://github.com/rebecamorais/rpg-world/issues/195).

Fase 1: pesquisa e especificação. Nada é implementado nesta fase. O catálogo inteiro está em [`docs/grimoire-enchantments/`](../../grimoire-enchantments/README.md).

Legenda: **(dona)** foi decidido por ela. **(decisão do builder)** é escolha técnica ou de detalhe que não muda o que ela pediu.

## Por quê

O RPG World já tem uma linguagem visual própria, que chamamos de "fantasia sóbria": tokens com contraste AA garantido, Cinzel nos títulos, a cor de cada magia nos detalhes e fundos discretos só no card aberto. O próximo passo é fazer as superfícies parecerem um **objeto encantado**, com bordas, ornamentos, texturas e pequenos efeitos de interação, sem perder legibilidade nem desempenho em listas longas.

Sucesso é ter uma coleção de peças pequenas e combináveis que funcionem em qualquer sistema de RPG. Os temas de ficha sairiam da composição dessas peças, sem duplicar componentes, e o visual de hoje continuaria disponível como o tema `legacy`.

## Decisões

1. **(dona)** A coleção se chama Grimoire Enchantments e tem 12 componentes iniciais em 6 categorias.
2. **(dona)** Os componentes visuais não conhecem regras de nenhum sistema. Recebem identificadores ("emblema", "estado selecionado"), e o mapeamento para D&D 5e fica fora deles.
3. ~~**(dona)** Os SVGs (cantos, lacres, sigilos, divisórias, marcadores) seriam código vetorial gerado pelo Claude Code.~~ **Arquivado em 14/11 (dona):** os assets SVG próprios saíram do plano por enquanto (ver a decisão 18).
   - **Sem SVG** para o que o CSS ou a fonte já resolvem: a faixa vertical da borda é o CSS girando a horizontal, e as manchas do pergaminho são gradientes.
4. **(dona, spec do tema claro)** Temas de ficha são escolhidos pelo dono do personagem e vistos por todos. O Grimoire fornece a estrutura desses temas.
5. **(dona)** Os docs são escritos em português, e tudo o que é código fica em inglês: IDs, componentes, props, tokens, classes, `data-*`, nomes de arquivo e comentários (`runic-border` / `RunicBorder`).
6. **(dona)** O Playground vai para uma rota interna `/dev/grimoire`, fora da produção.
7. **(dona)** A issue é um épico no Project 1, construído aos poucos: cada fase ganha sua sub-issue só quando começa.
8. **(decisão do builder)** A técnica padrão é CSS + SVG estático. Animação só acontece por evento (hover, foco, ativação) e nunca em loop em card repetido. Canvas, WebGL e `backdrop-filter` estão fora dos cards.
9. **(decisão do builder)** Os temas são por configuração: um atributo `data-grimoire="<tema>"` redefine tokens, como o `.character-context` já faz com `--character-color`. Os componentes nunca são duplicados por tema.
10. **(decisão do builder)** Os assets SVG entram como `mask-image` (a cor vem do token, via `background-color`) ou no sprite que o `npm run icons` gera. Nenhum asset leva cor fixa.
11. **(decisão do builder)** Nenhuma dependência nova nesta coleção. Framer-motion, tsparticles e GSAP ficam como referência visual apenas.

### Revisão de 13/11 (pesquisa com o MCP do 21st)

12. **(dona)** A pesquisa usa o MCP do 21st para ler o código real dos candidatos antes de qualquer proposta. Nada é instalado a partir dele. O resultado é uma biblioteca de referências permanente: [research/component-references.md](../../grimoire-enchantments/research/component-references.md).
13. **(dona)** As variantes de cada componente seguem a lista do prompt da #195, com os valores em inglês. Exemplo: o RunicBorder tem `static | hover-glow | active | ritual`.
14. **(dona)** Pastas e nomes de arquivo do catálogo ficam em inglês (`research/`, `catalog/`, `themes/`); o texto continua em português.
15. **(dona)** As runas vêm de duas fontes:
    - **agora:** as reais da Noto Sans Runic (OFL, cobre o bloco Unicode Runic inteiro), sempre decorativas;
    - **depois:** as inventadas da arte dela, como alternativa.
16. **(dona)** O primeiro grupo do Playground é `runic-border`, `arcane-corners`, `sigil-watermark` e `rune-divider`. O `astral-dust` vai para a segunda leva, porque só cabe no card aberto e no fundo de página ([playground-roadmap.md](../../grimoire-enchantments/playground-roadmap.md)).
17. **(decisão do builder)** Código de terceiros só entra quando a licença foi **verificada** como compatível: Magic UI e forever (MIT), e os 3 itens do 21st que declaram MIT no próprio código. Aceternity (licença própria, que proíbe redistribuir o código-fonte), SVGBackgrounds (proíbe redistribuir) e os itens do 21st sem licença declarada servem só de inspiração.

### Revisão de 14/11

18. **(dona)** A ideia dos SVGs próprios está **arquivada**. O foco volta para bordas e fundos inspirados nos favoritos dela no 21st.dev (lista "RPGWorld"), sempre feitos com CSS, gradientes, máscaras e a fonte de runas. As seções "Assets" das specs ficam como referência futura, mas não fazem parte do plano atual. O contrato visual e as specs de produção dos SVGs estão guardados fora do repositório, caso a ideia volte. Sem arte, o primeiro grupo fica assim:
    - `arcane-corners`: colchetes de canto em CSS, como na REF-15;
    - `sigil-watermark`: usa o ícone da escola em tamanho grande, como o `SpellVFX` já faz;
    - `runic-border` e `rune-divider`: não mudam, porque já funcionavam com CSS e a fonte de runas.

19. **(dona)** Fontes: a **Cinzel** continua a padrão. As alternativas são **Marcellus**, **IM Fell English** e **Almendra**. Cada uma entra como no máximo uma fonte extra por tema, só no nome da magia e nos títulos:
    - Marcellus no `celestial-codex`;
    - IM Fell English no `ancient-manuscript`;
    - Almendra no `wildwood-codex`.

    Cinzel Decorative, Uncial Antiqua, Cormorant Garamond e as fontes góticas ficam de fora, e a variante `runic` do título usa Cinzel com runas da Noto Sans Runic.

20. **(dona, 14/11)** O card aberto ganha um efeito especial **sem custo de desempenho**:
    - uma base parada (Borda arcana + Aura ou Brasa);
    - efeitos de borda que só rodam no hover ou uma vez ao abrir, sempre presos ao anel da borda.

    A "Revelação", com o sigilo girando e o brilho no nome, foi rejeitada. Shaders (WebGL) e o Motion (#156) ficam fora por enquanto. Os efeitos aprovados estão em [explorations/open-card-effects.md](../../grimoire-enchantments/explorations/open-card-effects.md). Ainda não vão para o spellbook, porque a exploração continua.

### Revisão de 15/11 (efeitos por tipo e biblioteca)

21. **(dona)** **Cor:** todo efeito usa a **cor da magia** (`--spell-color`), a mesma do card, da faixa e dos selos. Uma cor própria só existe como reserva, fora de uma magia. A cor de cada magia continua vindo de `useSpellDisplay` (dano, senão escola).
22. **(dona)** **Efeitos por tipo de magia:** o efeito do card aberto segue a mesma regra da cor (o tipo de dano, senão a escola). Ele combina:
    - uma superfície tingida;
    - ícones do tipo (um grande e apagado, alguns pequenos);
    - um brilho em posição própria;
    - uma ondulação por evento com formato próprio.

    Está em [explorations/spell-type-effects.md](../../grimoire-enchantments/explorations/spell-type-effects.md).

23. **(dona)** **Sem materiais:** as superfícies de material (vidro, ácido, pedra, pergaminho) foram removidas do código e das docs em 15/11. Os desenhos SVG da dona, que cobrem o card aberto, ficaram melhores, e os materiais não voltam.
24. **(dona)** **Biblioteca:**
    - O Grimório é uma biblioteca de estilos e componentes de card.
    - Ele cresce numa **branch de longa duração**, `feat/grimoire-material-surfaces`, com **um PR só** (#219), que fica em rascunho e reúne docs, assets, componentes e o laboratório `/dev/grimoire`.
    - O PR do catálogo (#198) foi fechado sem merge: os commits dele estão nessa branch.
    - Nada chega ao spellbook antes de uma decisão explícita.

25. **(dona)** **Reuso fora das magias e em outros sistemas:** os efeitos servem a qualquer card (magia, item da mochila, ficha) e a qualquer sistema de jogo.
    - **Cor:** o efeito lê `--grimoire-tint`, e quem define é o card que o recebe: `var(--spell-color)` na magia, `var(--item-color)` no item, `var(--character-color)` na ficha. A regra da decisão 21 continua: o efeito usa sempre a cor do card.
    - **Sem regra de jogo na biblioteca:** qual efeito cada conteúdo usa fica fora dela, num mapa por sistema. O de D&D 5e está em `src/frontend/constants/grimoire-effects.ts` (o dano, senão a escola). Outro sistema ganha o seu mapa, e a biblioteca não muda.
    - O mapa é um exemplo, usado só no laboratório. Nada chega ao spellbook antes de uma decisão explícita.

26. **(dona)** **Efeitos do card aberto no laboratório:** os efeitos por tipo aprovados na amostra viraram a peça `<EffectLayers>` (`src/frontend/components/grimoire/card-effect/`): ids neutros (`frost`, `embers`, `ward-mesh`...), cor por `--grimoire-tint` e o mapa de D&D 5e fora da biblioteca (`src/frontend/constants/grimoire-effects.ts`). O `SpellCard` ganhou a prop opcional `effect`, que troca o fundo do card aberto. O laboratório virou uma página só, `/dev/grimoire`. Medição e detalhes em [explorations/spell-type-effects.md](../../grimoire-enchantments/explorations/spell-type-effects.md). **Ainda não estão no spellbook.**

## Fora do escopo

- Implementar componentes, instalar pacotes, alterar a UI atual ou o banco de dados.
- O Playground. Ele é a fase seguinte, descrita em [playground-roadmap.md](../../grimoire-enchantments/playground-roadmap.md).
- O seletor de tema na página "Aparência da ficha", que fica para depois do Playground.
- Um modo de alto contraste do app. O Grimoire só garante que os enfeites somem em `forced-colors`.

## Perguntas em aberto

- Os 6 temas cabem na "fantasia sóbria"? A proposta é especificar os 6 e implementar `legacy` + 1 primeiro ([themes/theme-presets.md](../../grimoire-enchantments/themes/theme-presets.md)).
- Quanto o grão do `body` pode crescer antes de pesar no celular? O plano de benchmark mede isso ([research/performance-guidelines.md](../../grimoire-enchantments/research/performance-guidelines.md)).
