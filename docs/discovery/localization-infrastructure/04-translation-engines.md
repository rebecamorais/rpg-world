# 04. Motores de tradução automática (MT) para o RPGWorld

Data da pesquisa: 2026-11-27. Escopo: só pesquisa; nada foi baixado, instalado ou enviado. Verificações locais somente leitura: `nvidia-smi` (RTX 5070 Laptop, 8151 MiB), `nproc` (24), `free -g` (15 GB totais no WSL, ~8 GB disponíveis no momento da checagem), `which ollama` (não instalado), `docker` (presente em `/usr/bin/docker`).

Convenção de rótulos usados neste documento:

- **MEDIDO (fonte)**: número ou fato publicado por uma fonte citada (model card, paper, texto de licença). Vale "medido por quem publicou", não "reproduzido por nós".
- **ESTIMADO**: conta feita aqui, com a aritmética explícita.
- **não verificado**: não consegui confirmar numa fonte primária nesta sessão.

## 0. Resumo executivo

1. **Licenças eliminam vários favoritos de benchmark.** NLLB-200 (CC-BY-NC-4.0), Tower/Tower+ (CC-BY-NC), Aya Expanse (CC-BY-NC) e Hunyuan-MT/HY-MT1.5 (licença própria que exclui UE, Reino Unido e Coreia do Sul e proíbe usar as saídas para melhorar outros modelos) ficam fora. TranslateGemma fica em "revisão jurídica antes de usar" (Gemma Terms of Use, não OSI).
2. **Candidatos limpos e que cabem em 8 GB de VRAM** (pesos quantizados): Qwen3.5-9B (Apache-2.0), Gemma 4 E4B (Apache-2.0), Seed-X-PPO-7B (OpenMDW-1.0), Ministral 3 8B (Apache-2.0), EuroLLM-9B-Instruct (Apache-2.0), OPUS-MT tc-big en-pt (CC-BY-4.0, só CPU/GPU leve) e MADLAD-400 3B (Apache-2.0).
3. **Não há benchmark público direto de en→pt-BR para a maioria deles**. A decisão final precisa do benchmark da seção 7, rodado com o conteúdo real do repositório. A recomendação abaixo é uma hipótese de partida, não um veredito.
4. **Arquitetura recomendada: híbrida.** Memória de tradução (TM) para repetições e para reaproveitar o pt do SRD 5.1 no 5.2, LLM local com glossário no prompt, validadores determinísticos (ICU, dados, tags, glossário) com repetição automática, e revisão humana obrigatória para texto mecanicamente sensível.
5. **Tempo/energia (ESTIMADO, seção 8):** ~1 h (4 slots paralelos) a ~2,5 h (1 fluxo) para 158k palavras num modelo 7-9B em Q4, ~0,2 a 0,4 kWh por idioma. Depende de a GPU não estourar a VRAM e de desligar o "thinking" do Qwen3.5.
6. **Claude Code** pode ser um fluxo opcional operado pela desenvolvedora (revisão e correção interativas), não um backend. Os termos citados na seção 6 pedem API key para produtos e serviços.

## 1. Tabela comparativa

Legenda de licença de pesos: OK = uso comercial permitido sem restrição relevante para o projeto; COND = permitido com condições que exigem leitura/revisão; NÃO = inadequado.

| Candidato                              | Licença do software                                     | Licença dos pesos (nome exato)                                                               | Pesos para o projeto?                                           | pt-BR / es / sv                                                                 | Cabe em 8 GB VRAM (Q4)                                    | Glossário/placeholders                                             | API OpenAI-compat           | Evidência en→pt                                                                      |
| -------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------ |
| LibreTranslate                         | AGPL-3.0                                                | usa pacotes Argos (licença por pacote: não verificado)                                       | COND                                                            | Argos lista pt, pt-BR, es, sv                                                   | CPU/GPU leve                                              | sem glossário documentado (README); HTML suportado: não verificado | API própria (não OpenAI)    | nenhuma própria                                                                      |
| Argos Translate                        | MIT ou CC0 (dupla)                                      | por pacote: não verificado                                                                   | COND                                                            | pt, pt-BR, es, sv listados                                                      | sim, pequeno                                              | sem glossário documentado                                          | não (lib Python)            | nenhuma própria                                                                      |
| CTranslate2 (runtime)                  | MIT                                                     | n/a                                                                                          | n/a                                                             | n/a                                                                             | n/a                                                       | `target_prefix` etc. (não verificado nesta sessão)                 | não                         | n/a                                                                                  |
| OPUS-MT tc-big en-pt (Marian)          | MIT (ferramentas, não verificado) / CC-BY-4.0 nos pesos | **cc-by-4.0**                                                                                | OK                                                              | alvo `>>pob<<` e `>>por<<`; es e sv são modelos separados                       | sim (0,2B)                                                | sem glossário nativo; mascarar placeholders                        | não (via CT2/Transformers)  | chrF 0,717 / BLEU 50,4 no flores101-devtest eng-por (MEDIDO, model card)             |
| MADLAD-400 (3B/7B/10B)                 | Apache-2.0 (card)                                       | **Apache 2.0**                                                                               | OK                                                              | tag `<2pt>`; distinção pt-BR/pt-PT: não verificado                              | 3B sim; 10B não                                           | sem mecanismo nativo                                               | não                         | card diz "não avaliado para produção"                                                |
| NLLB-200                               | CC-BY-NC (card)                                         | **cc-by-nc-4.0**                                                                             | **NÃO**                                                         | sim                                                                             | sim                                                       | n/a                                                                | n/a                         | n/a                                                                                  |
| Qwen3.5 (9B, 4B)                       | Apache-2.0                                              | **Apache-2.0**                                                                               | OK                                                              | 201 línguas/dialetos; pt, es, sv não nomeados no card                           | 9B em Q4 ~6,2 a 6,6 GB (fontes terceiras, não verificado) | prompt; JSON/GBNF via llama.cpp                                    | sim via llama-server/Ollama | WMT24++ XCOMET-XXL 72,6 (55 idiomas, subset difícil, MEDIDO pela Qwen)               |
| Gemma 4 (E2B, E4B, 12B?, 26B A4B, 31B) | Apache-2.0                                              | **Apache 2.0**                                                                               | OK                                                              | 35+ idiomas "out of the box", 140+ no pré-treino; pt/es/sv não nomeados no card | E4B sim (8B com embeddings); 26B/31B não                  | prompt                                                             | sim                         | sem benchmark de tradução no card                                                    |
| TranslateGemma (4B/12B/27B)            | n/a                                                     | tag **"gemma"** (Gemma Terms of Use)                                                         | COND                                                            | 55 idiomas; pt-BR e sv não confirmados no card                                  | 4B sim; 12B apertado; 27B não                             | só src/tgt lang no template; sem glossário                         | via llama.cpp/Ollama        | MetricX WMT24++: 4B 5,32 / 12B 3,60 / 27B 3,09 (MEDIDO, card; menor é melhor)        |
| Ministral 3 (3B/8B/14B)                | Apache-2.0                                              | **Apache 2.0**                                                                               | OK                                                              | não verificado para pt/es/sv                                                    | 8B sim                                                    | prompt                                                             | sim                         | nenhuma encontrada                                                                   |
| Llama (3.x)                            | n/a                                                     | Llama Community License (não verificado nesta sessão)                                        | COND                                                            | não verificado                                                                  | 8B sim                                                    | prompt                                                             | sim                         | nenhuma                                                                              |
| Phi (mini)                             | n/a                                                     | não verificado                                                                               | não verificado                                                  | fraco em multilíngue (não verificado)                                           | sim                                                       | prompt                                                             | sim                         | nenhuma                                                                              |
| Aya Expanse 8B                         | n/a                                                     | **cc-by-nc-4.0** + Acceptable Use Policy                                                     | **NÃO**                                                         | 23 idiomas incl. pt, es; **sv não listado**                                     | sim                                                       | prompt                                                             | sim                         | n/a                                                                                  |
| Tower / Tower+ (9B)                    | n/a                                                     | **CC-BY-NC-4.0** (card; tag `cc-by-nc-sa-4.0` na mesma página)                               | **NÃO**                                                         | 22 idiomas incl. pt-BR, es-ES/LatAm, sv                                         | 9B Q4 sim                                                 | prompt (IF-MT avalia glossário)                                    | via vLLM/llama.cpp          | WMT24++ xCOMET-xxl 84,38 (24 idiomas, MEDIDO no paper)                               |
| EuroLLM-9B-Instruct                    | n/a                                                     | **Apache License 2.0**                                                                       | OK                                                              | pt, es, sv listados                                                             | 9B Q4 sim                                                 | prompt                                                             | sim                         | sem resultados de tradução no card                                                   |
| Seed-X-PPO-7B                          | n/a                                                     | **OpenMDW License Agreement, version 1.0**                                                   | OK (texto permissivo)                                           | pt, es, sv na lista de 28                                                       | 7B Q4 sim (há AWQ/GPTQ/GGUF de terceiros)                 | prompt livre; sem template de glossário                            | via vLLM                    | COMET 94,60 EN⇒XX FLORES-200 (média de idiomas); humano EN⇒pt 3,88/4 (MEDIDO, paper) |
| Hunyuan-MT-7B / HY-MT1.5-7B            | n/a                                                     | **TENCENT HUNYUAN COMMUNITY LICENSE AGREEMENT** / **TENCENT HY COMMUNITY LICENSE AGREEMENT** | **NÃO** (Território exclui UE, UK, Coreia do Sul; §5(b) saídas) | 33 idiomas; pt e es sim; **sv não listado**                                     | 7B sim                                                    | template nativo de terminologia, contexto e tags                   | via vLLM                    | 1º em 30 de 31 categorias no WMT25 (alegação do card)                                |

