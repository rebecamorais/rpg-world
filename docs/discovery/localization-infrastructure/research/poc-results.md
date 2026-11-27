# Resultados dos experimentos

**Data:** 2026-11-27. PoC 0, PoC 1, PoC 3 e as etapas A e A2 do PoC 2 de [10](../10-poc-plan.md), autorizados pela Rebeca. Tudo aqui é **medido** neste notebook, salvo onde diz "projeção".

## PoC 0 — O Weblate sozinho já resolve? **Não, para este caso**

Conferido só na documentação oficial; não entrei no projeto nem mudei configuração.

| Pergunta | Resposta | Confiança |
|---|---|---|
| Quem administra o projeto configura serviço de tradução? | Sim, por projeto, desde a versão 4.13 | Alta |
| Aceita URL própria? | Sim: OpenAI (URL base e nome de modelo), Ollama, LibreTranslate, LTEngine | Alta |
| Dá para ajustar o prompt? | Campos de "persona" e "estilo" e instruções por idioma; o glossário do projeto entra sozinho | Alta |
| Dá para desligar o raciocínio do modelo, ou mexer em temperatura e tempo limite? | Não documentado | Não verificado |
| O complemento de tradução automática tem modo sugestão? | Sim: sugestão, tradução, "precisa de edição", aprovado | Alta |
| O endpoint precisa ser alcançável pelo servidor do Weblate? | Sim ("must be reachable from the Weblate server") | Alta |
| O Weblate hospedado restringe algo disso? | — | Não verificado |

**Conclusão:** o notebook fica atrás de rede residencial e só liga durante o lote. Usar o Weblate como motor exigiria um túnel público estável e a máquina ligada sempre que o complemento disparar, sem controle do raciocínio do modelo. O script de lote local continua no plano.

Fonte: `docs.weblate.org/en/latest/admin/machine.html` e `docs.weblate.org/en/latest/admin/addons.html`, lidos em 2026-11-27.

## PoC 1 — O modelo cabe e rende? **Sim**

### Ambiente

| | |
|---|---|
| GPU | NVIDIA RTX 5070 Laptop, 8.151 MiB, driver 621.14, sob WSL2 |
| Servidor | `ghcr.io/ggml-org/llama.cpp:server-cuda` (imagem `sha256:c94503b4e783…`), via Docker com `--gpus all`, porta só em `127.0.0.1` |
| Modelo | `unsloth/Qwen3.5-9B-GGUF`, arquivo `Qwen3.5-9B-Q4_K_M.gguf` (5,68 GB) |
| Opções | `-ngl 99 --reasoning-budget 0`; contexto 8.192 com 1 slot, 16.384 com 4 slots |
| Amostra | 200 strings com semente fixa: 50 de interface, 150 de regras do SRD 5.2; 5.996 palavras de fonte |
| Script | [`scripts/poc1-bench.mjs`](../scripts/poc1-bench.mjs) |

### Medições

| | 1 fluxo | 4 fluxos |
|---|---:|---:|
| Tempo para as 200 strings | 229,1 s | 108,6 s |
| Tokens gerados por segundo | 48,9 | 103,8 |
| Palavras de fonte por segundo | 26,2 | 55,2 |
| VRAM no pico (placa inteira) | 6.739 MiB | 6.733 MiB |
| Potência média da GPU | 99,5 W | 77,4 W |
| Potência máxima da GPU | 113 W | 113 W |
| Falhas, respostas cortadas, respostas vazias | 0 | 0 |
| Respostas com raciocínio | 0 | 0 |
| **Projeção para 160 mil palavras** | **1,7 h** | **0,81 h** |

- **Cabe:** a placa tinha ~0,9 a 1,3 GB ocupados pelo Windows; com o modelo, 6,7 GB de 8,2 GB. Sobra ~1,4 GB.
- **Rende:** a estimativa do [04](../04-translation-engines.md) (1 a 2,2 h por idioma) se confirma, um pouco melhor com 4 fluxos.
- **Energia (projeção):** 0,81 h a ~80–100 W dá 0,06 a 0,08 kWh por idioma, só a GPU. O consumo do resto do notebook não foi medido.
- **Critério do PoC:** sucesso (até 4 h; sem estouro de VRAM).

