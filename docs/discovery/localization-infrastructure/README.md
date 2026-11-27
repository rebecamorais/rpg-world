# Descoberta: infraestrutura de tradução

**Data:** 2026-11-27. **Estado:** pesquisa concluída, nada implementado, nenhum recurso externo criado. Os PoCs 0, 1, 3 e as etapas A e A2 do PoC 2 foram executados ([resultados](research/poc-results.md)): o modelo cabe e rende no notebook; o Weblate sozinho e a ferramenta pronta testada não substituem um pipeline próprio; o pipeline entrega 99 a 100% das saídas válidas **na forma**. A recomendação continua **condicional** à correção em texto de regra, que só a avaliação humana mede (etapa B, redesenhada, ainda não executada). **Nenhum motor está aprovado para produção.**

## Resposta curta

**Não construir uma plataforma de tradução e não alugar servidor.** O problema de hoje é menor do que parecia: cerca de 88 mil palavras de português do SRD 5.2, com uma pessoa para revisar.

1. Completar o validador que o projeto já tem (ICU, dados, unidades, glossário).
2. Gerar o português que falta com um modelo aberto rodando no notebook, por um pipeline próprio pequeno (o código protege tags, números e unidades; o modelo cuida da língua).
3. Revisar numa tela local feita para isso, porque a revisão é o gargalo.
4. Só colocar na `main` o que uma pessoa aprovou. Hospedagem adicional: nenhuma.

## Os números que decidem

| | Valor | Tipo |
|---|---|---|
| Strings de fonte no produto | 5.727 | medido |
| Palavras de fonte | 160.246 | medido |
| Falta traduzir | pt 88 mil, es 43 mil, sv 160 mil palavras | medido |
| GPU para um idioma inteiro | 0,8 h com 4 fluxos, 1,7 h com 1 | **medido** numa amostra de 200 strings, projetado |
| Energia para tudo o que falta | menos de R$ 2 | estimativa |
| Saídas válidas na forma, 100 regras | Gemma 99, Qwen 100, os dois juntos 100 | **medido**, uma execução |
| Saídas certas como regra | — | **não medido** |
| Revisão humana do português | 88 a 220 horas | suposição (400 a 1.000 palavras/h) |
| Construir validador, pipeline e tela de revisão | 28 a 50 horas | estimativa |
| RAM mínima de um Weblate próprio | 3 GB, sempre ligado | verificado |
| Reserva paga, se um dia precisar | ~€ 6/mês | verificado |

O gargalo é a revisão, não a máquina nem o dinheiro.

## Decisões que esperam a Rebeca

1. **Rever "sem tradução automática, nem como rascunho"** ([traducoes-comunitarias.md](../../plans/2026-10-15-traducoes-comunitarias.md)). A proposta mantém "nada de máquina no app sem revisão".
2. ~~Unidades~~ **decidido em 27/11:** converter; milha × 1,5; libra × 0,5 ([tabela](proposals/unit-conversion.md)).
3. ~~Glossário, termos principais~~ **decidido em 27/11:** "nível" de magia, "salvaguarda", "Mestre", "rolar" ([registro](research/glossary-evidence.md)).
3a. **Sim ou não para construir a tela de revisão local e gerar os 30 segmentos do B0.**
4. **Espanhol:** confirmar se existe SRD 5.2.1 oficial para importar antes de traduzir por máquina.
5. **Licença das traduções da comunidade** (pode esperar).

**Fazer já, independente do resto:** exportar o backup do projeto no Weblate hospedado. O período de teste pode acabar por volta de 2026-11-29 (data com baixa confiança) e o plano Libre ainda não foi aprovado.

## Docs

