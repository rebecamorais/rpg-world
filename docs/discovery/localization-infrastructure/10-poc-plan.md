# 10 — Plano de experimentos

**Data:** 2026-11-27 (revisado depois da [revisão adversarial](research/adversarial-review.md)). Seis experimentos pequenos, na ordem em que reduzem mais incerteza. **PoC 0, PoC 1 e PoC 3 já foram executados; os resultados estão em [research/poc-results.md](research/poc-results.md).** Os demais, não. Todos usam o notebook e o repositório; nenhum cria conta nem recurso pago.

**Precisa de autorização da Rebeca antes de rodar:**

- PoC 1, 2 e 3: instalar llama.cpp (ou Ollama) e baixar modelos (5 a 7 GB cada).
- PoC 0 e 5: mexer na configuração e enviar sugestões de teste ao projeto no Weblate hospedado.

Tempo de engenharia: 14 a 26 horas, mais 12 a 20 horas da tela de revisão local ([07](07-architecture-options.md)), que a etapa B exige. A avaliação humana do PoC 2 é à parte: 25 a 61 horas pela projeção (não medido), das quais o que for aprovado é tradução aproveitada.

## Antes de tudo: backup do Weblate (15 min)

Exportar o backup do projeto `rpgworldapp` no Weblate hospedado e guardar fora dele. Sugestões pendentes, memória e configuração só existem lá. Se o período de teste de 14 dias começou em 2026-11-15, ele acaba por volta de 2026-11-29 (data com baixa confiança; o que acontece depois não foi verificado).

## PoC 0 — O Weblate sozinho já resolve? (1–2 h)

> **Resultado (27/11): falha, como esperado.** O projeto pode configurar um endpoint próprio, mas ele precisa ser alcançável pelo servidor do Weblate, e não há controle documentado do raciocínio do modelo. O script de lote continua no plano.

- **Hipótese:** o Weblate hospedado deixa configurar um serviço de tradução com URL própria e gerar sugestões com o complemento de tradução automática, sem script nenhum.
- **Preparo:** ler a tela de serviços de tradução do projeto no Weblate hospedado; conferir se o plano Libre permite URL própria. **Não** abrir túnel nem expor o notebook nesta etapa.
- **Medir:** a opção existe? Aceita endpoint compatível com OpenAI? Dá para controlar o prompt (glossário, desligar o raciocínio do modelo)? Exige endpoint público sempre ligado?
- **Sucesso:** existe, com controle de prompt, e funciona com o notebook ligado só durante o lote. Nesse caso o script de lote deixa de ser necessário e sobra só o validador.
- **Falha:** exige endpoint público permanente, ou não dá controle de prompt. É o resultado esperado (o notebook não aceita conexão de entrada), mas custa uma hora conferir antes de escrever código.
- **Limpeza:** desfazer qualquer configuração de teste no projeto.

## PoC 1 — O modelo cabe e rende no notebook? (2–3 h)

> **Resultado (27/11): sucesso.** Qwen3.5-9B Q4_K_M: 6,7 GB de VRAM, projeção de 0,81 h por 160 mil palavras com 4 fluxos (1,7 h com 1). Achado extra: o prompt simples traduziu identificadores de tags `{@…}` em 20 de 52 strings; as tags precisam ser mascaradas antes de ir ao modelo.

- **Hipótese:** um modelo de ~9B em Q4 roda inteiro nos 8 GB de VRAM sob WSL2 e traduz 158 mil palavras em menos de 4 horas.
- **Preparo:** llama.cpp com CUDA no WSL2; Qwen3.5-9B Q4_K_M com o raciocínio desligado (vem ligado por padrão); 200 strings sorteadas com semente fixa (50 de interface, 150 de regras).
- **Medir:** tokens por segundo com 1 e com 4 fluxos; VRAM no pico e potência (`nvidia-smi`); RAM; tempo total.
- **Sucesso:** sem descarregar camadas para a CPU; projeção de até 4 h para 158 mil palavras.
- **Falha:** falta de VRAM, ou projeção acima de 12 h. Testar então o modelo menor da lista de [04](04-translation-engines.md).
- **Limpeza:** apagar os arquivos de modelo.

## PoC 2 — A qualidade serve para regra de RPG? (o decisivo)