### O que não foi medido

- Não achei no log a linha que confirma quantas camadas foram para a GPU. A VRAM usada (~5,8 GB acima do repouso) e a vazão são compatíveis com o modelo inteiro na placa.
- RAM do contêiner: 8,3 a 8,6 GiB segundo o `docker stats`, que inclui o cache do arquivo do modelo.
- Uma execução de cada; sem repetição para medir variação.

## Achado extra: o prompt simples quebra as tags

Passei as 200 saídas por verificações determinísticas. **Isto não é o benchmark de qualidade** (PoC 2): o prompt era o mais simples possível, com 9 termos de glossário.

| Verificação | Strings com o elemento | Quebradas |
|---|---:|---:|
| Placeholders `{nome}` | 6 | 0 |
| Dados (`2d6`) | 17 | 0 |
| Tags HTML | — | 0 |
| Texto igual à fonte (não traduziu) | — | 0 |
| **Identificadores de tags `{@…}`** | **52** | **20 (38%)** |

O modelo traduziu a parte que é identificador, mesmo com instrução para não mexer:

```text
EN: {@condition Charmed|XPHB}
PT: {@condition Encantado|XPHB}

EN: {@variantrule Sphere [Area of Effect]|XPHB|Sphere}
PT: {@variantrule Sphere [Área de Efeito]|XPHB|Esfera}
```

Consequências para o desenho:

1. **Mascarar as tags antes de enviar** (trocar cada `{@…}` por um marcador opaco e devolver depois, traduzindo só o terceiro segmento, que é texto de exibição). Instrução no prompt não basta.
2. **O teste que o projeto já tem pegaria esses 20 casos** (`content/dnd5e/content.unit.test.ts` confere a paridade das tags). O validador funciona como rede.
3. Vistos de passagem, sem contar: "20 pés" sem converter para metros, "feitiço" onde o pt do projeto usa "magia", "Pontos de capacidade" para *Ability scores*, "partida" para *party*. São casos de glossário e de convenção de unidades, que o PoC 2 mede com o glossário de verdade.

## PoC 3 — Dá para usar uma ferramenta pronta? **Não, sem reescrever o essencial**

`i18n-ai-translate` 5.4.0 (GPL-3.0), instalado numa pasta temporária e apontado para o mesmo servidor local (motor `chatgpt` com `OPENAI_BASE_URL=http://127.0.0.1:8080/v1`; funciona). Amostra: 8 magias reais do SRD 5.2 (25 campos) e 8 mensagens ICU reais da interface. Modo `json`, `--reasoning-effort none`, glossário de 6 termos, delimitadores `{` e `}`.

| O que o projeto precisa | O que aconteceu |
|---|---|
| Traduzir todos os campos | Pulou 3 das 8 descrições de magia (`fireball`, `silence`, `sleep`) e 2 das 8 mensagens ICU (as duas com `plural`), depois de 5 tentativas cada |
| Preservar as tags `{@…}` | Quebrou em 7 dos 22 campos gravados. Chegou a **inventar tags** que não existem na fonte: `{@saving throw}`, `{@spell slot}` |
| Manter ordem e formato do JSON | Reordenou as chaves e gravou com 4 espaços (o projeto usa 2, sem ordenar) |
| Não sobrescrever tradução existente | Uma edição humana plantada no `pt.json` foi apagada ao rodar de novo |
| Mensagens ICU simples com tags `<bold>` | Corretas nas 6 que traduziu, incluindo um `plural` aninhado |

Uma execução de cada, amostra pequena: serve para decidir "serve como está?", não para medir taxa de erro.

**Conclusão:** os quatro pontos que falharam são justamente o trabalho (mascarar tags, preencher só o vazio, manter o formato, não pular texto longo). Adaptar a ferramenta seria reescrever esse miolo dentro de um código alheio. Vale o script de lote próprio, de 8 a 16 horas. Do que ela faz bem, dá para copiar a ideia do passo de verificação e do cache por texto de fonte.