| Doc | O que tem |
|---|---|
| [01-current-state.md](01-current-state.md) | Como a tradução funciona hoje no repositório |
| [02-translation-volume.md](02-translation-volume.md) | Volume medido, cobertura por idioma, crescimento, projeções |
| [03-market-research.md](03-market-research.md) | Weblate, Tolgee, Pontoon, Traduora, ferramentas de linha de comando |
| [04-translation-engines.md](04-translation-engines.md) | Modelos, licenças dos pesos, desenho do benchmark |
| [05-hosting-research.md](05-hosting-research.md) | O que cabe em nuvem gratuita e o que não cabe |
| [06-build-vs-adopt.md](06-build-vs-adopt.md) | As sete estratégias comparadas |
| [07-architecture-options.md](07-architecture-options.md) | Arquitetura mínima, principal, de reserva e de escala |
| [08-cost-analysis.md](08-cost-analysis.md) | Cenários de custo e pontos de quebra |
| [09-decision-matrix.md](09-decision-matrix.md) | Matriz ponderada e sensibilidade |
| [10-poc-plan.md](10-poc-plan.md) | Seis experimentos, com critério de sucesso e de falha |
| [11-recommendation.md](11-recommendation.md) | Recomendação, as 15 perguntas, roteiro, ir ou não ir |
| [sources.md](sources.md) | Fontes externas, verificadas em 2026-11-27 |
| [research/licensing.md](research/licensing.md) | O que as licenças significam para o projeto |
| [research/poc-results.md](research/poc-results.md) | PoC 0, 1, 3 e etapas A e A2 do PoC 2: medições no notebook, causa das falhas, testes de regressão |
| [proposals/unit-conversion.md](proposals/unit-conversion.md) | Proposta de tabela de conversão de unidades para o português |
| [proposals/glossary.pt-BR.csv](proposals/glossary.pt-BR.csv) | Proposta de glossário v0.1 (230 linhas), não revisada |
| [research/unit-conventions-evidence.md](research/unit-conventions-evidence.md) | O que o português aprovado faz com unidades, com contagens |
| [research/glossary-evidence.md](research/glossary-evidence.md) | Como o português aprovado traduz cada termo, e onde se contradiz |
| [stage-b/manifest.json](stage-b/manifest.json) | Amostras sorteadas da etapa B (30, 70 e 200 segmentos) |
| [research/adversarial-review.md](research/adversarial-review.md) | A tentativa de derrubar a recomendação e o que mudou |

## Reproduzir os números

```bash
node docs/discovery/localization-infrastructure/scripts/measure-volume.mjs
```

```bash
node docs/discovery/localization-infrastructure/scripts/decision-matrix.mjs
```

## Como foi feito

Cinco frentes de pesquisa em paralelo (auditoria do repositório, plataformas, motores de tradução, hospedagem, licenças), síntese, e uma revisão adversarial independente. A revisão mudou a recomendação: o primeiro passo ficou menor (lote único em vez de tradução incremental com trava de hashes), a verificação de números passou a considerar unidades, as horas de revisão dobraram e a matriz foi refeita.

## O que não foi verificado

- Se a tradução está certa **como regra**: só a avaliação humana (etapa B do PoC 2) responde.
- A troca para o segundo motor não foi executada; o ganho vem do cruzamento de execuções separadas.
- A taxa de falha de marcador no SRD 5.2, que tem muito mais tags que o 5.1 usado nos testes.
- Qual convenção de unidades os livros oficiais em português usam.
- Se o Weblate hospedado restringe a configuração de serviço de tradução (a documentação diz que o projeto pode configurar; exigiria túnel público, então saiu do plano).
- A situação do pedido do plano Libre e o que acontece ao fim do período de teste.
- Se existe SRD 5.2.1 oficial em espanhol (visto só num resumo de busca).
- O corte do Oracle A1 gratuito (só fontes secundárias, com datas conflitantes).
- Os docs 03, 04 e 05 marcam com "não verificado" cada limite que o agente não conseguiu confirmar na página oficial.

## Divergência entre docs, resolvida

O [05](05-hosting-research.md) não conseguiu confirmar a cláusula de uso comercial do Vercel Hobby; a [análise de licenças](research/licensing.md) e a revisão adversarial confirmaram: os Termos (§4) limitam o Hobby a uso pessoal ou não comercial. Recursos pagos no RPGWorld exigiriam o plano Pro, com ou sem esta decisão de tradução.