> **Etapas A e A2 feitas em 27/11: vai condicional para a etapa B, nenhum motor aprovado para produção.** Nenhum dos dois melhores cumpriu todos os limiares automáticos sozinho (Qwen traduziu um placeholder; Gemma errou um dado e recusou uma string na interface); o validador barrou todos esses casos. Com conserto determinístico de marcadores, 99 (Gemma) e 100 (Qwen) de 100 regras saem válidas. Mascarar números e medidas não trouxe ganho e não entra. Uma falha do validador foi achada e tem correção definida. EuroLLM-9B fora. Detalhes em [resultados](research/poc-results.md). **A etapa B (avaliação humana) é a que decide.**

- **Hipótese:** com glossário no prompt e validação, um modelo local gera rascunho de regra que uma pessoa aprova com poucos ajustes.
- **Preparo (4–6 h):**
  - Limpar a referência: tirar das descrições pt do SRD 5.1 as sobras em inglês entre colchetes (`6 metros [20-foot-radius sphere]`, em 69 a 78 descrições) antes de usá-las como gabarito ou como exemplo no prompt.
  - Escrever a convenção de unidades do pt (pés para metros, como o 5.1 já faz).
  - Glossário inicial de 30 a 50 termos tirado do pt do SRD 5.1.
  - Mascarar as tags `{@…}` antes de enviar ao modelo (o PoC 1 mostrou que a instrução no prompt não basta).
  - Motores: Qwen3.5-9B e mais um ou dois de [04](04-translation-engines.md). O Seed-X-PPO-7B não aceita glossário no prompt (não tem modelo de conversa); entra como comparação, não como favorito.
- **Etapa A, automática, todos os motores:** paridade de placeholders e ICU, de dados, de marcação; conversão de unidades correta; acerto de glossário; chrF contra a referência limpa. Escolhe **um** motor.
- **Etapa B, humana:** redesenhada em 27/11, na seção seguinte. O desenho antigo (300 segmentos de uma vez, um motor, três notas) foi substituído.

### Etapa B — protocolo (redesenhado em 27/11, ainda não executado)

**Pergunta:** o pipeline local gera tradução mecanicamente correta a um custo de revisão que uma pessoa sozinha sustenta?

**Amostra.** Sorteada com semente fixa por [`scripts/stage-b-sample.mjs`](scripts/stage-b-sample.mjs) e gravada em [`stage-b/manifest.json`](stage-b/manifest.json) (chave, categoria, palavras, tags e hash da fonte de cada segmento). População: 1.113 campos de texto do SRD 5.2 ainda sem português, 71,5 mil palavras (**medido**). Segmento é o campo inteiro (uma descrição), não uma frase.

| Etapa | Segmentos | Palavras de fonte | Com conversão de unidade | Com tags | Para quê |
|---|---:|---:|---:|---:|---|
| B0 | 30 | 2.931 | 12 | 27 | Calibrar a rubrica, medir o ritmo, achar defeito do pipeline |
| B1 | 70 | 5.388 | 26 | 54 | Comparação cega Gemma × Qwen |
| B2 | 200 | 16.590 | 63 | 156 | Validar o pipeline escolhido, congelado |

- **Estratos:** descrições de magia (41%), efeitos em nível superior, material e gatilho, características de classe (31%), itens (13%), condições (as 15 que existem entram todas). Dentro de cada estrato o sorteio alterna três tipos: com conversão de unidade, carregado de tags ou longo, simples.
- **O que não entra, porque o produto não tem:** regras de combate e habilidades de monstro. O conteúdo do repositório hoje é magias, itens, condições e classes. As condições e as características de classe são o texto mais próximo de "regra geral".
- **B0 e B1 só usam segmentos de até 400 palavras**, para a sessão de revisão caber numa sentada. B2 não tem teto.
- **Custo (projeção, não medido):** com 400 a 1.000 palavras por hora, B0 leva 3 a 7 h; B1, 5 a 13 h (são duas saídas por segmento, lidas juntas); B2, 17 a 41 h. É um terço de todo o português que falta. O que for aprovado em B1 e B2 é tradução aproveitada, não descarte.

**Contra vazamento e ajuste ao conjunto de teste:**