## 2. O que importa na hora de escolher (critérios do projeto)

- **Mecânica do jogo exige precisão**: "salvaguarda", "espaço de magia", "ação bônus", "vantagem". As referências aprovadas do repositório usam, por exemplo, "salvaguarda de Destreza" e "espaço de magia de 4º círculo" (spell level = "círculo", character level = "nível"), "dano ígneo" para fire, e convertem pés em metros ("20-foot-radius sphere" vira "esfera com raio de 6 metros"; "5 feet" vira "1,5 metro"). Um motor que não aceita glossário precisa de pós-edição ou de uma etapa de verificação.
- **Mistura de dois tipos de texto**: UI curta com ICU/rich tags (1.652 chaves e ~8,7k palavras em `messages/en.json`, contagem local) e SRD longo (~150k palavras nos `content/dnd5e/srd-*/i18n/en/*.json`, contagem local). A massa de palavras está no SRD.
- **Cobertura das referências é desigual (contagem local)**: SRD 5.1 tem pt em 733/917 strings de magias e 494/675 de classes; SRD 5.2 tem pt em só 313/999 de magias e 227/740 de classes. `messages/es.json` e `messages/sv.json` não têm conteúdo nesta worktree (0 strings contadas). Ou seja, o "pt aprovado" serve de referência só onde existe e onde não está vazio; o resto é tradução nova.
- **Formato**: o SRD usa tags do 5etools (`{@damage 2d6}`, `{@condition Paralyzed|XPHB}`, `{@variantrule Bonus Action|XPHB}`), bullets "•" e quebras de linha `\n`. Isso precisa de verificação de paridade.

## 3. Seções por candidato

### 3.1 LibreTranslate

- **Software**: GNU AGPL-3.0 (README no GitHub). Usar como serviço interno de desenvolvimento não obriga nada; se alguém o modificar e expor em rede, a AGPL exige abrir o código dessa modificação.
- **Motor**: Argos Translate (README).
- **Idiomas**: depende dos pacotes Argos; Argos lista pt, pt-BR, es, sv.
- **Qualidade en→pt-BR**: nenhuma evidência própria encontrada. É um NMT genérico, sem noção de domínio RPG.
- **Contexto, glossário, consistência**: README não menciona glossário nem contexto; o suporte a HTML não foi confirmado. Consistência vem só do determinismo do modelo.
- **Desempenho**: leve em CPU; sem números citados.
- **API**: própria do LibreTranslate (não OpenAI-compatível). Docker e `docker-compose.cuda.yml` presentes no repositório.
- **Integração**: fácil de subir; difícil de impor glossário e proteger ICU.
- **Veredito**: não recomendado como motor principal. Útil só como "linha de base barata" no benchmark.

### 3.2 Argos Translate

- **Software**: "dual licensed under either the MIT License or Creative Commons CC0" (README).
- **Motor**: OpenNMT/CTranslate2; CPU por padrão, GPU opcional (`ARGOS_DEVICE_TYPE`).
- **Idiomas**: pt, pt (Brasil), es, sv listados.
- **Licença dos pacotes de modelo**: não verificado. Precisa ser conferida pacote a pacote antes de qualquer uso.
- **Glossário**: não documentado. **Manutenção/versão atual**: não verificado.
- **Veredito**: baseline opcional; mesmo problema de glossário do LibreTranslate.

### 3.3 CTranslate2

- **Software**: MIT (README).
- **Famílias suportadas**: Transformer base/big, M2M-100, NLLB, MADLAD-400, T5, Whisper, e decoder-only (Llama, Mistral, Gemma, Qwen2, entre outros). A página lista Qwen2, não Qwen3/3.5, e não lista Gemma 3/4 além de "Gemma" e T5Gemma/T5Gemma2. Marian (OPUS-MT) tem conversor mas não aparece como família na lista.
- **Quantização**: FP16, BF16, INT16, INT8, AWQ (INT4).
- **Desempenho (MEDIDO, README, modelo WMT14 do OpenNMT-py, CT2 3.6.0)**: CPU 658,8 tokens/s (INT8: 860,2); GPU A10G com CUDA 11: 6.634,7 tokens/s (FP16: 10.990,7). São números de um modelo pequeno em outra GPU; não transferem para LLMs de 7B.
- **Blackwell/CUDA 12.8**: README não menciona; precisa ser confirmado antes de depender da RTX 5070 (não verificado).
- **Papel no projeto**: runtime para OPUS-MT e MADLAD-400 em CPU/GPU leve. Não substitui llama.cpp para LLMs modernos.

### 3.4 OPUS-MT / MarianMT (incl. Tatoeba "big")

- **Pesos**: `Helsinki-NLP/opus-mt-tc-big-en-pt` está em **cc-by-4.0** (model card). 0,2B parâmetros.
- **pt-BR vs pt-PT**: o modelo multi-destino exige token inicial `>>id<<`; os rótulos válidos são `>>pob<<` e `>>por<<`. O card não explica qual é qual; `pob` é o código ISO 639-3 usual para português do Brasil, mas o card dá um aviso de metadado inválido com `pt_br`. **Distingue sim, mas é preciso testar se `>>pob<<` realmente produz pt-BR** (não verificado).
- **Qualidade (MEDIDO, card)**: eng-por tatoeba-test-v2021-08-07: chrF 0,69320, BLEU 49,6; flores101-devtest: chrF 0,71673, BLEU 50,4. Dados de treino: OPUS (`opusTCv20210807+bt`). Frases curtas dominam o treino: espere queda em parágrafos de regras e em jargão de RPG.
- **Contexto**: nível de sentença; não vê parágrafos nem glossário.
- **Glossário/placeholders**: sem mecanismo nativo. Seria preciso mascarar `{count}`, `<bold>`, dados e tags `{@...}` com marcadores e restaurar depois, e checar paridade.
- **Desempenho**: 0,2B roda muito rápido em CPU ou GPU. ESTIMADO: minutos para 158k palavras (seção 8).
- **API**: nenhuma pronta; via CTranslate2/Transformers em script próprio.
- **es e sv**: modelos separados (não verificado qual tc-big existe para cada).
- **Veredito**: bom como **plano B barato para strings curtas de UI**, ruim para SRD longo e sem glossário.

### 3.5 MADLAD-400

- **Pesos**: **Apache 2.0** (model card). Tamanhos: 3B (32 camadas), 7,2B (48), 10,7B (32). T5 encoder-decoder, 419 idiomas na página.
- **Idiomas**: tag `<2pt>` aparece no exemplo; o card não menciona es/sv nem pt-BR especificamente.
- **Qualidade**: o card diz que não é pensado para domínios específicos "out-of-the-box", foca em pesquisa, "não avaliado para produção". Sem número de en→pt coletado.
- **VRAM**: 10B tem ~11B parâmetros em safetensors; em INT8 passa de 8 GB de VRAM. 3B em INT8 (ESTIMADO ~3 GB) cabe.
- **Suporte**: CTranslate2 lista MADLAD-400.
- **Glossário**: nenhum nativo.
- **Veredito**: candidato de segunda linha; sem vantagem clara sobre LLMs Apache-2.0 modernos para o nosso caso.

### 3.6 NLLB-200

- **Pesos**: **cc-by-nc-4.0** (model card). O card também diz que é "a research model and is not released for production deployment".
- **Veredito**: **desqualificado por licença** (não comercial). Mesmo que hoje o projeto seja gratuito, a exigência é manter a porta aberta para funcionalidades pagas.

### 3.7 Ollama

- **Software**: MIT (repositório).
- **Concorrência (MEDIDO, docs FAQ)**: `OLLAMA_NUM_PARALLEL` (por padrão 1 fora do MLX), `OLLAMA_MAX_QUEUE` (512), `OLLAMA_MAX_LOADED_MODELS`, `OLLAMA_KEEP_ALIVE` (5 min), `OLLAMA_KV_CACHE_TYPE` (padrão f16), `OLLAMA_FLASH_ATTENTION`.
- **Armadilha importante**: o contexto padrão é **4096 tokens** (`OLLAMA_CONTEXT_LENGTH` ou `num_ctx`). Parágrafos longos mais prompt com glossário podem ser truncados silenciosamente se não aumentar. Além disso, paralelismo multiplica o contexto: "a 2K context with 4 parallel requests becomes 8K and uses more memory" (docs).
- **API**: endpoint REST nativo em `/api/chat` na porta 11434 (docs). Compatibilidade com OpenAI e saídas estruturadas: a página do repositório não confirma; sei por conhecimento prévio que existe `/v1`, mas **não verificado nesta sessão**.
- **Estado local**: `ollama` não está instalado; Docker está.
- **Veredito**: boa porta de entrada para testar modelos; para lote reprodutível, prefira llama.cpp direto (controle de commit, quant, flags).