## PoC 2, etapa A — Qual motor? **Vai condicional para a avaliação humana; nenhum motor aprovado para produção**

> **Correção de 27/11.** A primeira versão desta seção dizia que Gemma e Qwen "passam". Não é exato: **nenhum dos dois cumpriu todos os limiares automáticos** (tabela "Limiares do plano", abaixo). O resultado certo é: Gemma 4 E4B à frente por pouco, Qwen3.5-9B como segundo motor, EuroLLM-9B fora, e **sinal verde só para a próxima etapa**. As falhas foram investigadas na etapa A2, logo depois desta.

Cinco coisas diferentes, que este relatório não mistura mais:

| O que | Significa | Onde está |
|---|---|---|
| Acerto bruto do modelo | Saída válida na primeira tentativa, sem ajuda | 94 a 97% nas regras |
| Sucesso do pipeline | Saída válida depois de conserto e novas tentativas | 99 a 100% nas regras (A2) |
| Rejeição segura | O que continua inválido **não é entregue**: a chave fica vazia e entra num relatório | Vale para todo o resto, **com uma falha encontrada e descrita na A2** |
| Correção como regra | A tradução diz o que a regra diz | **Não medida.** Só a etapa B |
| Pronto para produção | Tudo acima, mais custo de revisão sustentável | **Não.** Depende da etapa B |

O chrF **não** é evidência de correção mecânica nem de correção como regra. Mede letras em comum com a referência e serve só para comparar variantes do mesmo pipeline.

Só verificações automáticas: nenhuma pessoa avaliou e nenhum modelo se avaliou. Não diz se a tradução está **certa como regra**; isso é a etapa B.

### Como foi

- **Conjunto de teste (semente fixa):** 100 descrições de magia do SRD 5.1 e 50 strings de interface (15 com `plural`, `select` ou tags), todas com português já aprovado no repositório para servir de referência. A referência foi limpa das sobras em inglês entre colchetes.
- **Pipeline testado** ([`scripts/poc2-bench.mjs`](../scripts/poc2-bench.mjs)): converter unidades na fonte → mascarar as tags `{@…}` → traduzir com glossário (33 termos tirados do pt do SRD 5.1) e 3 exemplos aprovados → validar → até 2 novas tentativas → desmascarar.
- **Unidades (decisão da Rebeca em 27/11: converter):** feitas por código antes do modelo, na convenção que o pt do 5.1 já usa: 5 pés = 1,5 m; 1 milha = 1,5 km e as demais ×1,6; libras ×0,45; polegada = 2,5 cm; galão = 4 L. É provisória: precisa ser escrita num doc do projeto.
- **Servidor:** o mesmo do PoC 1, contexto 16.384 com 2 slots, 2 fluxos.

### Resultado

| | Qwen3.5-9B Q4 | Gemma 4 E4B Q4 | EuroLLM-9B Q4 |
|---|---:|---:|---:|
| VRAM com o modelo carregado | 6,4 GB | 4,2 GB | 7,0 GB |
| Tempo para as 150 strings | 291 s | 221 s | 1.568 s |
| **Regras:** passou em tudo na 1ª tentativa | 95% | 94% | 93% |
| **Regras:** passou depois das novas tentativas | 96% | 96% | 95% |
| **Regras:** acerto de glossário (201 ocorrências) | 96,5% | 100% | 76,6% |
| **Regras:** chrF médio contra o pt aprovado | 71,2 | 72,2 | 69,5 |
| **Interface:** falhas reais em 50 | 1 | 2 | 0 |
| **Interface:** chrF médio | 75,0 | 78,2 | 69,5 |
| Números e dados errados nas regras | 0 | 0 | 0 |

- **Gemma contra Qwen nas regras:** diferença média de chrF de +1,0 ponto (intervalo de 95% por reamostragem: +0,3 a +1,8). Pequena, mas consistente.
- **EuroLLM** não coube com folga na placa (7,0 de 8,2 GB), ficou cinco vezes mais lento e errou um em cada quatro termos de glossário.
- **As falhas que sobram nas regras são todas de marcador de tag** (4 em 100 nos dois melhores). A causa está na etapa A2. No desenho, essas chaves ficam vazias e o app mostra inglês.
- **Com mascaramento, nenhuma tag teve o identificador traduzido.** No PoC 1, sem mascarar, eram 38%.
- **Interface:** minha verificação de placeholders deu 4 falsos positivos por motor (`one {hour}` virou `one {hora}`, que está certo). A tabela usa a contagem refeita com uma comparação que entende ICU. O validador de verdade precisa de um analisador de ICU, não de expressão regular.