- Glossário, exemplos do prompt e ajustes do pipeline só usam o SRD 5.1 (etapas A e A2). Os 80 segmentos do 5.2 que já passaram pelo PoC 1 ficaram fora do sorteio.
- O pipeline é congelado antes de cada etapa: commit do script, hash do arquivo do modelo e parâmetros gravados junto da saída.
- **B0 é o único lugar onde o pipeline e a rubrica podem mudar.** Seus segmentos ficam "gastos": não entram nas métricas de decisão.
- Depois de B1 escolhe-se o motor e nada mais muda. B2 é gerado uma vez só; nenhuma saída é regerada depois de vista.

**Comparação cega (B1).** As duas saídas aparecem lado a lado como "A" e "B", em ordem sorteada por segmento; o mapa fica num arquivo que a tela não mostra. Saídas idênticas aparecem uma vez só. Segmento que um motor não conseguiu entregar válido aparece como "sem saída", sem dizer de quem.

**Rubrica.** Em cada saída: a pior severidade encontrada, o veredito e o texto corrigido.

| Severidade | O que é | Exemplo |
|---|---|---|
| P0 crítico | Muda regra, condição, efeito, número ou alvo | "desvantagem" por "vantagem"; "metade do dano" sumiu |
| P1 grave | Omite informação ou erra o sentido, sem mudar mecânica | frase de ambientação cortada |
| P2 moderado | Termo fora do glossário | "feitiço" por "magia" |
| P3 leve | Frase pouco natural | "dura durante a duração" |
| P4 cosmético | Pontuação, preferência de estilo | |

Vereditos: **aprovo como está**, **aprovo com ajuste** (texto corrigido na hora), **refiz**, **rejeito** (fica vazio, traduzir depois).

**Medidas:** P0 e P1 por etapa; taxa de cada veredito; tempo por segmento e por palavra de fonte (cronometrado pela tela); distância de edição entre a saída e o texto aprovado; preferência em B1; taxa de rejeição pelo validador; quanto o segundo motor recupera do que o primeiro não entregou.

**Limiares, definidos antes de ver qualquer saída:**

| Momento | Regra |
|---|---|
| B0 | Não decide qualidade. **Para e volta ao pipeline** se houver 3 ou mais P0 em 30 |
| B1 | Fica o motor com menos P0 + P1. Empate: o preferido mais vezes. Novo empate: Gemma (menos VRAM) |
| B2, vai | No máximo 2 P0 em 200 **e** no máximo 10 com P0 ou P1 **e** ≥ 80% em "como está" ou "com ajuste" |
| B2, não vai | 6 ou mais P0 nos primeiros 100, ou menos de 60% aproveitável. Pode parar ali |
| Custo | O ritmo medido, projetado para as 71,5 mil palavras, dá o total de horas. Se o total cabe ou não na vida dela é decisão da Rebeca; a proposta é "vai" até 150 h |

**O que a amostra permite afirmar:** com 0 P0 em 200, a taxa real fica abaixo de 1,5% (95% de confiança); com 2 em 200, abaixo de 3,2%. Mesmo no melhor caso, isso ainda admite mais de dez segmentos com erro crítico nos 1.113. **A revisão antes de publicar continua, qualquer que seja o resultado.**

**Cada P0 e P1 encontrado vira pergunta:** uma verificação determinística pegaria? Se sim, entra no validador com teste de regressão.

**Limites do método:** uma avaliadora só, que é também a mantenedora. A comparação cega esconde o motor, não o viés de quem quer que o projeto dê certo. Uma segunda pessoa revisando 30 dos mesmos segmentos mostraria quanto as notas concordam. Opcional e barato: em B0, traduzir 5 segmentos do zero, cronometrando, para saber se revisar rascunho é de fato mais rápido que escrever.

## PoC 3 — Dá para usar uma ferramenta pronta em vez de escrever o script? (2–4 h)

> **Resultado (27/11): falha.** `i18n-ai-translate` 5.4.0 roda com o modelo local, mas pulou 3 de 8 descrições de magia e 2 de 8 mensagens ICU, quebrou ou inventou tags `{@…}` em 7 de 22 campos, reordenou o JSON e apagou uma edição humana ao rodar de novo. Vale o script próprio.