### 3.8 llama.cpp

- **Software**: MIT (repositório).
- **API**: `llama-server` oferece servidor compatível com OpenAI (README principal). Gramáticas GBNF existem (link na README). Detalhes de `--parallel`, `--jinja`, `response_format`: a página de documentação do servidor retornou 503 nesta sessão; **não verificado agora**.
- **Blackwell (RTX 50)**: não confirmado nesta sessão; exigiria build CUDA compatível com sm_120 (CUDA 12.8+, não verificado).
- **Uso recomendado**: `llama-server -m <gguf> -ngl 99 -c <ctx> -np <slots>`; `llama-bench` para medir pp/tg.
- **Restrição decodificada**: GBNF pode garantir estrutura (JSON com chaves fixas, presença dos marcadores de placeholder), mas **não** garante "se a fonte tem _saving throw_, o alvo contém _salvaguarda_". Isso é verificação pós-geração.
- **Veredito**: runtime principal recomendado para qualquer LLM da lista.

### 3.9 Qwen (geração atual)

- **Estado**: Qwen3.5 small dense (0,8B, 2B, 4B, 9B) lançados em 2026-03-02, Apache-2.0 (busca; secundária). O card do 9B confirma Apache-2.0.
- **Qwen3.5-9B (MEDIDO, model card)**: 201 idiomas e dialetos; contexto nativo 262.144 tokens; arquitetura híbrida (Gated DeltaNet + Gated Attention, 32 camadas, FFN denso 12288); **thinking ligado por padrão**; desligar com `chat_template_kwargs: {"enable_thinking": False}`. Benchmarks da própria Qwen: WMT24++ (55 idiomas, subconjunto difícil, XCOMET-XXL) **72,6** (GPT-OSS-120B 74,4; Qwen3-30B-A3B-Thinking-2507 69,3); MMMLU 81,2; MMLU-ProX (29 idiomas) 76,3; INCLUDE 75,6. Não há número separado para en→pt-BR/es/sv. Não comparáveis com os do Tower+ (subconjuntos e métricas diferentes).
- **VRAM**: ~6,2 GB em Q4_K_M (blog terceiro, não verificado) e 6,6 GB de 8 GB (site terceiro, método desconhecido). Sobram ~1,5 GB para KV cache e CUDA; contexto de 8k-16k é viável, 4 slots paralelos de 4k provavelmente também (ESTIMADO).
- **Velocidade reportada por terceiro**: ~39 tok/s em RTX 5070 Laptop com Q4_K_M (llmrun.dev; método não declarado). Coerente com nossa conta (seção 8). Tratar como ESTIMADO.
- **Glossário/consistência**: só por prompt; o ganho está no contexto longo, que permite colocar o glossário e exemplos do próprio SRD (few-shot com pares aprovados) em cada chamada.
- **Risco**: se o thinking não for desligado, os tokens e o tempo crescem de 3 a 10 vezes (ESTIMADO). Amostragem recomendada pela Qwen é para modos de raciocínio; para tradução usar temperatura baixa e comparar com greedy no benchmark.
- **Qwen3 (geração anterior)**: 4B e 8B Apache-2.0; superados pelo 3.5 segundo a própria Qwen/Artificial Analysis (secundária).

### 3.10 Gemma 4 e TranslateGemma

**Gemma 4** (lançado 2026-04-02; blog Google, model card HF):

- **Licença**: Apache 2.0 (blog Google e HF; blog Open Source do Google confirma "first in the Gemmaverse" sob Apache 2.0).
- **Tamanhos**: E2B, E4B, 26B MoE (~3,8B ativos), 31B densa; o model card citado por busca ainda lista um 12B (fonte conflitante; não verificado).
- **E4B**: "4.5B effective (8B with embeddings)", contexto 128K, thinking configurável (`<|think|>` no system prompt), MMMLU 76,6%. Sem benchmark WMT/FLORES no card.
- **Idiomas**: "Out-of-the-box support for 35+ languages, pre-trained on 140+ languages"; pt/es/sv não nomeados.
- **VRAM**: não informado para 4/8 bits; as "8B com embeddings" sugerem cerca de 5 GB em Q4 (ESTIMADO: 8B x ~4,8 bits / 8 = 4,8 GB; embeddings por camada podem ficar fora da GPU, mas não verificado).
- **Veredito**: candidato forte por licença, tamanho e porque a família Gemma costuma ter boa cobertura de línguas europeias (alegação não verificada para pt-BR/sv). Precisa de benchmark.

**TranslateGemma** (lançado em jan/2026; blog Google, arXiv 2601.09012, model card HF):

- **Licença**: tag **"gemma"** no HF com link para os Gemma Terms of Use. Um guia terceiro afirma "CC-BY-NC-4.0"; **isso contradiz o card oficial** e foi descartado. Os termos em `gemma.ai/resources/terms` (redirecionado de `ai.google.dev/gemma/terms`) definem "Model Derivatives" incluindo modelos treinados com "synthetic data Outputs by Gemma" (mas "Outputs are not deemed Model Derivatives"), incorporam a Prohibited Use Policy e exigem repassar os termos na redistribuição. Não é Apache nem OSI. A página de termos lista versões "Gemma 1 through TranslateGemma" e remete a outra página para Gemma 4. **Condicional**: pedir parecer à pessoa que cuida de licenciamento.
- **Qualidade (MEDIDO, card)**: MetricX WMT24++ (55 idiomas; menor é melhor) 4B 5,32; 12B 3,60; 27B 3,09. O blog diz que o 12B supera o Gemma 3 27B base e o 4B se aproxima do 12B base. Não consegui extrair a tabela por idioma (en→pt-BR, es, sv) do PDF nesta sessão.
- **Limites**: contexto total de **2K tokens**; template só aceita `source_lang_code`/`target_lang_code` e um bloco de texto; **sem glossário**. 2K tokens é suficiente para a maioria das magias, mas apertado para recursos de classe longos com instruções adicionais.
- **Idiomas**: "55 idiomas"; pt-BR e sv não aparecem no card (WMT24++ inclui `pt_BR` e `sv_SE` segundo meu conhecimento prévio; **não verificado nesta sessão**).
- **VRAM**: 4B (~2,5 GB em Q4, ESTIMADO: 4B x 4,85/8) cabe folgado; 12B (~7,3 GB em Q4_K_M, ESTIMADO) não deixa folga para KV em 8 GB; 27B não cabe.
- **Veredito**: usar como **referência de qualidade** no benchmark e, se a licença for aprovada, como candidato para prosa do SRD (4B/12B).
- **Nota**: existem fine-tunes de terceiros de Gemma 4 E2B/E4B ("translate-gemma-4-sub"); não são do Google e a licença não foi confirmada.

### 3.11 Mistral (modelos pequenos)

- **Ministral 3 (3B/8B/14B)**: Apache 2.0, lançado em 2025-12-02, contexto 256k (docs Mistral via busca). 8B Q4 cabe em 8 GB.
- **Mistral Small 24B**: não cabe em 8 GB; seria lento com offload na RAM (16 GB no WSL). Ignorado.
- **Qualidade de tradução pt/es/sv**: sem evidência encontrada; o modelo entra no benchmark só se sobrar capacidade.

### 3.12 Llama e Phi

- **Llama 3.x 8B**: licença Llama Community (não verificado nesta sessão); o paper do Tower+ diz que a licença do Llama 3 era mais restritiva e levou os autores a escolher Qwen 2.5 e Gemma 2 como base. Sem evidência de tradução pt-BR local. Prioridade baixa.
- **Phi (mini)**: não pesquisei licença nem multilinguismo a fundo (não verificado). Prioridade baixa; modelos Phi costumam ser mais fortes em inglês.

### 3.13 EuroLLM

- **EuroLLM-9B-Instruct**: **Apache License 2.0**, ~9,15B parâmetros, pt, es, sv listados entre 35 idiomas (card). Sem resultados de tradução no card; sequência de pré-treino de 4.096; contexto máximo não declarado. Não achei versão mais nova no card (não verificado fora dele).
- **Papel**: candidato europeu; WMT25 incluiu EuroLLM-9B na lista "constrained" (ranking preliminar por métricas automáticas, secundária).
- **Veredito**: incluir no benchmark; plausível para sv.

### 3.14 Aya (Cohere)

- **Aya Expanse 8B**: **cc-by-nc-4.0** e "requires also adhering to Cohere Lab's Acceptable Use Policy" (card). 23 idiomas listados (inclui pt e es; sueco/sv não consta na lista do card).
- **Veredito**: **desqualificado por licença**.

### 3.15 Tower / Tower+ (Unbabel)

- **Tower+ 9B**: base Gemma 2 9B; contexto 8.192; 22 idiomas incluindo pt-BR, es (Espanha e América Latina) e sv. Licença no card: **CC-BY-NC-4.0** na descrição e tag `cc-by-nc-sa-4.0` (conflito leve; ambos não comerciais). TowerInstruct-7B-v0.1 também CC-BY-NC-4.0 (e base Llama 2).
- **Qualidade (MEDIDO, paper arXiv 2506.17080)**: WMT24++, xCOMET-xxl: Tower+ 9B 86,25 (7 idiomas de alto recurso) / 83,57 (15) / 84,38 (24), contra Gemma-2 9B 81,93 / 75,35 / 76,34. IF-MT avalia seguimento de glossário e formatação.
- **Veredito**: o melhor candidato em papel para "tradução com instruções", mas **desqualificado por licença** para este projeto.

