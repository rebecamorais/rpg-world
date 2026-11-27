# 11 — Recomendação

**Data:** 2026-11-27 (revisada depois da [revisão adversarial](research/adversarial-review.md)). Baseada nos docs [01](01-current-state.md) a [10](10-poc-plan.md). Os PoCs 0, 1 e 3 e as etapas A e A2 do PoC 2 foram executados ([resultados](research/poc-results.md)): o modelo cabe e rende, o Weblate sozinho não serve de motor, a ferramenta pronta testada não serve como está, e o pipeline próprio entrega 99 a 100% das saídas **válidas na forma**. Se elas estão **certas como regra** ainda não foi medido, então a recomendação vale **condicionada à etapa B do PoC 2** de [10](10-poc-plan.md). O que os experimentos justificam é um pipeline próprio de tradução e uma tela de revisão local; não justificam uma plataforma.

## Em uma frase

Não construir plataforma nem alugar servidor: completar o validador que o projeto já tem, gerar o português que falta com um modelo local no notebook, revisar numa tela local feita para isso, e só colocar na `main` o que uma pessoa aprovou. O Weblate hospedado fica como porta opcional para tradutores de fora.

## O problema real é menor que o enunciado

- **Não há fila de tradutores.** O único PR do Weblate é o do dia da migração (15/11). O sueco não tem quem avalie.
- **O trabalho concreto hoje é um só:** cerca de 88 mil palavras de português, das quais 71,5 mil são texto corrido do SRD 5.2 (o resto são nomes, material de magia e sobras do 5.1), revisadas pela Rebeca. São 88 a 220 horas de revisão no total (suposição de 400 a 1.000 palavras por hora; medir no PoC 2).
- **A máquina não é o limite:** esse lote leva cerca de meia hora de GPU (projeção da medição do PoC 1: 55 palavras por segundo com 4 fluxos).

Por isso o primeiro passo não é infraestrutura de tradução contínua. É um lote, um validador e um jeito confortável de revisar.

## As quatro arquiteturas pedidas

| | Arquitetura | Quando |
|---|---|---|
| **Principal** | Pipeline local + tela de revisão local + validador no CI, tudo dentro do repositório, com núcleo e adaptador separados ([06](06-build-vs-adopt.md), opção 3). Weblate hospedado opcional para tradutores de fora. Texto de máquina só entra depois de aprovado | Agora, se a etapa B passar |
| **Mínima** | Git-nativa (F): o mesmo, sem a tela e sem Weblate; revisão por fatia em PR | Se a tela de revisão não se pagar na etapa B0 |
| **Reserva** | Modelo reprovado: só o validador, tradução humana. Weblate hospedado indisponível e tradutores esperando: Weblate numa VPS de ~€ 6/mês | Conforme o que falhar |
| **Escala** | Weblate auto-hospedado como dono da revisão; o mesmo script envia sugestões | Dezenas de tradutores ativos, ou 5× o conteúdo com 5 ou mais idiomas |

Desenhos em [07](07-architecture-options.md). A [matriz](09-decision-matrix.md) deixa G, B e F empatadas (4,25, 4,20, 4,20); G foi escolhida porque é a única das três que tem tela de revisão **e** não depende de aprovação de terceiros.

## As quinze perguntas