### Limiares do plano

| Limiar da etapa A | Qwen | Gemma |
|---|---|---|
| Glossário ≥ 95% | passa (96,5%) | passa (100%) |
| Placeholders 100% depois das novas tentativas | **falha** (49 de 50: traduziu `{coin}` para `{moeda}`) | passa (50 de 50) |
| Dados e números iguais | passa nas regras | passa nas regras; **falha na interface** (2 de 50) |
| Todas as verificações, regras | 96% | 96% |
| Correção como regra | não medida | não medida |

As duas falhas do Gemma na interface: escreveu `1d20` onde a fonte diz `d20`, e numa string **recusou a tarefa** ("Não tenho a capacidade de navegar…") em vez de traduzir. As duas foram barradas pelo validador.

### O que dá para ver num exemplo

Magia *Grease*, mesma fonte:

```text
REF : … ou é considerada {@condition prone||caída}.
QWEN: … ou cair {@condition prone||prone}.      (não traduziu o termo; perdeu a quebra de parágrafo)
GEMM: … ou cair {@condition prone||caído}.
```

O Qwen deixou "prone" em inglês 4 vezes no conjunto; o glossário pegou. O Qwen também traduziu *round* como "volta" na interface, onde o projeto usa "rodada": termo que falta no glossário.

### Limites desta etapa

- chrF mede semelhança de letras com a referência, não correção. Uma tradução boa e diferente da referência pontua baixo.
- A referência é o pt do 5.1, de outra origem (Foundry VTT Brasil); o texto que falta traduzir é o do 5.2, mais carregado de tags.
- Uma execução por motor, temperatura 0,2: não medi variação entre execuções.
- O glossário foi escrito por mim a partir da frequência dos termos no pt do 5.1. Precisa da revisão da Rebeca.

## PoC 2, etapa A2 — Por que falha, e o que conserta

Mesmo conjunto de teste da etapa A (100 regras e 50 de interface, SRD 5.1). Script: [`scripts/poc2b-bench.mjs`](../scripts/poc2b-bench.mjs); comparação: [`scripts/poc2b-analyze.mjs`](../scripts/poc2b-analyze.mjs). Uma execução por combinação, temperatura 0,2: diferenças de 1 ou 2 strings estão dentro do ruído.

### Causa das falhas de marcador (lida nas saídas salvas da etapa A)

Das 8 falhas (4 por motor), 7 segmentos distintos:

| Causa | Casos | Exemplo |
|---|---:|---|
| **Marcador a mais:** o modelo imita o padrão e marca também outra ocorrência do mesmo termo, ou um nome de magia que a fonte não marcou | 7 de 8 | `speak-with-plants`: a fonte marca "restrained" uma vez; a saída traz `<t0>` duas vezes. `arcane-lock`: fonte sem marcador; saída com `<t0>bater</t0>` |
| **Marcador a menos:** o modelo reescreveu a frase e o termo marcado sumiu | 1 de 8 | `major-image`: "<t0>deafen</t0> a creature" virou "deixar uma criatura surda" |

Nenhuma falha veio do formato do identificador (`<t0>`): os números nunca foram trocados nem os marcadores quebrados no meio. Testar identificadores mais curtos não mudaria esse quadro; não foi testado.

**Gemma e Qwen falham nos mesmos segmentos?** Não. Só 1 dos 7 é comum (`speak-with-plants`). O problema não é de um texto "impossível"; é um deslize que cada modelo comete em lugares diferentes.

### O que foi testado