### 3.16 Seed-X (ByteDance)

- **Pesos**: **OpenMDW License Agreement, version 1.0 (OpenMDW-1.0)**. Resumo do texto (leitura do arquivo LICENSE; não é aconselhamento jurídico): uso gratuito, sem restrição sobre uso/modificação/compartilhamento das saídas, redistribuição exige manter o texto e avisos, cláusula de término por litígio de patente, "AS IS".
- **Modelo**: Seed-X-PPO-7B, arquitetura Mistral-7B com vocabulário de 65.269 tokens, recomendado pelos autores sobre o Instruct.
- **Idiomas**: 28, incluindo pt, es, sv (paper, tabela 12).
- **Qualidade (MEDIDO, paper arXiv 2507.13618; feito pelos autores)**: FLORES-200 e WMT-25 médias: BLEURT 76,25 e COMET 90,81; EN⇒XX FLORES: BLEURT 80,34 e COMET 94,60; Google Translator 94,76, Claude-3.5-Sonnet 94,88, GPT-4o 94,20 de COMET EN⇒XX. Sem COMET por idioma para pt. **Avaliação humana EN⇒pt (Seed-X-Challenge, escala 0-4): Seed-X-PPO 3,88**, empatado com Gemini-2.5-Pro e Aya-32B (3,88); Google Translator 3,84; GPT-4o 3,82.
- **Limites**: comprimento máximo de 2.048 tokens, beam search 4 no paper, **sem chat template** (prompt de uma linha com tag de idioma `<pt>` no estilo do card; formato exato de pt não verificado), sem mecanismo de glossário. Variantes AWQ-Int4 e GPTQ-Int8 oficiais no HF; GGUF de terceiros.
- **Veredito**: **desafiante principal para a prosa do SRD** (ser especializado em MT, 7B, licença limpa). Menos controlável em UI com ICU, onde instruções ("não traduza o que está entre chaves") importam.

### 3.17 Hunyuan-MT e HY-MT1.5 (Tencent)

- **Qualidade**: Hunyuan-MT-7B ficou em 1º em 30 das 31 categorias do WMT25 (alegação do card e da imprensa; o paper do WMT25 não foi lido). HY-MT1.5 (2025-12-30, 1,8B e 7B): em FLORES EN⇔XX, 7B XCOMET-XXL 0,9093 / CometKiwi 0,8650; 1,8B 0,8942 / 0,8411; Qwen3-235B-A22B 0,9029 / 0,8586 (MEDIDO, paper arXiv 2512.24092).
- **Mecanismos nativos**: templates de **terminologia** (linha "termo-fonte → termo-alvo"), **contexto** e **tags formatadas** (`<source>`, `<sn></sn>`). Exatamente o que o projeto quer, mas...
- **Licença (texto lido)**: "TENCENT HUNYUAN COMMUNITY LICENSE AGREEMENT" (MT-7B) e "TENCENT HY COMMUNITY LICENSE AGREEMENT" (1.5): Território = "the worldwide territory, excluding the territory of the European Union, United Kingdom and South Korea"; uso fora do Território "is unlicensed and unauthorized"; cláusula MAU > 100 milhões exige licença sob critério da Tencent; §5(b) proíbe usar o modelo ou suas saídas "to improve any other AI model". **Para um app open source com usuários possíveis na UE, isso é um problema.** Suporte a sueco: não listado nos cards de 33 idiomas.
- **Veredito**: **desqualificado**. Pode ser usado só como referência de benchmark interno, se a pessoa responsável pela licença permitir (mesmo assim, o uso fora do Território não é licenciado; a máquina da mantenedora está no Brasil, mas a distribuição do resultado é assunto jurídico).

### 3.18 Outros achados

- **Hy-MT2** (arXiv 2605.22064, sucessor mencionado em busca): não verificado.
- **WMT25 (Kocmi et al., 2025)**: 60 sistemas, avaliação humana ESA; lista de sistemas "constrained" inclui Gemma-3-12B, EuroLLM-9B, TowerPlus-9B, Qwen2.5-7B, NLLB, AyaExpanse-8B; resultados por par de idiomas (en→pt) não extraídos nesta sessão.
- Artigos de blog tipo "melhor LLM para tradução 2026" são SEO e se contradizem; **não** usados como evidência.

## 4. Mecanismos de glossário, placeholders e consistência

| Mecanismo                                                                             | Onde existe                                                                                             | Garantia                                                                  | Limite                                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Glossário no prompt (lista termo-fonte → termo-alvo)                                  | qualquer LLM instruct (Qwen3.5, Gemma 4, EuroLLM, Ministral)                                            | probabilística                                                            | pode ignorar em textos longos; gênero e número em pt (a salvaguarda / as salvaguardas) |
| Template nativo de terminologia                                                       | HY-MT1.5 (licença NÃO)                                                                                  | probabilística, treinada para isso                                        | licença                                                                                |
| Few-shot com pares aprovados do próprio SRD (recuperados da TM)                       | LLMs com contexto longo                                                                                 | melhora consistência                                                      | custa tokens de prompt                                                                 |
| Gramática GBNF / JSON schema                                                          | llama.cpp                                                                                               | **estrutural** (garante chaves JSON, formato)                             | não garante terminologia                                                               |
| Mascaramento de placeholders (`⟦1⟧` no lugar de `{count}`, `<bold>`, `{@damage 2d6}`) | qualquer motor, necessário para NMT                                                                     | determinístico se o motor preserva o marcador                             | NMT às vezes remove ou duplica marcadores; verificar                                   |
| Pós-checagem determinística + nova tentativa                                          | nosso código                                                                                            | **garantia no que é verificável** (ICU, dados, tags, termos obrigatórios) | só pega o que sabemos checar                                                           |
| Restrição lexical em tempo de decodificação                                           | CTranslate2 (não verificado se há restrição de termos obrigatórios; sei de `target_prefix` e supressão) | não verificado                                                            | não verificado                                                                         |
| Memória de tradução (TM)                                                              | nosso código/Weblate                                                                                    | **exata** para repetições                                                 | só cobre o que já foi traduzido                                                        |

Conclusão: nenhum motor open-weight com licença limpa dá glossário **garantido**. A garantia vem da etapa de validação mais nova tentativa, e da revisão humana.

## 5. Análise híbrida

### 5.1 Camadas, da mais barata à mais cara

1. **Memória de tradução (TM) primeiro.** Repetições exatas dentro dos próprios JSON e correspondência exata ou quase exata entre o SRD 5.1 (2014) e o 5.2 (2024), onde o texto é idêntico. O índice do projeto já registra a decisão "reuso do pt 5.1 no 5.2 só com nome idêntico" (FOUNDRY-C); aqui a regra seria análoga para frases. Zero risco de alucinação e zero custo.
2. **NMT (OPUS-MT) para UI curta** (rótulos de 1 a 3 palavras, sem ICU ou com placeholders simples), se o benchmark mostrar que é melhor ou igual ao LLM nesse estrato e mais rápido. Sem glossário: precisa de lista de exceções para os termos RPG.
3. **LLM local (Qwen3.5-9B / Seed-X / Gemma 4)** para texto de regras longo, ICU complexo, rich tags e JSON estruturado, com glossário no prompt e exemplos da TM.
4. **Validadores determinísticos**: bloqueiam qualquer saída com ICU quebrado, dado alterado, tag perdida ou termo de glossário ausente; até 2 tentativas automáticas, depois marcam para humano.
5. **Revisão humana obrigatória** para: qualquer string com mecânica (dano, CD de salvaguarda, duração, alcance, condições, vantagem/desvantagem, recursos de classe), nomes próprios de magias/itens/classes (referência: o pt aprovado já existe para 5.1) e a primeira rodada de cada idioma novo. Um amostral de 10% das strings de UI.

### 5.2 O que cada camada faz bem e mal

| Camada        | Bom                                                          | Ruim                                                                    |
| ------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| TM            | Exata, instantânea, de graça                                 | Só repetições                                                           |
| NMT (OPUS-MT) | Rápido, determinístico, tradução literal previsível          | Sem contexto e sem glossário; qualidade em jargão fraca                 |
| LLM local     | Contexto longo, glossário no prompt, JSON, explicações       | Lento, pode "melhorar" o texto, alucinar ou omitir; 8 GB de VRAM limita |
| Humano        | Pega erro mecânico sutil (ex.: "can't" vs "doesn't have to") | Caro, lento; a mantenedora é uma pessoa                                 |

### 5.3 Idiomas além de pt-BR

Para es e sv não há referências humanas ainda no repositório. O fluxo precisa de um conjunto de ~100-200 strings revisadas por falante de cada idioma (Weblate já é o canal, conforme `docs/INDEX.md`) antes de confiar nas métricas; sem referência, só valem as checagens determinísticas, COMET sem referência e a avaliação humana.

## 6. Claude Code como fluxo opcional, operado pela desenvolvedora

**Fatos verificados (leitura direta, 2026-11-27):**

