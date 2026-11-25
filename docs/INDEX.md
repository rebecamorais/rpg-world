# Índice do projeto

Mapa do que o projeto já sabe e de onde está cada coisa. Leia antes de planejar ou mexer em código. Ele **aponta** para os docs, não os substitui: quando o índice e um doc discordarem, vale o doc mais recente, e o índice é corrigido no mesmo PR.

O teste `docs-index.unit.test.ts` falha se um link daqui apontar para um arquivo que não existe, ou se um plano ou spec novo não for listado aqui.

## Idioma de trabalho

- **Código, nomes e comentários:** inglês.
- **Docs, planos e specs:** português.
- **Commits:** Conventional Commits, assunto em português e inglês (`feat(x): ... / ...`), com o número da issue.
- **PR:** descrição em português, com `Closes #N`. A Rebeca faz o merge.
- **Textos do app:** nunca fixos no código; `messages/{en,pt,es,sv}.json` (es e sv vêm do Weblate, não edite à mão).

## Processo

- **O que fazer agora:** o [Project Roadmap](https://github.com/users/rebecamorais/projects/1) (Status e Priority). Os planos daqui não guardam prioridade.
- **Passo a passo de uma feature:** [roadmap.md](plans/2026-10-20-roadmap.md#processo-por-feature) (brainstorm → plano → branch → TDD → conferir no app → `/code-review` → PR).
- **Ambiente, comandos e testes:** [CONTRIBUTING.md](../CONTRIBUTING.md) e [ambiente-local.md](ambiente-local.md) (logins e mesa pronta).
- **Regras sempre ativas para agentes:** [MAP_AND_STRUCTURE.md](../.agents/rules/MAP_AND_STRUCTURE.md) (pastas e camadas), [RULES_REFERENCE.md](../.agents/rules/RULES_REFERENCE.md) (arquitetura, auth, i18n, testes) e [STYLES.md](../.agents/rules/STYLES.md) (estilo).
- **Suporte:** [modo manutenção](suporte/manutencao.md), [mesa sem mestre](suporte/mesa-sem-mestre.md).

## Como o app deve parecer

As regras de verdade estão nos docs da revisão de telas, não no CONTRIBUTING:

- [componentes-e-design-system.md](revisao-telas/componentes-e-design-system.md): cores, tipografia por papel (`text-label`, `text-caption`, `text-title`…), alinhamento.
- [acoes-destrutivas.md](revisao-telas/acoes-destrutivas.md): vermelho e confirmação.
- Tokens em `app/globals.css` (o escuro é o `:root`, o claro é `[data-theme='light']`), conferidos por `src/frontend/styles/design-tokens.unit.test.ts`. Tema claro: [spec](superpowers/specs/2026-11-10-tema-claro-e-contraste-design.md).
- Grimório (efeitos visuais das magias): [README](grimoire-enchantments/README.md), laboratório em `/dev/grimoire`.

**Desatualizado no CONTRIBUTING (§4):** "siga a escala `text-sm`/`text-xs`" e "glassmorphism". Vale a tipografia por papel e os painéis sólidos das revisões.

## Regras do jogo

- **Dados:** `content/dnd5e/srd-5.1/` (2014) e `content/dnd5e/srd-5.2/` (2024), importados por `scripts/content/`.
- **Cálculos:** `shared/systems/dnd5e/`.
- **Classe na ficha (2014):** [class-sheet-map.md](class-sheet-map.md) (o que cada classe muda) e [class-sheet-coverage.md](class-sheet-coverage.md) (cobertura e fases).
- **Como conferir uma regra:** ainda não há procedimento escrito. O que já foi usado: o PDF oficial do SRD 5.1 e os JSON de `content/`. Algumas tabelas (espaços de magia, Ataque Furtivo, Fúria) foram digitadas do PDF e não estão nos dados.

### Edição 2014 × 2024

Fatos do código hoje (`Edition = '2014' | '2024'`, em `shared/systems/dnd5e/content/editions.ts`):

- `srd-5.1` é 2014 e `srd-5.2` é 2024.
- **Ficha sem edição cai em 2014:** `editionSource()` devolve `srd-5.1`.
- **Spellbook sem maioria cai em 2024:** `inferEdition()` em `src/frontend/lib/spell-edition.ts` usa 2024 quando o spellbook está vazio ou empatado.
- **Classe na ficha é só 2014:** decisão 9 do [mapa de classes](class-sheet-map.md). Ficha sem edição ou em 2024 fica manual.
- **Magias existem nas duas edições:** [magias-por-edicao.md](plans/2026-10-21-magias-por-edicao.md).
- **D&D 2024 como sistema próprio:** só ideia ([plano](plans/2026-10-15-dnd-2024-novo-sistema.md)).

**Não escrito:** por que a ficha sem edição cai em 2014 e o spellbook vazio cai em 2024.

## Planos

Estado tirado do cabeçalho de cada plano e do histórico do git, em 2026-11-25.

**Em andamento ou com próximo passo:**

| Plano                                                                              | Estado                                                                                                                                 |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [criacao-com-classe.md](plans/2026-11-15-criacao-com-classe.md)                    | Fases 3.1 a 3.4 entregues (#239, #244, #243, #246). O cabeçalho ainda diz "nada foi implementado". Pontos em aberto no fim do arquivo. |
| [Grimório: do catálogo ao Playground](grimoire-enchantments/playground-roadmap.md) | Catálogo e biblioteca entregues (#195, #219, #249). Próximas fases no Project.                                                         |
| [conteudo-e-homebrew.md](plans/2026-10-15-conteudo-e-homebrew.md)                  | Passos 1 a 3 feitos para magias.                                                                                                       |
| [traducoes-comunitarias.md](plans/2026-10-15-traducoes-comunitarias.md)            | Base entregue (#101); traduções no Weblate.                                                                                            |
| [5etools-e-traducoes.md](plans/2026-10-15-5etools-e-traducoes.md)                  | Entregue para magias (#97).                                                                                                            |
| [configuracao-vida-e-magia.md](plans/2026-10-15-configuracao-vida-e-magia.md)      | C1 a C3 feitos.                                                                                                                        |
| [Revisão das telas](revisao-telas/README.md)                                       | Fases 1 a 4 com resultados e correções ([plano](revisao-telas/plano-por-tela.md)).                                                     |

**Só ideia ou planejamento, nada implementado:**

- [dnd-2024-novo-sistema.md](plans/2026-10-15-dnd-2024-novo-sistema.md)
- [feiticeiros-e-maldicoes.md](plans/2026-10-15-feiticeiros-e-maldicoes.md) (perguntas em aberto no fim)
- [sessoes-calendario-discord.md](plans/2026-10-15-sessoes-calendario-discord.md)

**Arquivado:** [limites-de-uso.md](plans/2026-10-15-limites-de-uso.md) (2026-10-21).

**Entregues** (o porquê das decisões continua valendo):

- [performance-modal-spells.md](plans/2026-10-14-performance-modal-spells.md) (#60)
- [revisao-frontend-ui-ux.md](plans/2026-10-14-revisao-frontend-ui-ux.md)
- [revisao-spellbook.md](plans/2026-10-14-revisao-spellbook.md)
- [compressao-de-imagens.md](plans/2026-10-15-compressao-de-imagens.md)
- [party-e-notas.md](plans/2026-10-15-party-e-notas.md)
- [paginas-publicas-estaticas.md](plans/2026-10-24-paginas-publicas-estaticas.md) (#118)
- [mesas-preparacao.md](plans/2026-10-28-mesas-preparacao.md) (#90)
- [mesas-fase-1-role-play.md](plans/2026-10-28-mesas-fase-1-role-play.md) (#124)
- [mesas-fase-2-combate.md](plans/2026-10-28-mesas-fase-2-combate.md) (#126)
- [condicoes-e-tags.md](plans/2026-11-01-condicoes-e-tags.md) (#134)
- [revisao-ux-mesas.md](plans/2026-11-01-revisao-ux-mesas.md) (#128)
- [itens-e-mochila.md](plans/2026-11-02-itens-e-mochila.md) (#138)
- [exclusao-de-conta.md](plans/2026-11-03-exclusao-de-conta.md) (#147)

**Processo:** [roadmap.md](plans/2026-10-20-roadmap.md).

## Specs (desenhos)

Cada uma tem a sua seção de decisões. **(dona)** é decisão da Rebeca; "decisão do builder" ou "do Claude" é escolha técnica que ela pode rever.

- [demo-the-pioneers](superpowers/specs/2026-11-04-demo-the-pioneers-design.md): demo pública `/demo`
- [imagem-completa](superpowers/specs/2026-11-06-imagem-completa-design.md), [imagem-zoom-e-reajuste](superpowers/specs/2026-11-06-imagem-zoom-e-reajuste-design.md): imagem do personagem
- [personalizacao-e-combate-decisoes](superpowers/specs/2026-11-06-personalizacao-e-combate-decisoes.md): decisões de personalização e combate
- [aparencia-da-ficha](superpowers/specs/2026-11-07-aparencia-da-ficha-design.md)
- [combate-identificacao-e-visibilidade](superpowers/specs/2026-11-07-combate-identificacao-e-visibilidade-design.md), [combate-simplificado](superpowers/specs/2026-11-09-combate-simplificado-design.md)
- [tema-claro-e-contraste](superpowers/specs/2026-11-10-tema-claro-e-contraste-design.md)
- [grimoire-enchantments](superpowers/specs/2026-11-13-grimoire-enchantments-design.md): 30 decisões numeradas (a 31 veio no #249)
- [mochila-visual](superpowers/specs/2026-11-13-mochila-visual-design.md)
- [recursos-de-classe](superpowers/specs/2026-11-14-recursos-de-classe-design.md) (#177)
- [traducoes-do-foundry-classes](superpowers/specs/2026-11-14-traducoes-do-foundry-classes-design.md)

## Decisões pendentes

Os números das decisões são locais de cada doc e se repetem entre docs. Aqui elas ganham um prefixo só para citar sem ambiguidade (`FICHA-4` é a decisão 4 do mapa de classes). O texto e a recomendação ficam no doc.

| ID         | Onde                                                                                                | O quê                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| FICHA-4    | [class-sheet-map.md](class-sheet-map.md#decisões)                                                   | O máximo dos espaços de magia segue a tabela sozinho?                                     |
| FICHA-5    | idem                                                                                                | Magia de Pacto: onde moram os espaços?                                                    |
| FICHA-6    | idem                                                                                                | Contagens no Grimório (truques, conhecidas, preparadas, fontes adicionais)                |
| FICHA-11   | idem                                                                                                | CD e ataque de magia: calcular ou continuar campo?                                        |
| FICHA-12   | idem                                                                                                | CA: preencher ou só dica?                                                                 |
| FICHA-13   | idem                                                                                                | Bônus que entram sozinhos em testes                                                       |
| FOUNDRY-C  | [traducoes-do-foundry-classes](superpowers/specs/2026-11-14-traducoes-do-foundry-classes-design.md) | "Decisões tomadas por mim (Claude) — conferir": sete escolhas esperando a sua conferência |
| CLASSE-3.x | [criacao-com-classe.md](plans/2026-11-15-criacao-com-classe.md)                                     | Pontos em aberto: ferramentas à escolha, idiomas de nível, perícia que deixa de valer     |

Aprovadas no mapa de classes: 1, 2, 3, 7, 8, 9 e 10 (2026-11-15).

## Lacunas conhecidas

- Não há procedimento escrito para conferir uma regra (qual fonte manda, onde no PDF).
- O porquê dos dois padrões de edição (seção acima) não está escrito.
- `src/frontend/components/ui/` não tem catálogo dos componentes.
- O CONTRIBUTING §4 contradiz as revisões de tela (seção "Como o app deve parecer").