1. **Existe solução aberta que atende?** Para gerenciar tradução, sim: o Weblate (GPL-3.0, sem recursos travados). Para o conjunto "gratuito, sem servidor, com tradução local", nenhuma ferramenta sozinha; `i18n-ai-translate` (GPL-3.0) foi testado e não cobre o lote como está (PoC 3).
2. **Dá para auto-hospedar sem custo recorrente?** Não de forma sustentável. O Weblate pede 3 GB de RAM no mínimo, sempre ligado; o único gratuito que comporta (Oracle A1) recolhe instância ociosa.
3. **Onde fica cada peça?** Arquivos e glossário no GitHub; tradução no notebook; validador no GitHub Actions; revisão no Weblate hospedado ou em PR.
4. **Aguentamos o volume?** A máquina, com folga (0,8 a 1,7 hora de GPU por idioma, medido numa amostra e projetado). A revisão, não: 291 a 728 horas para tudo o que falta em pt, es e sv.
5. **Qual motor?** Provisoriamente Gemma 4 E4B (Apache-2.0) no llama.cpp, com Qwen3.5-9B (Apache-2.0) como segundo motor para o que o primeiro não entregar válido. Nenhum dos dois cumpriu sozinho todos os limiares automáticos; o pipeline barra o que falha ([resultados](research/poc-results.md)). A escolha final sai da comparação cega da etapa B1.
6. **O trabalho pesado roda local?** Sim, e é o único lugar gratuito onde roda.
7. **Estender uma ferramenta existente basta?** Provavelmente. O Weblate cobre a revisão; os testes do projeto já cobrem tags e marcação. Falta completar o validador e gerar o lote. A ferramenta pronta testada não serviu (PoC 3), então o lote é um script próprio pequeno.
8. **Vale construir um motor próprio?** Um pipeline próprio, sim: 10 a 18 horas, dentro do repositório, já dividido em núcleo genérico e adaptador do RPGWorld. A inferência é do llama.cpp e os modelos são os que existem. Um projeto independente só quando houver um segundo usuário.
9. **Vale construir uma plataforma completa?** Não. São 1.500 a 4.000 horas para refazer o que o Weblate já entrega.
10. **Qual a arquitetura mais simples que atende?** Lote que só preenche chave vazia, validador no CI, revisão antes do merge.
11. **O que quebra primeiro?** A atenção para revisar, já hoje. Depois, o teto de 160 mil strings do Weblate hospedado (5× o conteúdo com 5 idiomas). Depois, a revisão por diff em lotes grandes.
12. **E se um provedor gratuito mudar os termos?** Weblate hospedado: as traduções aceitas já estão no Git; **perdem-se sugestões pendentes, memória e configuração** se o backup do projeto não for exportado antes. GitHub Actions: o validador roda igual no notebook.
13. **Como migrar sem perder nada?** Exportar o backup do projeto no Weblate (vale fazer já) e restaurar numa instância própria. O histórico das traduções está no Git.
14. **Quanto esforço?** 28 a 50 h para validador, pipeline e tela de revisão; 1 a 2 h por mês de manutenção; 72 a 179 h de revisão do português do SRD 5.2 (suposição; a etapa B0 mede).
15. **O que não construir?** Interface web, contas, banco, fila, servidor, memória difusa, treino de modelo, workers distribuídos, trava de hashes antes de haver fluxo recorrente, pacote genérico antes do segundo usuário.

## Por que as outras ficaram de fora

- **A (Weblate auto-hospedado agora):** dinheiro e operação por um servidor que hoje ficaria parado.
- **B (Weblate como dono do fluxo):** mesmo dia a dia de G, mas para se o plano Libre for negado. Vira a arquitetura de escala.
- **C (fork):** nada exige mexer no núcleo; a sincronização custa 5 a 10 h por mês.
- **D (motor como projeto independente):** 80 a 200 h por generalidade que ninguém pediu.
- **E (plataforma completa):** desclassificada.
- **Tolgee:** glossário, memória compartilhada e verificações são pagos; o `ee/` proíbe uso comercial.
- **Programas de software livre do Crowdin e do Transifex:** exigem projeto sem produto comercial ou sem receita.
- **Lingo.dev:** a versão atual traduz na nuvem deles.
- **NLLB-200, Tower, Aya, Hunyuan-MT:** licenças não comerciais ou com restrição de território.

## Decisões que são da Rebeca