- **Legal e conformidade (Claude Code docs)**: "Advertised usage limits for Pro, Max, and Ultra plans assume ordinary, individual usage of Claude Code and the Agent SDK." OAuth "is intended exclusively for purchasers of Claude Free, Pro, Max, Ultra, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications." Desenvolvedores que constroem "products or services" (inclui Agent SDK) devem usar autenticação por API key; a Anthropic "does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, Max, or Ultra plan credentials on behalf of their users."
- **Termos de consumidor**: seção 3, item 7: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise." A página não menciona Claude Code, Agent SDK nem limites de uso.
- **Artigo de suporte "Use the Claude Agent SDK with your Claude plan"**: atualização de 2026-10-07: planos Max, Ultra e Team passaram a incluir "monthly API credits" que cobrem API, Managed Agents e Agent SDK/`claude -p` **quando usados com API key de uma organização Console vinculada**; entrar com o plano "não muda nada": Agent SDK e `claude -p` "still draw from your subscription limits". Atualização de 2026-06-15: as mudanças anunciadas sobre uso do Agent SDK foram "paused". Quantias de créditos: a página não informa.

**Leitura prática (interpretação minha; não é parecer jurídico):**

- Uma sessão **interativa** de Claude Code na máquina da mantenedora, com a conta dela, para revisar e corrigir traduções, é o uso previsto ("ordinary, individual usage").
- `claude -p` em script na máquina dela, com a conta dela, o artigo de suporte trata como uso que consome o limite do plano. Há tensão aparente com a cláusula de "script" dos termos de consumidor ("where we otherwise explicitly permit it"); **não verificado** se isso basta. Não montar nada que dependa dessa leitura.
- **Não** usar assinatura como backend não supervisionado, CI, bot do GitHub ou serviço aberto a colaboradores. Para qualquer automação desse tipo o caminho documentado é API key paga (Console).
- Limites de uso do plano para este volume (centenas de milhares de tokens de saída por idioma): **não verificado**; provavelmente estoura em planos baixos se feito de uma vez (ESTIMADO; não medido).
- O SRD é conteúdo público, então privacidade do texto não é o obstáculo; o obstáculo são os termos de uso e os limites.

**Papel sugerido**: depois do passe do LLM local e dos validadores, a desenvolvedora abre uma sessão interativa por lote pequeno (por exemplo, uma classe ou 20 magias) e pede ao Claude Code para: (a) apontar divergências de glossário e de mecânica entre fonte e tradução, (b) propor correções em diff, (c) atualizar o glossário. Ela revisa o diff e commita. Fica fora do caminho crítico e do CI.

## 7. Desenho do benchmark (não executado)

### 7.1 Objetivo e regras

- Comparar 5 a 7 candidatos limpos de licença com **o conteúdo real do repositório**, medindo qualidade, fidelidade mecânica, tempo e recursos, **sem usar autoavaliação de LLM como métrica única**.
- Referências: pt aprovado existente. Só entram itens em que a referência pt **não está vazia**. Ruído conhecido nas referências: texto original entre colchetes, por exemplo `[20-foot-radius sphere]` e `[5 ft.]` em `srd-5.1/i18n/pt/spells.json` (fireball, acid-splash); remover esses trechos antes de calcular chrF/COMET e registrar a limpeza no script.
- Candidatos (lista inicial): Qwen3.5-9B (Q4_K_M e Q5/Q6 se couber), Gemma 4 E4B, Seed-X-PPO-7B, EuroLLM-9B-Instruct, Ministral 3 8B, OPUS-MT tc-big en-pt (+ CTranslate2). Referência de teto (opcional, sujeita a parecer sobre licença): TranslateGemma 4B/12B. Não rodar: NLLB, Tower+, Aya, HY-MT (licença).

### 7.2 Plano de amostragem (itens concretos)

Chaves em `messages/en.json` (notação com ponto) e entradas em `content/dnd5e/srd-5.1/i18n/{en,pt}/*.json` e `srd-5.2/...`. Tamanho total ~600 segmentos, estratificados; as seleções automáticas usam semente fixa.

| Estrato                        | n alvo | Exemplos concretos (verificados no repo)                                                                                                                                                                                                                                                                       | O que testa                                                                    |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| E1 UI curta                    | 60     | `common.save`, `common.saving`, `common.cancel`, `common.back`, `magicSystem.spellSlots` ("Spell slots"), `restChecklist.spellSlotsBack`                                                                                                                                                                       | termos de 1 a 3 palavras, glossário (espaço de magia)                          |
| E2 Placeholders simples        | 40     | `common.passwordMinLength` ("Password must be at least {min} characters."), `common.numberField.range` ("Between {min} and {max}"), `common.numberField.min`                                                                                                                                                   | `{min}`, `{max}` intactos                                                      |
| E3 ICU plural                  | 40     | `characters.spellCount` (`{count, plural, one {# spell} other {# spells}}`), `characters.inventory.add.count`, `resourceEditor.usesCount`, `common.errors.auth_error_signin_too_many_attempts` (plural aninhado em frase), `characters.coins.changedElsewhere` (plural com `#` e `{coin}`)                     | categorias CLDR válidas por idioma, `#` preservado, texto fora do bloco        |
| E4 ICU select                  | 10     | `restChecklist.boxBack` (`{name} returns: {amount, select, all {all} other {{amount}}}`)                                                                                                                                                                                                                       | `select` com chaves `all`/`other` inalteradas                                  |
| E5 Rich tags                   | 20     | `common.typeToConfirm` (`<bold>{text}</bold>`), `login.verifyEmailDescription` (`<bold>{email}</bold>`), `login.unconfirmedHint` (`<magic>...</magic>`)                                                                                                                                                        | tags pareadas, conteúdo traduzido só dentro                                    |
| E6 Magias longas               | 40     | `srd-5.1` `fireball` (description 2 parágrafos + `higherLevel` + `material`), `acid-splash`; magias 5.1 com pt presente selecionadas por script                                                                                                                                                                | dado `8d6`, `1d6`, "círculo", conversão pés→metros, "salvaguarda"              |
| E7 Recursos de classe          | 30     | `srd-5.1` `classes.barbarian.features.unarmored-defense` (pt presente); `rage` tem pt **vazio** em 5.1, então fora da amostra com referência                                                                                                                                                                   | texto com fórmula (`10 + modificador de Destreza + ...`), "Classe de Armadura" |
| E8 Regras de combate/condições | 30     | `srd-5.1/conditions` (só 15/30 com pt; usar só os com pt); `srd-5.2` `conditions/blinded` (nome com pt "Cego"; descrição sem pt: só medir checagens determinísticas, sem chrF)                                                                                                                                 | "advantage/disadvantage", "automatically fail", bullets "•"                    |
| E9 Expressões de dados         | 40     | `srd-5.1/items/acid-vial` (`{@damage 2d6}`), fireball (`8d6`, `1d6`), acid-splash (`1d6`, `2d6`, `3d6`, `4d6`); buscar por regex `\d+d\d+\s*[+-]\s*\d+` ("1d8 + 3" e variantes) no momento da amostragem (não achei um exemplo exato nas buscas desta sessão: **a lista final precisa ser gerada por script**) | paridade de dados e números                                                    |
| E10 Salvaguardas               | 30     | fireball ("dexterity saving throw", "failed save", "half as much damage"), acid-splash, 5.2 `counterspell` e `hold-person` ("Wisdom saving throw ... repeats the save")                                                                                                                                        | "salvaguarda de Destreza", sucesso/falha                                       |
| E11 Tags 5etools               | 30     | 5.2 `hold-person` (`{@condition Paralyzed                                                                                                                                                                                                                                                                      | XPHB}`), `counterspell` (`{@variantrule Bonus Action                           | XPHB}`), `shield` (`{@spell Magic Missile | XPHB}`) | paridade de `{@...}` e conteúdo após o ` | `   |
| E12 Markdown/estrutura         | 20     | descrições com `\n` e bullets "•" (classes 5.1, rage)                                                                                                                                                                                                                                                          | quebras e marcadores                                                           |
| E13 JSON estruturado           | 40     | objeto completo `{name, description, higherLevel, material}` (fireball) e `{name, subclassTitle, features{...}}` (barbarian)                                                                                                                                                                                   | JSON válido, chaves idênticas, só valores traduzidos                           |
| E14 Terminologia RPG           | 60     | glossário derivado das referências: saving throw→salvaguarda; spell slot→espaço de magia; slot level→círculo; bonus action→ação bônus; advantage→vantagem; fire damage→dano ígneo; acid damage→dano ácido; 5 feet→1,5 metro; 20 feet→6 metros                                                                  | taxa de acerto de glossário                                                    |
| E15 Distinções delicadas       | 40     | "slot level" vs "character level" (círculo vs nível) em fireball `higherLevel`; "within range" vs "within 5 feet"; "succeed or fail"; "half as much damage"; "can't" vs "doesn't have to"; "creature" vs "target"; "bonus to the damage roll"                                                                  | erros que mudam regra mas parecem fluentes                                     |

Fontes de verdade: pt de `content/.../pt/*.json` onde não vazio; UI de `messages/pt.json`. Para es/sv não há referência no repositório hoje; rodar só as checagens determinísticas e a avaliação humana por voluntário falante (ver 7.5).

### 7.3 Checagens determinísticas (por segmento, todas automáticas)

