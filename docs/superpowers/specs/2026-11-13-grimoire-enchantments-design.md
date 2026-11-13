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
3. **(dona)** A arte SVG (cantos, lacres, sigilos, divisórias, marcadores) é gerada por ela fora do repositório, com o ChatGPT. Os prompts de geração ficam fora do repositório; as specs só listam os nomes e o motivo de cada asset.
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

## Fora do escopo

- Implementar componentes, instalar pacotes, alterar a UI atual ou o banco de dados.
- O Playground. Ele é a fase seguinte, descrita em [playground-roadmap.md](../../grimoire-enchantments/playground-roadmap.md).
- O seletor de tema na página "Aparência da ficha", que fica para depois do Playground.
- Um modo de alto contraste do app. O Grimoire só garante que os enfeites somem em `forced-colors`.

## Perguntas em aberto

- Os 6 temas cabem na "fantasia sóbria"? A proposta é especificar os 6 e implementar `legacy` + 1 primeiro ([themes/theme-presets.md](../../grimoire-enchantments/themes/theme-presets.md)).
- Quanto o grão do `body` pode crescer antes de pesar no celular? O plano de benchmark mede isso ([research/performance-guidelines.md](../../grimoire-enchantments/research/performance-guidelines.md)).