1. **Rever "sem tradução automática, nem como rascunho"** ([traducoes-comunitarias.md](../../plans/2026-10-15-traducoes-comunitarias.md)). A proposta mantém a parte que importa (nada de máquina no app sem revisão) e muda só a parte "nem como rascunho".
2. ~~Unidades~~ **decidido em 27/11** ([tabela](proposals/unit-conversion.md)): converter; milha × 1,5; libra × 0,5; "1,5 quilômetro". O app precisa mudar uma linha para a milha.
3. ~~Glossário, termos principais~~ **decidido em 27/11** ([registro](research/glossary-evidence.md#decisões-da-rebeca-2711)): "nível" de magia, "salvaguarda", "Mestre", "rolar", tipos de dano como estão. Nove termos menores seguem com a forma dominante até ela dizer o contrário.
3a. **Construir a tela de revisão local** (12 a 20 h) e gerar o B0. É o próximo passo e precisa do seu sim.
4. **Espanhol:** confirmar se existe SRD 5.2.1 oficial em espanhol e sob qual licença, antes de traduzir por máquina.
5. **Licença das traduções da comunidade** ([análise de licenças](research/licensing.md)). Pode esperar o primeiro tradutor de fora.

## Roteiro

| Fase | O quê | Esforço | Sai com |
|---|---|---:|---|
| 0 | Exportar o backup do Weblate; decisões 1 a 3 | 1–2 h dela | Glossário e unidades fechados |
| 1 | PoCs 0, 1, 3 e etapas A e A2 | **feito em 27/11** | Pipeline definido; motor provisório |
| 2 | Validador completo, com os testes de regressão (PoC 4) | 6–12 h | Todo PR de tradução validado, com ou sem máquina |
| 3 | Pipeline (núcleo + adaptador) e tela de revisão local | 22–38 h | Ferramenta pronta para a etapa B |
| 4 | Etapa B0: 30 segmentos | 3–7 h de revisão | Rubrica calibrada, ritmo medido |
| 5 | Etapa B1: 70 segmentos, comparação cega | 5–13 h de revisão | Motor escolhido |
| 6 | Etapa B2: 200 segmentos, pipeline congelado | 17–41 h de revisão | **Vai ou não vai** |
| 7 | O resto do pt do SRD 5.2, em fatias | restante das 72–179 h | Português completo |
| 8 | Só com sinal real: espanhol, Weblate próprio, projeto independente | — | — |

A fase 2 vale sozinha: mesmo se o modelo for reprovado, o validador protege as traduções humanas. O que for aprovado nas fases 5 e 6 já é tradução do produto.

## Portões

| Portão | Passa se | Senão |
|---|---|---|
| Validador | ≥ 28 de 30 erros plantados; < 1% de falso positivo no pt aprovado; todos os casos de regressão | Corrigir antes de qualquer lote |
| Rejeição segura | Nenhuma saída inválida gravada; toda chave não entregue aparece num relatório | Não rodar lote |
| B0 | Menos de 3 erros críticos (P0) em 30 | Voltar ao pipeline |
| B1 | Um motor escolhido pela regra escrita em [10](10-poc-plan.md) | — |
| B2, vai | No máximo 2 P0 em 200, no máximo 10 com P0 ou P1, ≥ 80% aproveitável | Entre os dois: máquina só nas descrições longas |
| B2, não vai | 6 ou mais P0 nos primeiros 100, ou < 60% aproveitável | Só o validador; tradução humana |
| Custo de revisão | Ritmo medido projeta até 150 h para o que falta (proposta; a decisão é dela) | Reduzir escopo ou buscar segundo revisor |
| Weblate auto-hospedado | Plano Libre indisponível **e** pelo menos 3 tradutores ativos que não usam Git | Não subir |
| Interface pública para a comunidade | Pedidos reais de tradutores que a tela local e o Weblate não atendem | Não construir |
| Projeto independente | Um segundo repositório real pedindo o pipeline | Fica dentro do RPGWorld |
| Trava de hashes | Fluxo recorrente de tradução por máquina sem Weblate | Adiada |

## Riscos que continuam

- **A qualidade em regra de RPG não foi medida.** É o maior risco e o motivo de a recomendação ser condicional.
- **O validador já aceitou lixo uma vez.** Num experimento, o modelo devolveu a mensagem de erro traduzida e ela passou em todas as verificações. A correção está definida; o episódio mostra que "válido" não é "certo".
- **A tela de revisão pode virar um projeto de interface.** Escopo travado em [07](07-architecture-options.md).
- **A revisão depende de uma pessoa só.** 72 a 179 horas é muito para quem tem outro emprego; a 5 horas por semana, são de 3 a 9 meses. Um segundo revisor muda mais o prazo que qualquer ferramenta.
- **O validador não pega erro de regra** (vantagem por desvantagem, atributo errado). Só leitura pega.
- **Notebook único.** Se ele estiver indisponível, a tradução espera; nada quebra.
- **Plano Libre pendente.** Se for negado, perde-se a tela de revisão, não as traduções.

## Nível de confiança

- **Alto:** não construir plataforma; não depender de servidor gratuito; inferência local; nada de máquina sem revisão.
- **Médio:** um lote único basta por enquanto.
- **Baixo:** que um modelo de 9B chegue a 80% de segmentos aproveitáveis em texto de regra; as horas de revisão.