1. **Paridade ICU**: parsear fonte e saída com `@formatjs/icu-messageformat-parser`; mesmos argumentos, mesmos tipos (`plural`, `select`, `number`), mesmas chaves de `select`, categorias de plural válidas para o idioma-alvo (pt/es: `one`/`many`/`other`; sv: `one`/`other`), `#` presente onde havia, tags rich pareadas.
2. **Paridade de dados e números**: multiconjunto idêntico de `\d+d\d+(\s*[+-]\s*\d+)?`; demais números idênticos, **exceto** a tabela de conversão de unidades usada nas referências (5 ft→1,5 m, 10 ft→3 m, 20 ft→6 m, 30 ft→9 m, 60 ft→18 m, etc.; 1 mile→1,5 km) e ordinais (3rd→3º). Qualquer outro número alterado é erro crítico.
3. **Paridade de marcação**: mesmas ocorrências de `{@tag ...}` (nome da tag e, quando é referência, o conteúdo após `|`), `<tag>`, bullets "•", contagem de `\n`.
4. **Taxa de acerto de glossário**: para cada ocorrência de termo-fonte do glossário (por lema simples), o alvo contém a forma aprovada (regex tolerante a plural e gênero).
5. **JSON**: parse ok e conjunto de chaves idêntico.
6. **Higiene**: razão de comprimento alvo/fonte entre 0,6 e 1,8; detecção de texto não traduzido (alvo = fonte); detecção de repetição (n-gramas em laço); idioma da saída (detector de idioma); proibição de preâmbulos tipo "Aqui está a tradução".
7. **Regra de segmentação**: respeitar os limites de contexto do motor (TranslateGemma 2K, Seed-X 2.048, Ollama padrão 4.096): segmentos acima do limite são divididos por parágrafo e a divisão registrada.

### 7.4 Métricas automáticas

- **chrF++** via `sacrebleu` (licença do pacote: não verificado; é amplamente usado).
- **COMET com referência**: `Unbabel/wmt22-comet-da`, **Apache-2.0** (verificado), treinado em 94 idiomas (base XLM-R); aviso do card: resultados para pares com idiomas não cobertos são "unreliable" (pt/es/sv estão cobertos pelo XLM-R; não verificado individualmente).
- **COMET sem referência (QE)**: `Unbabel/wmt22-cometkiwi-da` tem licença **cc-by-nc-sa-4.0** (verificado). Uso apenas como diagnóstico interno de benchmark, sem redistribuir pesos nem incorporar ao produto; confirmar com a pessoa que cuida de licenciamento. XCOMET e MetricX: licenças **não verificadas**.
- **Limitação**: COMET e chrF foram calibrados em textos de notícias/geral. Em texto de regras com fórmulas eles subestimam erros mecânicos, então **nunca** substituem as checagens da 7.3 nem a revisão humana.
- Reportar média e intervalo de confiança por bootstrap (1.000 reamostragens) por estrato e por sistema; teste pareado de significância sobre o mesmo conjunto de segmentos.

### 7.5 Avaliação humana cega

- **Quem**: a mantenedora (falante nativa de pt-BR) e, se possível, uma segunda revisora; para es e sv, um voluntário de cada.
- **Material**: 200 segmentos de pt-BR (subamostra estratificada: E3, E5, E6, E7, E8, E10, E15 com peso maior), de cada sistema + a referência humana escondida como "sistema extra" + um controle ruim deliberado (ex.: "saving throw" → "teste de resistência"; "bonus action" → "ação extra"), embaralhados e anonimizados.
- **Protocolo**: duas passagens. (a) MQM simplificado por segmento: marcar erros e severidade (menor = 1, maior = 5, crítico = 25) em categorias: Exatidão mecânica (altera regra), Terminologia/glossário, Omissão/adição, Fluência/gramática, Estilo, Marcação/placeholders. (b) Ranking cego de melhor a pior entre os sistemas para 60 segmentos.
- **Concordância**: 20 segmentos duplicados entre as duas revisoras; reportar Cohen's κ (ou concordância por categoria). Se não houver segunda revisora, repetir 20 segmentos escondidos após 48 h para medir consistência da própria avaliadora.
- **Saída**: penalidade MQM por 100 palavras, taxa de segmentos "utilizáveis com edição leve", e lista de erros críticos.

### 7.6 Medição de velocidade e recursos

- Fixar: versão e commit do llama.cpp, quantização, `-ngl`, `-c`, `-np`, temperatura e semente.
- `llama-bench -m <modelo.gguf> -p 512 -n 128 -ngl 99` para pp512 e tg128; depois a vazão real do pipeline (tokens de saída/s e segmentos/min) num subconjunto de 500 segmentos, com 1 e com 4 slots.
- Registrar potência da GPU com `nvidia-smi --query-gpu=timestamp,power.draw,memory.used,utilization.gpu --format=csv -l 1` e integrar para kWh (só GPU é medida; o resto do sistema é estimado: ~40 a 60 W, ESTIMADO).
- Pico de VRAM e RAM do WSL; ocorrência de OOM; temperatura e redução de clock (laptop).
- Tempo extrapolado para 158k palavras por idioma, com a aritmética da seção 8.

### 7.7 Setup e esboço de comandos (não executar agora)

```bash
# 1) Preparo (host Windows + WSL2): driver NVIDIA com suporte CUDA em WSL; CUDA toolkit compatível com Blackwell (a confirmar)
# 2) llama.cpp (fixar o commit no log)
git clone https://github.com/ggml-org/llama.cpp && cd llama.cpp && git rev-parse HEAD
cmake -B build -DGGML_CUDA=ON && cmake --build build -j 16

# 3) Pesos: baixar GGUF fixando o hash (sha256) e a licença no manifesto
#    (feito pela mantenedora, não por este agente)

# 4) Servidor (um por modelo)
./build/bin/llama-server -m models/qwen3.5-9b-q4_k_m.gguf -ngl 99 -c 16384 -np 4 --port 8080
#    Qwen3.5: desligar thinking via chat_template_kwargs enable_thinking=false no pedido

# 5) Execução do benchmark (script do repositório, a criar)
node scripts/i18n-bench/run.mjs --system qwen3.5-9b --strata all --seed 42 --out results/qwen3.5-9b.jsonl
node scripts/i18n-bench/check.mjs results/qwen3.5-9b.jsonl      # seção 7.3
python scripts/i18n-bench/score.py results/*.jsonl              # chrF++ e COMET (wmt22-comet-da)
node scripts/i18n-bench/export-human.mjs results/*.jsonl --blind --n 200   # planilha cega
```

Para OPUS-MT: converter com `ct2-opus-mt-converter` do CTranslate2 (a confirmar nome exato do conversor), mascarar placeholders antes e restaurar depois, e rodar em CPU e GPU.

### 7.8 Limiares de sucesso e falha

**Portões eliminatórios (qualquer falha desclassifica o sistema para texto do SRD):**

- Paridade de dados/números de segmentos de regras < 99,5% na primeira passagem, ou qualquer falha de paridade que escape da validação depois de 2 tentativas.
- Avaliação humana: **qualquer** erro crítico de exatidão mecânica em mais de 2% dos segmentos dos estratos E6/E7/E8/E10/E15.
- Vazão: 158k palavras em mais de 12 h por idioma, ou OOM recorrente.
- Licença não confirmada.

**Portões eliminatórios para UI (strings curtas):** paridade ICU/tags < 99% na primeira passagem, ou < 100% depois de 2 tentativas.

**Critérios de aprovação:**

- Glossário: acerto ≥ 95% na primeira passagem nos termos obrigatórios (100% depois de validação e nova tentativa).
- Humano: penalidade MQM por 100 palavras ≤ 1,5 vez a da referência humana; ≥ 80% dos segmentos "utilizáveis com edição leve"; < 2 erros maiores por 1.000 palavras.
- Automática: chrF++ e COMET dentro de 2 desvios do melhor sistema; usar apenas para desempate, jamais como veredito.
- Recursos: VRAM de pico ≤ 7,2 GB (margem para o sistema), 158k palavras em ≤ 8 h por idioma sem supervisão.

## 8. Tempo e eletricidade para traduzir 158k palavras em um idioma (ESTIMADO)

**Premissas (marcadas):**

- Tokens de saída: pt tende a ter ~10% mais palavras que en (medido localmente em `messages`: 8.714 palavras en vs 9.061 pt, 4%; no SRD varia) e ~1,6 a 2,0 tokens por palavra em tokenizers de LLM (ESTIMADO). 158k x 1,1 x 1,75 ≈ **300k tokens** de saída (faixa 250k-400k).
- Tokens de entrada: 158k x ~1,4 ≈ 220k tokens de fonte, mais glossário/instruções/exemplos por chamada: **~1M tokens de prompt** no total (ESTIMADO; menos com cache de prefixo).
- **Largura de banda da GPU**: 384 GB/s (MEDIDO, página NVIDIA da série RTX 50 para laptop; 8 GB e 12 GB GDDR7; TGP não informada).
- **Geração (tg) limitada por banda**: tok/s teórico ≈ banda / tamanho dos pesos; eficiência real 50-70% (ESTIMADO).
- Prefill (pp): 1.500 a 3.000 tok/s para 7-9B em Q4 (ESTIMADO; medir com `llama-bench`).
- Paralelismo: 4 slots dão ~2 a 2,5x de vazão agregada (ESTIMADO; muito dependente do build e da VRAM).
- Potência: sistema inteiro ~120 a 170 W sob carga (ESTIMADO; TGP desta GPU de laptop **não verificado**).