| Variante | O que muda |
|---|---|
| base | A etapa A: mesma pergunta repetida até 2 vezes quando falha |
| v2 | Regra no prompt contra marcador a mais e a menos; nova tentativa **com o erro descrito**; **conserto determinístico** (tira marcadores que a fonte não tinha e repetições do mesmo marcador; só remove invólucro, nunca texto); ICU comparado pela árvore da mensagem |
| v3 | v2 + dados, CDs e medidas já convertidas trocados por marcadores opacos antes do modelo |

### Resultado nas 100 regras

| | Gemma base | Gemma v2 | Gemma v3 | Qwen base | Qwen v2 | Qwen v3 |
|---|---:|---:|---:|---:|---:|---:|
| Válida na 1ª tentativa, bruta | 94 | 97 | 94 | 95 | 96 | 95 |
| Válida na 1ª tentativa, com conserto | — | 99 | 94 | — | 100 | 99 |
| Válida ao final | 96 | 99 | 98 | 96 | 100 | 99 |
| Glossário | 100% | 100% | 99,5% | 96,5% | 97,5% | 96,5% |
| chrF | 72,2 | 72,0 | 70,1 | 71,2 | 71,0 | 70,7 |

**Interface (50):** com a comparação por árvore, os 3 a 4 falsos positivos por motor sumiram. Sobram as falhas reais, todas barradas: Gemma 2 (as mesmas da etapa A, que 2 novas tentativas não resolveram), Qwen 1 (`{coin}` traduzido, também nas 3 tentativas).

### Leitura

- **O conserto determinístico resolve quase tudo:** 6 das 7 causas "marcador a mais" somem sem nova chamada ao modelo. O que ele faz é registrado por segmento.
- **Nova tentativa com o mesmo modelo rende pouco.** Na etapa A, repetir a pergunta recuperou 2 de 6 (Gemma) e 1 de 5 (Qwen). `major-image` falhou igual nas 3 tentativas do Gemma, com ou sem o erro descrito.
- **Segundo motor rende mais que repetir.** Na base, o segundo motor entregaria 3 das 4 falhas do primeiro (99 de 100). Na v2, o Qwen entrega o único que o Gemma não entrega (100 de 100). Isso é cruzamento das execuções salvas; a troca de motor em si não foi executada, e os dois modelos não cabem juntos na placa (4,2 + 6,4 GB), então é uma segunda passada.
- **Mascarar mais não ajudou (v3).** Nas regras do 5.1 já não havia erro de número nem de dado para corrigir (0 em 100 nas três variantes), então a proteção extra não tinha o que ganhar aqui. O custo medido é pequeno: tirando as duas saídas que não eram tradução (seção seguinte), o chrF do Gemma cai 0,8 ponto (intervalo de 95%: −1,4 a −0,3) e o do Qwen 0,3 (−1,0 a +0,3, sem diferença). Lendo as saídas, aparecem frases menos naturais ("4d6 dano ígneo" em vez de "4d6 pontos de dano ígneo"; "cilindro de raio 3 metros"), e cada marcador opaco a mais é mais um que pode se perder sem conserto possível (Gemma: 2 falhas assim; Qwen: 1). **Decisão de desenho:** não mascarar números soltos nem medidas; continuar convertendo a medida por código e conferindo o número depois. Dados e CDs do SRD 5.2 já vêm dentro de tags (`{@dice}`, `{@dc}`, `{@damage}`) e já viram marcador opaco. Rever se a etapa B0 mostrar erro de número.
- **Segundo motor na v3:** os dois juntos também entregam 100 de 100.
- **A regra nova no prompt e a nova tentativa com erro descrito não mudaram o chrF** (Gemma −0,2, intervalo −0,6 a +0,2).

### Falha de segurança encontrada: o validador aceitou lixo

Na v3 do Gemma, em 2 segmentos (`speak-with-plants`, `maze`) o modelo **traduziu a minha mensagem de erro** em vez do texto ("Essa resposta é inválida (marcadores). Os marcadores permitidos são…"). Como a mensagem listava os marcadores, a saída tinha todos, e **passou em todas as verificações**. Sem leitura humana, isso entraria como rascunho válido.

O que isso muda:

1. A mensagem de nova tentativa não pode conter os marcadores escritos por extenso.
2. O validador ganha verificação de **tamanho** (essas duas saídas tinham 22% e 44% do tamanho da fonte; todas as traduções boas ficaram entre 96% e 121%) e de **eco de instrução**.
3. Vira teste de regressão.

Procurei o mesmo defeito nas outras execuções com essas duas verificações: não apareceu. É também o melhor argumento medido até aqui para manter a revisão humana antes de publicar.

### Testes de regressão (plano; cada falha observada vira um caso)

| Caso | Verificação que tem de barrar ou consertar |
|---|---|
| Identificador de tag traduzido (`{@condition Encantado|XPHB}`, PoC 1) | Teste de paridade de tags que já existe |
| Tag inventada (`{@saving throw}`, PoC 3) | Idem |
| Marcador repetido, marcador de número inexistente | Conserto, depois validação |
| Marcador perdido (`major-image`) | Barrar; segundo motor; senão chave vazia |
| Marcador opaco perdido ou sem fechar (`wall-of-ice`, `demiplane`, v3) | Barrar; nunca consertar |
| `{coin}` traduzido para `{moeda}` | Árvore ICU |
| `one {hour}` → `one {hora}` (correto) | Árvore ICU **não** pode barrar |
| `d20` virou `1d20` | Paridade de dados |
| Recusa do modelo ("Não tenho a capacidade…") | Números, tamanho e eco de instrução |
| Mensagem de erro traduzida no lugar do texto | Tamanho e eco de instrução |
| Unidade convertida duas vezes ou não convertida | Conversão refeita a partir da fonte |
| JSON reordenado, tradução humana sobrescrita (PoC 3) | Teste do gravador: só chave vazia, mesma ordem |

Os testes do projeto que já conferem tags e chaves (`content/dnd5e/content.unit.test.ts`, `src/frontend/messages.unit.test.ts`) são reaproveitados, não duplicados. Para o ICU, `@formatjs/icu-messageformat-parser` **já está instalado** no projeto como dependência do `next-intl`; o analisador pequeno do script do PoC serve só ao experimento. (O relatório anterior dizia que não havia analisador de ICU instalado; estava errado, eu tinha olhado numa pasta sem `node_modules`.)

### Achados fora do validador (vistos ao ler saídas; não contados)

- Palavra deixada em inglês: "sentience" (`speak-with-plants`). Nenhuma verificação automática pega.
- Nome de magia traduzido ao pé da letra: *knock* virou "bater". No SRD 5.2 os nomes vêm em tags (`{@spell …}`), então o código pode pôr o nome em português já aprovado em vez de deixar o modelo inventar.
- Português fraco: "dura durante a duração", "Você banir".

### Limites

- Conjunto de ajuste e de teste são o mesmo (as 100 regras do 5.1): os ganhos da v2 podem estar um pouco inflados. O conjunto da etapa B não foi tocado.
- O 5.1 tem poucas tags por texto; o 5.2 tem muitas mais. A taxa de falha de marcador no 5.2 pode ser maior. Só a etapa B0 mostra.

## O que ficou instalado

Nada foi instalado no sistema. Ficaram dois itens em disco, úteis para o PoC 2:

```bash
rm -rf ~/l10n-poc
```

```bash
docker rmi ghcr.io/ggml-org/llama.cpp:server-cuda
```

O primeiro apaga os três modelos (cerca de 16 GB) e as saídas; o segundo, a imagem do servidor (7,1 GB). O contêiner já foi parado e removido, e a pasta temporária do PoC 3 foi apagada.

## Para repetir

```bash
docker run -d --name l10n-poc --gpus all -p 127.0.0.1:8080:8080 -v ~/l10n-poc/models:/models:ro ghcr.io/ggml-org/llama.cpp:server-cuda -m /models/Qwen3.5-9B-Q4_K_M.gguf -ngl 99 -c 16384 -np 4 --host 0.0.0.0 --port 8080 --reasoning-budget 0
```

```bash
node docs/discovery/localization-infrastructure/scripts/poc1-bench.mjs --parallel 4 --out ~/l10n-poc/work/run-p4.json
```

```bash
docker rm -f l10n-poc
```