- **Hipótese:** `i18n-ai-translate` (GPL-3.0, Ollama, modo `diff`, `--glossary`) traduz incrementalmente os arquivos do projeto sem adaptação, ou com pouca.
- **Preparo:** cópia de `messages/` e de um `content/**/i18n/en/spells.json` numa pasta temporária; rodar contra o modelo do PoC 1; mudar 5 strings de fonte e rodar de novo.
- **Medir:** só as 5 mudaram? A forma e a ordem do JSON ficaram iguais? Preserva ICU e as tags `{@…}`? Respeita o glossário? Deixa em paz o que já está traduzido?
- **Sucesso:** os cinco. O trabalho próprio se reduz ao validador.
- **Sucesso parcial:** falha em um ponto que um ajuste pequeno resolve. Como o app é GPL-3.0-or-later, adaptar ou embutir o código dele no repositório é permitido.
- **Falha:** estraga o JSON das regras ou sobrescreve tradução existente sem jeito simples de corrigir. Aí vale o script próprio (8 a 16 h).
- **Limpeza:** apagar a pasta temporária e os pacotes instalados.

## PoC 4 — O validador pega os erros que importam? (3–5 h)

- **Hipótese:** as verificações que faltam (ICU pela árvore da mensagem, dados, números com unidades, glossário, tamanho e eco de instrução) barram erro de forma sem barrar tradução boa.
- **Casos de regressão:** a lista de falhas observadas nos PoCs 1, 2 e 3 está em [resultados](research/poc-results.md#testes-de-regressão-plano-cada-falha-observada-vira-um-caso). Cada uma vira um teste.
- **ICU:** usar `@formatjs/icu-messageformat-parser`, que já vem com o `next-intl`. Conferir nomes de argumento, tipo, chaves de `plural` e `select` e tags; o texto literal pode mudar.
- **Preparo:** protótipo ao lado dos testes que já existem (`content/dnd5e/content.unit.test.ts` já confere tags e marcação). Rodar em três conjuntos: o pt atual, a saída do PoC 2 e 30 erros plantados à mão.
- **Medir:** erros plantados detectados; falsos positivos no pt aprovado; tempo.
- **Sucesso:** ≥ 28 de 30 plantados; falsos positivos em menos de 1% das strings aprovadas; menos de 30 s.
- **Falha:** falsos positivos acima de 5%. Aviso: a verificação ingênua "números iguais" falha em 58% das magias pt do 5.1 por causa da conversão de unidades; o teste só faz sentido com a convenção de unidades implementada.
- **Limpeza:** nenhum estado; o protótipo vira o começo da implementação.

## PoC 5 — Qual forma de revisar rende mais? (1–2 h)

- **Hipótese:** revisar sugestões no Weblate é pelo menos tão rápido quanto revisar uma fatia num PR.
- **Preparo:** 50 strings do PoC 2. Metade enviada como sugestão ao Weblate (o script que já existe faz isso); metade numa branch de rascunho, revisada no editor.
- **Medir:** minutos por string em cada caminho; o PR do Weblate com as aceitas chegou sem conflito? Conferir de passagem se o envio "precisa de edição" grava texto no JSON.
- **Sucesso:** um dos caminhos é claramente mais confortável; vira o padrão.
- **Falha:** conflito de rebase recorrente no PR do Weblate. Nesse caso, revisão por fatia em PR.
- **Limpeza:** apagar as sugestões de teste e a branch.

## Fora do plano, de propósito

- Subir Weblate auto-hospedado: só se o plano Libre for negado **e** houver tradutores esperando.
- Testar hospedagem no Oracle: o risco é de política, não técnico.
- Traduzir sueco: não há quem avalie. Sem revisor, não gerar.
- Traduzir as regras em espanhol por máquina antes de confirmar se existe SRD 5.2.1 oficial em espanhol para importar.

## Ir ou não ir

| Resultado | Decisão |
|---|---|
| PoC 0 passa | Não escrever script de lote; só o validador |
| PoC 2 B0 com 3 ou mais erros críticos em 30 | Voltar ao pipeline antes de gastar mais revisão |
| PoC 1 e 2 passam | Gerar o pt do SRD 5.2 em lote e revisar tudo antes de publicar |
| PoC 2 fica no meio | Gerar só descrições longas; nomes e regras curtas, humanos |
| PoC 2 falha | Não gerar. Fazer só o validador e seguir com tradução humana |
| PoC 3 passa | Usar a ferramenta pronta |
| PoC 4 passa | Ligar o validador no CI, com ou sem máquina |