| Candidato (Q4_K_M)              | Pesos (GB, ESTIMADO)           | tg teórico (384/GB) | tg realista                                                                             | Tempo de geração 300k tok   | Prefill 1M tok @ 2.000 t/s | Total 1 fluxo | Total 4 slots | Energia (150 W)               |
| ------------------------------- | ------------------------------ | ------------------- | --------------------------------------------------------------------------------------- | --------------------------- | -------------------------- | ------------- | ------------- | ----------------------------- |
| Qwen3.5-9B                      | ~6,2                           | 62 tok/s            | ~40 tok/s (terceiro: 39)                                                                | 7.500 s = 2,1 h             | ~8 min                     | ~2,2 h        | ~1,0 h        | 0,33 kWh (1 fluxo) a 0,15 kWh |
| Seed-X-PPO-7B                   | ~4,5 (7B x 4,85/8 ≈ 4,3 a 4,5) | ~85 tok/s           | ~55 tok/s                                                                               | 5.450 s = 1,5 h             | ~8 min                     | ~1,6 h        | ~0,8 h        | 0,24 kWh a 0,12 kWh           |
| Gemma 4 E4B                     | ~4,8 (8B com embeddings)       | ~80 tok/s           | ~50 tok/s (se embeddings residem na GPU; não verificado)                                | 6.000 s = 1,7 h             | ~8 min                     | ~1,8 h        | ~0,9 h        | 0,27 kWh a 0,14 kWh           |
| TranslateGemma 12B (referência) | ~7,3                           | 53 tok/s se couber  | ~15-25 tok/s com offload parcial (não cabe com KV em 8 GB)                              | 12.000-20.000 s = 3,3-5,6 h | ~15 min                    | ~3,5-6 h      | n/a           | 0,5-0,9 kWh                   |
| OPUS-MT tc-big (0,2B, CT2)      | ~0,2                           | n/a                 | CPU na ordem de 10^2 a 10^3 tok/s (ESTIMADO a partir do README do CT2 com outro modelo) | minutos                     | n/a                        | < 15 min      | n/a           | < 0,04 kWh                    |

Aritmética exemplo (Qwen3.5-9B): 300.000 tok / 40 tok/s = 7.500 s = 2,08 h; mais prefill 1.000.000 / 2.000 = 500 s = 8,3 min; total ≈ 2,2 h. Energia: 2,2 h x 0,15 kW = 0,33 kWh; com 4 slots, ~1,0 h x 0,15 = 0,15 kWh. Em reais, com tarifa ilustrativa de R$ 1,00/kWh (a tarifa real da mantenedora é desconhecida): R$ 0,15 a R$ 0,35 por idioma, ou seja, desprezível. O custo real é revisão humana, não energia.

**Ressalvas:** (1) se o thinking do Qwen3.5 ficar ligado, multiplicar por 3-10. (2) Se a VRAM estourar e houver offload para a RAM (WSL com 16 GB; ~8 GB disponíveis no momento da checagem), a vazão cai várias vezes. (3) Laptop sofre `thermal throttling`; rodas longas podem ficar 20-30% mais lentas (ESTIMADO). (4) Retentativas dos validadores acrescentam de 5% a 20% de tokens (ESTIMADO).

## 9. Situação legal da saída de MT para fonte CC-BY-4.0 / OGL (resumo curto)

(Outro agente cobre licenciamento em profundidade.)

- A tradução é uma obra derivada ("adaptation"/"adapted material") do SRD. Sob CC-BY-4.0 é permitida, com obrigação de atribuição, indicação de que houve modificação e link da licença; a licença da tradução deve manter os mesmos direitos (não verificado aqui). Sob a OGL 1.0a, existem requisitos de aviso de direitos autorais e de declaração de "Product Identity" (não verificado aqui).
- A saída da máquina em si: a proteção autoral de textos gerados por IA é incerta e varia por jurisdição (não verificado nesta sessão). Na prática, a tradução derivada herda os termos da fonte; a revisão humana pode agregar originalidade, mas isso é questão para o parecer jurídico.
- **Licenças dos modelos que afetam o uso das saídas**: Qwen3.5, Gemma 4, EuroLLM, Ministral 3 (Apache-2.0): sem restrição às saídas; Seed-X (OpenMDW-1.0): o texto lido diz que não há restrições sobre uso, modificação ou compartilhamento das saídas; Gemma Terms of Use (TranslateGemma): saídas não são "Model Derivatives", mas treinar outro modelo com saídas é; Tencent: §5(b) proíbe usar saídas para melhorar outros modelos.

## 10. Recomendação ranqueada

Hipótese de partida, a ser confirmada ou refutada pelo benchmark da seção 7.

1. **Primário: Qwen3.5-9B (Apache-2.0), Q4_K_M, em `llama-server` (llama.cpp), thinking desligado**, com: TM primeiro, glossário e 2 a 3 pares aprovados do próprio SRD no prompt, saída estruturada por JSON/GBNF, validadores determinísticos com 2 tentativas, revisão humana de tudo que tenha mecânica. Razões: licença limpa, controlável por instruções (importante para ICU e tags), contexto longo, API compatível com OpenAI, cabe em 8 GB. Incerteza principal: não há número de qualidade en→pt-BR isolado; o benchmark decide.
2. **Fallback / desafiante: Seed-X-PPO-7B (OpenMDW-1.0)** para a prosa do SRD, onde um modelo especializado em MT pode ganhar do generalista (humano EN⇒pt 3,88/4 no paper dos autores), com prompts curtos, segmentos até ~2.000 tokens e glossário aplicado por pós-checagem. **Segundo fallback para UI curta**: OPUS-MT tc-big en-pt (CC-BY-4.0) via CTranslate2 em CPU, com mascaramento de placeholders. **Terceiro**: Gemma 4 E4B (Apache-2.0) e EuroLLM-9B-Instruct (Apache-2.0), este último mais provável de ajudar em sv.
3. **Referência de teto, não de produção**: TranslateGemma 12B/27B (licença Gemma Terms, a revisar), apenas se a revisão jurídica aprovar o uso.

**Desqualificados por licença**: NLLB-200 (CC-BY-NC-4.0), Tower e Tower+ (CC-BY-NC), Aya Expanse (CC-BY-NC mais AUP), Hunyuan-MT e HY-MT1.5 (Território exclui UE/UK/Coreia do Sul; §5(b) saídas).

## 11. Limitações

- Pesquisa feita em um dia, com leitura via ferramenta de busca/extração; várias páginas retornaram resumos, não texto bruto (por exemplo, o PDF do TranslateGemma não pôde ser lido por falta de `pdftotext`/`pdftoppm`; sem a tabela por idioma de en→pt-BR/es/sv).
- Nenhum número de qualidade, velocidade ou VRAM foi medido nesta máquina. Tudo marcado MEDIDO é de terceiros ou dos autores do modelo (conflito de interesse: avaliam o próprio modelo).
- Benchmarks públicos citados (WMT24++, FLORES) usam subconjuntos, métricas e conjuntos de idiomas diferentes; **não são comparáveis entre si** (por exemplo, Qwen3.5 XCOMET 72,6 num subconjunto difícil de 55 idiomas vs Tower+ 84,38 em 24 idiomas).
- Não verifiquei: licença dos pacotes Argos, Llama 3.x e Phi, XCOMET/MetricX, detalhes do `llama-server` (503 na página), suporte a Blackwell no llama.cpp/CTranslate2, TGP real do laptop, RAM física do host.
- Não verifiquei se `>>pob<<` no OPUS-MT produz de fato português do Brasil, nem se MADLAD-400 distingue pt-BR de pt-PT.
- O sistema de busca desta sessão é US-only e pode refletir indexação atrasada de lançamentos de 2026.
- Termos de Anthropic podem mudar; a página de suporte já teve um "pause" em 2026-06-15 e uma atualização em 2026-10-07.

## 12. Nível de confiança por afirmação principal

| Afirmação                                                   | Confiança                                                                          | Motivo                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| NLLB, Tower/Tower+ e Aya Expanse são não comerciais         | Alta                                                                               | texto/metadado de licença nos model cards lidos                             |
| HY-MT/Hunyuan-MT excluem UE, UK e Coreia do Sul             | Alta                                                                               | texto da licença lido nos arquivos `License.txt`                            |
| Qwen3.5-9B, Gemma 4, EuroLLM-9B, Ministral 3 são Apache-2.0 | Alta (Qwen, Gemma 4 E4B, EuroLLM) / Média (Ministral 3: só docs Mistral via busca) | cards lidos; Ministral por resultado de busca                               |
| Seed-X é OpenMDW-1.0 com texto permissivo                   | Média-alta                                                                         | arquivo LICENSE lido, mas resumido por ferramenta; revisar o texto integral |
| TranslateGemma é "Gemma Terms of Use", não CC-BY-NC         | Média-alta                                                                         | tag HF e termos lidos; blog terceiro contradiz                              |
| Qwen3.5-9B é o melhor para en→pt-BR                         | **Baixa**                                                                          | sem benchmark direto; escolhido por licença, controlabilidade e encaixe     |
| Seed-X tem boa qualidade en→pt                              | Média                                                                              | humano 3,88/4 vindo dos autores                                             |
| Tempo 1-2,5 h e 0,15-0,35 kWh por idioma                    | Baixa-média                                                                        | arquitetura de gargalo de banda + premissas explícitas; medir               |
| Uso de `claude -p`/assinatura como automação                | Média (fatos) / Baixa (interpretação)                                              | páginas lidas, mas há tensão entre termos e artigo de suporte               |
| MT sem glossário garantido; garantia vem de validação       | Alta                                                                               | revisão dos mecanismos documentados                                         |

## 13. Perguntas em aberto

1. Qual a TGP real e a RAM física do host (as medições de potência e o offload dependem disso)? O laptop usa a dGPU para a tela (reduz VRAM livre)?
2. `>>pob<<` no OPUS-MT força pt-BR? E o es/sv do OPUS-MT, existem modelos tc-big?
3. Resultados por par de idioma (en→pt, en→es, en→sv) do WMT25 e do relatório do TranslateGemma: ler as tabelas.
4. A licença Gemma Terms of Use do TranslateGemma é aceitável para o projeto (inclusive com futuros recursos pagos)? Pergunta para o agente de licenciamento.
5. llama.cpp e CTranslate2 funcionam bem com RTX 5070 (Blackwell, sm_120) no WSL2 hoje?
6. Qual a taxa real de `thinking` desligado funcionar em llama.cpp com Qwen3.5 (template `--jinja`)?
7. O Weblate (já usado) aceita pré-tradução via API OpenAI-compatível local, ou é melhor gerar um PR com JSON? (não verificado)
8. Qual a posição jurídica sobre o uso de `claude -p` com assinatura em script local, dada a cláusula de "bot, script"? Perguntar à Anthropic, se for relevante.
9. Para es e sv: quem são os revisores voluntários e qual é o conjunto mínimo de referência?
10. Vale gerar um glossário formal (CSV) a partir das referências aprovadas do SRD 5.1, e corrigir antes o ruído (`[20-foot-radius sphere]`) nas referências?

## 14. Fontes

Todas verificadas em 2026-11-27 (data da pesquisa).

| Área da afirmação                                                     | URL                                                                                            | Data verificada        |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------- |
| TranslateGemma: anúncio, tamanhos, WMT24++                            | https://blog.google/innovation-and-ai/technology/developers-tools/translategemma/              | 2026-11-27             |
| TranslateGemma: relatório técnico (resumo)                            | https://arxiv.org/abs/2601.09012                                                               | 2026-11-27             |
| TranslateGemma 12B: licença "gemma", MetricX, 2K contexto, template   | https://huggingface.co/google/translategemma-12b-it                                            | 2026-11-27             |
| TranslateGemma 4B: treino, avaliação, limitações                      | https://huggingface.co/google/translategemma-4b-it                                             | 2026-11-27             |
| Gemma Terms of Use (definição de Model Derivatives, redistribuição)   | https://gemma.ai/resources/terms/ (redirecionado de https://ai.google.dev/gemma/terms)         | 2026-11-27             |
| Gemma 4: anúncio, tamanhos, Apache 2.0, 2026-04-02                    | https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/                     | 2026-11-27             |
| Gemma 4: Apache 2.0 (blog open source)                                | https://opensource.googleblog.com/2026/03/gemma-4-expanding-the-gemmaverse-with-apache-20.html | 2026-11-27             |
| Gemma 4 E4B: licença, parâmetros, contexto, idiomas                   | https://huggingface.co/google/gemma-4-E4B-it                                                   | 2026-11-27             |
| Qwen3.5-9B: licença, benchmarks, thinking                             | https://huggingface.co/Qwen/Qwen3.5-9B                                                         | 2026-11-27             |
| Qwen3.5 small (lançamento, Apache 2.0)                                | https://artificialanalysis.ai/articles/qwen3-5-small-models                                    | 2026-11-27             |
| Tower+ 9B: licença, idiomas, base                                     | https://huggingface.co/Unbabel/Tower-Plus-9B                                                   | 2026-11-27             |
| Tower+: paper (WMT24++ xCOMET, IF-MT)                                 | https://arxiv.org/html/2506.17080                                                              | 2026-11-27             |
| TowerInstruct v0.1: CC-BY-NC                                          | https://huggingface.co/Unbabel/TowerInstruct-7B-v0.1                                           | 2026-11-27             |
| Seed-X-PPO-7B: card, idiomas, OpenMDW                                 | https://huggingface.co/ByteDance-Seed/Seed-X-PPO-7B                                            | 2026-11-27             |
| Seed-X: texto da licença OpenMDW-1.0                                  | https://huggingface.co/ByteDance-Seed/Seed-X-PPO-7B/blob/main/LICENSE                          | 2026-11-27             |
| Seed-X: paper (COMET, humano en→pt)                                   | https://arxiv.org/html/2507.13618v2                                                            | 2026-11-27             |
| Hunyuan-MT-7B: card                                                   | https://huggingface.co/tencent/Hunyuan-MT-7B                                                   | 2026-11-27             |
| Hunyuan-MT-7B: licença (Território, MAU, §5(b))                       | https://huggingface.co/tencent/Hunyuan-MT-7B/blob/main/License.txt                             | 2026-11-27             |
| HY-MT1.5-7B: card (templates de terminologia, contexto, formato)      | https://huggingface.co/tencent/HY-MT1.5-7B                                                     | 2026-11-27             |
| HY-MT1.5: licença (Tencent HY, 2025-12-30)                            | https://huggingface.co/tencent/HY-MT1.5-7B/blob/main/License.txt                               | 2026-11-27             |
| HY-MT1.5: relatório técnico                                           | https://arxiv.org/html/2512.24092v1                                                            | 2026-11-27             |
| NLLB-200: cc-by-nc-4.0, "not for production"                          | https://huggingface.co/facebook/nllb-200-distilled-600M                                        | 2026-11-27             |
| MADLAD-400: Apache 2.0, tamanhos, limitações                          | https://huggingface.co/google/madlad400-10b-mt                                                 | 2026-11-27             |
| OPUS-MT tc-big en-pt: CC-BY-4.0, chrF/BLEU, tokens `pob`/`por`        | https://huggingface.co/Helsinki-NLP/opus-mt-tc-big-en-pt                                       | 2026-11-27             |
| EuroLLM-9B-Instruct: Apache 2.0, idiomas                              | https://huggingface.co/utter-project/EuroLLM-9B-Instruct                                       | 2026-11-27             |
| Aya Expanse 8B: cc-by-nc-4.0                                          | https://huggingface.co/CohereLabs/aya-expanse-8b                                               | 2026-11-27             |
| Ministral 3 (Apache 2.0, tamanhos)                                    | https://docs.mistral.ai/models/ministral-3-8b-25-12.md                                         | 2026-11-27 (via busca) |
| CTranslate2: MIT, famílias, quantização, desempenho                   | https://github.com/OpenNMT/CTranslate2                                                         | 2026-11-27             |
| LibreTranslate: AGPL-3.0, Argos                                       | https://github.com/LibreTranslate/LibreTranslate                                               | 2026-11-27             |
| Argos Translate: MIT/CC0, idiomas                                     | https://github.com/argosopentech/argos-translate                                               | 2026-11-27             |
| llama.cpp: MIT, servidor OpenAI-compatível                            | https://github.com/ggml-org/llama.cpp                                                          | 2026-11-27             |
| Ollama: MIT                                                           | https://github.com/ollama/ollama                                                               | 2026-11-27             |
| Ollama: concorrência, contexto 4096, keep-alive                       | https://docs.ollama.com/faq                                                                    | 2026-11-27             |
| NVIDIA RTX 5070 Laptop: 8/12 GB GDDR7, 384 GB/s                       | https://www.nvidia.com/en-us/geforce/laptops/50-series/                                        | 2026-11-27             |
| Vazão reportada (terceiro, método não declarado)                      | https://llmrun.dev/gpu/rtx-5070-laptop                                                         | 2026-11-27 (via busca) |
| COMET wmt22-comet-da: Apache-2.0                                      | https://huggingface.co/Unbabel/wmt22-comet-da                                                  | 2026-11-27             |
| CometKiwi wmt22-cometkiwi-da: cc-by-nc-sa-4.0                         | https://huggingface.co/Unbabel/wmt22-cometkiwi-da                                              | 2026-11-27             |
| WMT25 findings (lista de sistemas, ESA)                               | https://aclanthology.org/2025.wmt-1.22                                                         | 2026-11-27 (via busca) |
| Claude Code: legal e conformidade, autenticação                       | https://code.claude.com/docs/en/legal-and-compliance.md                                        | 2026-11-27             |
| Anthropic: Agent SDK com plano (atualizações 2026-06-15 e 2026-10-07) | https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan | 2026-11-27             |
| Anthropic: termos de consumidor (acesso automatizado)                 | https://www.anthropic.com/legal/consumer-terms                                                 | 2026-11-27             |
| Repositório local (contagens e exemplos)                              | `messages/{en,pt}.json`, `content/dnd5e/srd-5.{1,2}/i18n/{en,pt}/*.json`                       | 2026-11-27             |
