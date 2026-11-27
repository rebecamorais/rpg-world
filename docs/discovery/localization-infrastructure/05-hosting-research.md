# 05 — Pesquisa de hospedagem e FinOps para infraestrutura de localização

Data da pesquisa: **2026-11-27**. Pesquisa só de leitura: nenhuma conta foi criada, nada foi provisionado, nenhum conteúdo foi enviado.

Regra usada: todo limite abaixo veio de página oficial do provedor, lida em 2026-11-27 (ver "Fontes"). Onde não deu para confirmar, está escrito **"não verificado"**. Os preços de eletricidade e os tempos de inferência são **estimativas**, e estão marcados assim.

## Resumo executivo

1. **Nenhum provedor gratuito roda o W1 (Weblate/Tolgee) de forma sustentável e com falha dura de cota.** O único candidato gratuito com RAM suficiente é o Oracle Always Free A1 (2 OCPU / 12 GB hoje), mas ele tem três armadilhas: a cota caiu pela metade em 2026-06-15, existe política de recuperação de instância ociosa e há relatos de falta de capacidade em São Paulo.
2. **W2, W4 e W5 cabem de graça** em Cloudflare (Workers, D1, Pages), GitHub Actions (repo público) e GitHub Pages, com falha dura de cota. É onde a arquitetura deve morar.
3. **W3 (tradução em lote) deve rodar no notebook** (RTX 5070 8 GB). Nenhuma nuvem gratuita oferece GPU: Hugging Face Spaces com Docker/Gradio hoje exige plano pago, e o ZeroGPU gratuito é limitado a 2 Spaces Gradio.
4. **Fallback pago mais barato para o W1:** Hetzner CX23 (2 vCPU, 4 GB, 40 GB) a **€ 5,99/mês sem IVA** (CAX11 ARM: € 6,49). Na captura da página estava marcado "currently unavailable"; só há datacenters na Alemanha, Finlândia, Singapura e EUA (nenhum no Brasil).
5. **Armadilhas principais:** Oracle (recuperação por ociosidade, cartão, capacidade), Render (Postgres gratuito expira em 30 dias), Supabase (pausa após 1 semana), Tailscale Personal (somente uso não comercial), GitHub Actions (cláusula contra uso como "serverless application"), GitHub Self-hosted runners (nunca em repo público sem isolamento total).

## Premissas de dimensionamento

- Hoje: ~158 mil palavras-fonte, ~5,4 mil strings.
- Cenários: 2x, 5x, 10x de conteúdo; 5, 10, 20 idiomas.
- Palavras traduzidas = palavras-fonte × idiomas. Hoje × 20 idiomas = ~3,2 milhões; 10x × 20 = ~31,6 milhões.
- Weblate: "around 300 MB per 1 million hosted words" no banco (doc oficial). Não está claro se "hosted words" conta só a fonte ou cada tradução; **não verificado**. Uso o pior caso (conta cada tradução).

## Tabela-resumo por provedor

Legenda de custo: **Grátis permanente** = sem data de fim anunciada; **Promo/trial** = crédito ou prazo; **Cartão** = exigido para abrir conta; **Falha dura** = ao estourar a cota o serviço para ou recusa, sem cobrar.

| Provedor / plano | Permanente? | Cartão | Cobrança surpresa | Teto de gasto / falha dura | Mais limitante |
|---|---|---|---|---|---|
| Oracle Always Free | Sim (com ressalvas) | Não verificado (página FAQ bloqueada, 403) | Sim, ao virar PAYG ou fora da home region | Não (falha dura só enquanto não for PAYG) | A1 2 OCPU/12 GB; ociosidade; capacidade |
| Google Cloud Always Free | Sim (sem data de fim; aviso de 30 dias para mudar) | Sim (conta de faturamento) | Sim, se passar da cota ou usar GPU/regiões fora do free | Não (orçamentos só alertam) | e2-micro só nos EUA; 1 GB de saída/mês |
| AWS Free plan | Não: conta fecha em 6 meses ou ao fim do crédito | Não verificado | Não no plano Free; sim se virar Paid | Sim no plano Free | Prazo de 6 meses |
| Azure free | 12 meses + sempre-grátis | Não verificado | Sim | Não verificado | Página oficial não detalhou limites |
| Cloudflare Workers/D1/R2/Queues/DO (Free) | Sim | Não verificado | Não (Free não tem tarifa) | **Sim**: operações falham | 10 ms CPU por requisição; 100 mil req/dia |
| Cloudflare Pages Free | Sim | Não verificado | Não | Sim | 500 builds/mês |
| Cloudflare Workers AI (Free) | Sim | Não verificado | Não | **Sim**: "operations fail" | 10.000 Neurons/dia |
| Cloudflare Tunnel | Gratuito segundo prática conhecida; **não verificado** nas páginas oficiais lidas | Não verificado | Não | n/a | ToS do CDN (conteúdo não-HTML) |
| GitHub Actions (repo público) | Sim | Não | Não | Sim | 6 h por job; ToS de uso como computação |
| GitHub Pages | Sim | Não | Não | Soft limits | 1 GB de site; ~100 GB/mês (soft) |
| GitHub Models | **Aposentado** | n/a | n/a | n/a | "fully retired" |
| Supabase Free | Sim | Não verificado | Não | Sim | Pausa após 1 semana; 2 projetos; 500 MB |
| Neon Free | Sim | Não | Não | Sim (suspende compute) | 100 CU-h/mês; 1 GB/projeto |
| Firebase Spark | Sim | Não ("No payment method needed") | Não | Não declarado na página | Sem Cloud Functions no Spark |
| Render Free | Parcial | Não verificado | Sem cartão, serviços suspensos | Sim | Dorme em 15 min; Postgres expira em 30 dias |
| Railway Free | $1/mês de uso | Não | Não | Sim (plano Free) | Orçamento de $1/mês |
| Fly.io | $1 sem cartão; $5/mês com cartão | Para os $5 | Sim (pay as you go) | Não declarado | Sem teto de gasto documentado |
| Hugging Face Spaces | Estático grátis; Docker/Gradio exigem pago | Sim (PRO) | Sim, em hardware pago | Não verificado | Sem compute grátis |
| Koyeb | Só Postgres "Free 5h" | Não verificado | Não verificado | Não verificado | Sem compute gratuito listado |
| Northflank Sandbox | Sim (até $20/mês de recursos) | **Sim** | Possível | Não verificado | Cartão obrigatório |
| Deno Deploy Free | Sim, mas página avisa **sunset em abril de 2027** | Não verificado | Não verificado | Não verificado | Descontinuação |
| Vercel Hobby | Sim | Não | Não | **Sim** (espera 30 dias) | Cláusula comercial: não verificado |
| Netlify Free | Sim | Não verificado | Não verificado | Não verificado | 300 créditos; página não explica o estouro |
| Turso Free | Sim | Não | Só se ativar overage | Sim | 5 GB; 10 M escritas/mês |
| Upstash Redis Free | Sim | Não | Cartão converte para pay-as-you-go | Sim | 500 mil comandos/mês |
| Tailscale Personal | Sim | Não verificado | Não | n/a | **Somente uso não comercial** |
| Hetzner (pago) | Não | Sim | Cobra por hora/mês | n/a | Sem região no Brasil |

## Seções por provedor

### Oracle Cloud Always Free

Fonte: docs.oracle.com, página Always Free Resources, lida em 2026-11-27.

- **A1 hoje:** 1.500 horas de OCPU e 9.000 GB-horas por mês, equivalente a **2 OCPU e 12 GB**. Uma instância de 2 OCPU ou duas de 1 OCPU. Nega Coreia do Sul Norte (Chuncheon).
- **Redução:** o InfoQ reporta que o limite era 4 OCPU/24 GB e caiu para 2 OCPU/12 GB, em vigor desde **2026-06-15** (a data é do artigo; a doc oficial hoje só mostra o valor novo). Contas PAYG talvez mantenham o valor antigo, **mas a Oracle não confirmou publicamente**; a doc avisa que, se o recurso for terminado, pode não ser possível recriá-lo acima do novo limite.
- **Ociosidade:** a Oracle "may reclaim" instâncias Always Free que, em 7 dias, tenham CPU (p95) < 20%, rede < 20% e (só A1) memória < 20%. Um Weblate pequeno e quieto pode cair nesse critério. Mitigação possível: tráfego ou carga artificial, o que é frágil; **não recomendado como solução**.
- **Armazenamento:** 200 GB somados (boot + block), 5 backups, só na home region.
- **Saída:** 10 TB/mês.
- **Outros:** 2 VMs AMD micro (1/8 OCPU, 1 GB, 50 Mbps); 2 Autonomous DB (1 OCPU, 20 GB, 20 sessões); Object Storage 20 GB e 50 mil requisições/mês no modo só Always Free.
- **Capacidade em São Paulo:** relato de comunidade de mais de 3 dias e mais de 1.000 tentativas com "Out of host capacity" em `sa-saopaulo-1` (sem data visível). Nada específico sobre Vinhedo. A doc diz que o erro é escassez temporária na home region. **Evidência anedótica.**
- **Cartão e PAYG:** a FAQ oficial retornou 403; **não verificado**. O relato de comunidade sugere que o upgrade para PAYG também pode falhar por falta de capacidade.
- **Região:** home region é fixa; recursos Always Free fora dela são cobrados.
- **ARM64:** sim. **Container:** sim (Docker na VM). **GPU:** não. **Backup:** manual; 5 backups de volume.
- **Migração:** média (é uma VM Linux comum). **Operação:** alta (patch, backup, segurança, reclamação).

### Google Cloud Always Free

- **e2-micro:** 1 VM não preemptiva por mês, **só** em `us-west1`, `us-central1`, `us-east1`; 30 GB de disco padrão; **1 GB** de saída por mês da América do Norte. 2 vCPU compartilhadas / 1 GB RAM (valores do tipo de máquina; a página lida não os repete, **não verificado nesta rodada**). Longe do Brasil e sem RAM para Weblate.
- **Cloud Run:** 2 milhões de requisições, 360.000 GB-s, 180.000 vCPU-s por mês.
- **Cloud Run functions:** 2 milhões de invocações; 5 GB de saída.
- **Firestore:** 1 GiB, 50 mil leituras/20 mil escritas/20 mil deletes por dia.
- **Cloud Storage:** 5 GB (só regiões US), 100 GB de saída.
- **Trial:** US$ 300 por 90 dias; sem GPU durante o trial; Vertex AI não pode ser pago com o crédito para contas novas a partir de **2026-11-16**.
- **Teto:** a conta exige faturamento; não há teto duro (orçamentos só alertam; **não verificado** nesta rodada). Risco de cobrança surpresa.

### AWS

- Modelo novo: US$ 100 de crédito ao abrir, até US$ 200 explorando serviços; **a conta fecha em 6 meses ou quando o crédito acaba**. Plano Free não cobra; plano Paid cobra além do crédito.
- "Always free" para mais de 30 serviços; a página não os lista. Lambda: **não verificado**.
- Veredito: **não serve como base permanente** (a conta expira).

### Azure

- A página oficial lida cita 12 meses de serviços grátis (migrar para pay-as-you-go em 30 dias) e 65+ serviços sempre grátis, mas **não detalha limites**. Tudo mais: **não verificado**. Não investigado mais fundo porque o prazo de 12 meses o descarta como base permanente.

### Cloudflare

Todas as quotas do plano Free abaixo vêm de developers.cloudflare.com, lidas em 2026-11-27.

- **Workers Free:** 100.000 requisições/dia (excesso retorna Error 1027), **10 ms de CPU por requisição**, 128 MB de memória, 50 subrequisições, 5 Cron Triggers (10 ms de CPU, 15 min de relógio), 100 Workers. Falha dura, sem cobrança.
- **D1:** 5 milhões de linhas lidas/dia, **100.000 escritas/dia**, 5 GB total, 10 bancos.
- **R2:** 10 GB-mês, 1 milhão de operações Class A, 10 milhões Class B, saída gratuita. Exigência de cartão: **não verificado**.
- **Queues:** **está no plano Free**: 10.000 operações/dia (uma mensagem usa ~3 operações, ou ~3.300 mensagens/dia), retenção fixa de 24 h.
- **Durable Objects:** só backend SQLite no Free; 100.000 requisições/dia, 13.000 GB-s/dia, 5 GB de dados SQL.
- **Workers AI:** 10.000 Neurons/dia grátis; excedente **falha com erro** no plano Free. Modelos de tradução listados na página de preços: `@cf/meta/m2m100-1.2b` e `@cf/ai4bharat/indictrans2-en-indic-1B`. Limite padrão para tarefas de tradução: 720 req/min. **Custo em Neurons por palavra: não verificado**, então não dá para dizer quantas strings cabem em 10.000 Neurons/dia.
- **Pages:** 500 builds/mês, 20.000 arquivos, 25 MiB por arquivo. A página oferece Workers Static Assets como alternativa; não declara descontinuação do Pages.
- **Tunnel:** `cloudflared` abre conexão **de saída** e permite bloquear toda entrada, ideal para CGNAT. Se é gratuito, e se há requisito de cartão: **não verificado** (as páginas oficiais lidas não dizem). Os termos do CDN dizem que servir vídeo ou "disproportionate percentage" de arquivos grandes sem serviço pago pode levar a limitação; texto e JSON de tradução estão longe disso.
- **Containers:** não oferecidos no Free (**não verificado**); Workers não rodam Weblate.
- **Sem GPU, sem disco persistente de VM.**

### GitHub

- **Actions, repo público:** runners padrão "free and unlimited"; **ubuntu-latest: 4 vCPU, 16 GB RAM, 14 GB SSD**; **ARM64 (`ubuntu-24.04-arm`)** disponível com a mesma configuração. Limites: job de até **6 h** (hospedado) ou **5 dias** (self-hosted); run de até 35 dias; **20 jobs concorrentes** no plano Free; cache de **10 GB** por repositório; `GITHUB_TOKEN` com 1.000 requisições/hora por repositório.
- **Workflows agendados** em repo público são desativados automaticamente após **60 dias sem atividade** no repositório (texto oficial).
- **ToS (Additional Product Terms):** proíbe criptomineração; proíbe usar Actions "as a content delivery network or as part of a serverless application" por carga desproporcional; runners hospedados só para trabalho de **produzir, testar, publicar ou implantar o software do repositório**. Tradução em lote com modelo CPU é **zona cinzenta**: validação e abertura de PR são claramente aceitáveis; inferência pesada recorrente não é.
- **Self-hosted runners:** docs oficiais dizem que devem "almost never be used for public repositories", pois qualquer PR de fork pode comprometer a máquina. **Cobrança:** a página de billing atual lista runners self-hosted entre o uso que "remains free independently" e não cita taxa. A taxa de US$ 0,002/min anunciada em dezembro de 2025 foi **adiada** em 2025-12-17 (fonte secundária, The Register); não encontrei nova data oficial. **Risco regulatório residual: a cobrança pode voltar.**
- **Pages:** site de até 1 GB; limite flexível de 100 GB/mês de banda; flexível de 10 builds/hora (não vale com workflow próprio); proibido para negócio comercial/SaaS.
- **GitHub Models:** a página oficial diz "fully retired". Não existe camada gratuita.
- **Armazenamento de artefatos:** 500 MB no plano Free (compartilhado com Packages) para contas privadas; para repo público, **não verificado**.

### Supabase Free

- 2 projetos ativos, **500 MB** de banco por projeto, 1 GB de arquivos, 5 GB de saída + 5 GB em cache, 50 mil MAU, **projetos pausados após 1 semana de inatividade**, sem backups automáticos, 500 mil invocações de Edge Functions. Cron/filas: **não verificado**.
- O RPGWorld já usa Supabase; um segundo projeto gastaria uma das duas vagas. Falha dura, não cobra.

### Neon Free

- 100 projetos, **1 GB por projeto** (20 GB total), **100 CU-horas por projeto/mês**, até 2 CU (8 GB), suspende em 5 min de inatividade, **não pausa por inatividade**, 5 GB de saída/mês, janela de restauração de 6 h. Sem cartão. Estourar suspende o compute até o próximo ciclo.
- Bom para fila/TM no W2 (compute sob demanda); não serve ao Weblate (que mantém conexões e Celery).

### Firebase Spark

- Sem cartão. Firestore: 1 GiB, 10 GiB de saída/mês, 20 mil escritas/dia, 50 mil leituras/dia. Hosting: 10 GB e 360 MB/dia. **Cloud Functions não disponíveis no Spark.**

### Render Free

- Serviço web: 0,1 CPU, 512 MB; **dorme após 15 min** sem tráfego e leva ~1 min para acordar; 750 horas/mês; **sistema de arquivos efêmero**; sem disco persistente, SSH ou jobs; sem SMTP de saída. Postgres grátis: 1 GB, **expira em 30 dias** (+14 de carência); sem backups. Key Value em memória. Não serve ao W1.

### Railway

- Free: US$ 1/mês de uso, sem cartão; 1 vCPU, 0,5 GB RAM, 0,5 GB de volume por serviço. Trial: US$ 5 únicos. Hobby: US$ 5/mês com US$ 5 de uso, exige cartão pós-pago. Regiões: **não verificado**. Não serve ao W1.

### Fly.io

- Free: US$ 1 de crédito sem cartão, "$5 de uso por mês" depois de adicionar cartão; até 3 Machines; Machine `shared-cpu-1x` 256 MB a US$ 2,19/mês (Ashburn); volume US$ 0,15/GB-mês; saída da América do Sul US$ 0,04/GB. Preço do `gru`: **não verificado**. **Sem teto de gasto documentado**. É pago na prática.

### Hugging Face Spaces

- **Spaces estáticos são grátis.** Spaces Gradio e Docker **exigem plano pago** (PRO para conta pessoal). Contas gratuitas em boa situação podem ter até **2 Spaces Gradio em ZeroGPU**.
- CPU Basic: 2 vCPU, 16 GB, 50 GB **não persistentes**; "dorme" quando ocioso. GPU: T4 pequena US$ 0,40/h; L4 US$ 0,80/h.
- Termos do ZeroGPU (cota diária, duração por chamada): **não verificado**; veja a página `spaces-zerogpu`.
- Armazenamento persistente: página `spaces-storage` não lida; **não verificado**.

### Koyeb, Northflank, Deno Deploy, Netlify

- **Koyeb:** nenhum compute gratuito listado; apenas Postgres "Free 5h" (0,25 vCPU, 1 GB, 1 GB; regiões US, Frankfurt, Singapura). Plano Pro US$ 29/mês.
- **Northflank Sandbox:** 2 serviços, 2 jobs, 1 banco; até US$ 20/mês de recursos; **sempre ligado, sem sleep**; **cartão obrigatório** ("to help prevent abuse"). Menor plano: 0,5 vCPU/1 GB a US$ 12/mês. Regiões: **não verificado**. Um serviço de 2 vCPU/4 GB não cabe no teto de US$ 20.
- **Deno Deploy Free:** 1 M requisições, 20 GiB de saída, 10 h de CPU ativa, KV de 1 GiB. A página avisa que **Deno Deploy será descontinuado em abril de 2027**: não use como base.
- **Netlify Free:** modelo de créditos (300). O estouro não está explicado: **não verificado**.

### Vercel Hobby

- Incluído: 100 GB de transferência rápida, 1 M de invocações, 4 h de CPU ativa, 360 GB-h de memória; duração máxima de função 300 s; 100 deploys/dia. **Se estourar, espera-se até 30 dias** para usar o recurso de novo (falha dura, sem cobrança).
- **Restrição comercial: não verificado** nas páginas de limites/Hobby lidas (não aparece nelas). Verificar nos Terms of Service antes de depender do Hobby. O projeto já usa Vercel; a questão afeta o app inteiro, não só a localização.

### Turso, Upstash

- **Turso Free:** 100 bancos, 5 GB, 500 M leituras de linha e 10 M escritas por mês, restauração de 1 dia; sem cartão. Inatividade: **não verificado**.
- **Upstash Redis Free:** 500 mil comandos/mês, 250 MB, 10 GB de banda, 1 banco; cartão converte para pay-as-you-go.

### Tailscale

- Personal: até 6 usuários, dispositivos ilimitados; **"only suitable for non-commercial use"**. Funnel está "disponível para todos os planos" (beta), com limite de banda **não configurável**, portas 443/8443/10000. Uso por um projeto open source sem fins lucrativos provavelmente se enquadra, mas é julgamento, não garantia: **não verificado com a Tailscale**.

### Hetzner (fallback pago)

Ver seção própria abaixo.

## Matriz carga de trabalho × provedor

Legenda: **Cabe** / **Cabe com ressalvas** / **Não cabe**; entre parênteses, a cota limitante.

| Provedor | W1 Weblate/Tolgee | W2 API/webhook + DB pequeno | W3 MT em lote | W4 CI | W5 Páginas estáticas |
|---|---|---|---|---|---|
| Oracle A1 (home SP) | Cabe com ressalvas (capacidade; ociosidade; 2 OCPU/12 GB) | Cabe com ressalvas | Não cabe (CPU lenta, sem GPU) | Cabe com ressalvas | Cabe com ressalvas |
| GCP e2-micro | Não cabe (1 GB RAM; só EUA) | Cabe com ressalvas (Cloud Run grátis, cartão) | Não cabe | Não cabe | Cabe com ressalvas |
| AWS Free | Não cabe (conta expira em 6 meses) | Não cabe (idem) | Não cabe | Não cabe | Não cabe |
| Azure free | Não cabe (12 meses; limites não verificados) | Não verificado | Não cabe | Não verificado | Não verificado |
| Cloudflare Workers/D1/Queues | Não cabe (sem container; 10 ms CPU) | **Cabe** (D1 100 mil escritas/dia; Queues 10 mil ops/dia) | Não cabe (Workers AI 10 mil Neurons/dia) | Não cabe | **Cabe** (Pages) |
| GitHub Actions (público) | Não cabe | Cabe com ressalvas (sem endpoint; só agendado) | Cabe com ressalvas (6 h; ToS) | **Cabe** | Cabe (Pages) |
| GitHub Pages | Não cabe | Não cabe | Não cabe | Não cabe | **Cabe** (1 GB) |
| Supabase Free | Não cabe | **Cabe** (500 MB; pausa em 1 semana) | Não cabe | Não cabe | Não cabe |
| Neon Free | Não cabe (suspende) | **Cabe** (100 CU-h; 1 GB) | Não cabe | Não cabe | Não cabe |
| Firebase Spark | Não cabe | Cabe com ressalvas (sem Functions) | Não cabe | Não cabe | Cabe (Hosting 360 MB/dia) |
| Render Free | Não cabe (0,1 CPU/512 MB; efêmero) | Cabe com ressalvas (dorme; Postgres expira) | Não cabe | Não cabe | Cabe com ressalvas |
| Railway Free | Não cabe (US$ 1/mês) | Cabe com ressalvas | Não cabe | Não cabe | Não cabe |
| Fly.io | Não cabe (grátis só US$ 1) | Cabe com ressalvas (pago na prática) | Não cabe | Não cabe | n/a |
| HF Spaces | Não cabe (Docker exige pago) | Não cabe | Não cabe no grátis (ZeroGPU: 2 Spaces Gradio, termos não verificados) | Não cabe | Cabe (estático) |
| Koyeb | Não cabe | Não cabe | Não cabe | Não cabe | Não cabe |
| Northflank Sandbox | Cabe com ressalvas (precisa mais que US$ 20/mês de 2 vCPU/4 GB; cartão) | Cabe com ressalvas | Não cabe | Não cabe | Não cabe |
| Deno Deploy | Não cabe | Descartado (sunset 04/2027) | Não cabe | Não cabe | Descartado |
| Vercel Hobby | Não cabe | Cabe com ressalvas (funções; restrição comercial não verificada) | Não cabe | Não cabe | Cabe |
| Netlify Free | Não cabe | Cabe com ressalvas (estouro não verificado) | Não cabe | Não cabe | Cabe |
| Turso / Upstash | Não cabe | **Cabe** (como dados/fila: Turso 10 M escritas/mês; Upstash 500 mil comandos/mês) | Não cabe | Não cabe | Não cabe |
| Notebook local (WSL2+GPU) | Cabe com ressalvas (não fica ligado; CGNAT) | Cabe com ressalvas | **Cabe** | Cabe com ressalvas | n/a |
| Hetzner CX23 (pago) | **Cabe** (€ 5,99) | Cabe | Não cabe (sem GPU) | Cabe | Cabe |

### O que não roda de forma realista em infraestrutura gratuita de nuvem

1. **W1 (plataforma de tradução hospedada, 24 h por dia, com disco persistente e backup):** só o Oracle A1 chega perto, e ele tem as armadilhas acima. Qualquer outro gratuito falha em RAM (< 3 GB), em persistência ou em tempo ativo.
2. **W3 com GPU:** nenhuma nuvem gratuita oferece GPU persistente ou em lote sem pagar. HF Spaces e GCP trial excluem GPU ou exigem plano pago.
3. **Backups confiáveis do W1:** Supabase Free não inclui backup; Render Free não tem; Oracle dá só 5 backups de volume.
4. **Tradução em lote de grande volume dentro do GitHub Actions** sem violar o espírito do ToS.

## Local e híbrido

### W3 no notebook (WSL2 + Docker + GPU)

- **Aceleração por GPU no WSL2** funciona com o **driver GeForce/RTX do Windows**; a NVIDIA diz **não instalar driver Linux** dentro do WSL. Para Docker, usa-se o NVIDIA Container Toolkit; só `--gpus all` é suportado (não dá para escolher GPU por índice). Memória gerenciada unificada completa não é suportada e a memória pinada é limitada. Fonte: guia CUDA WSL da NVIDIA, lido em 2026-11-27.
- **Compatibilidade com a RTX 5070 (Blackwell):** o guia diz que o CUDA Toolkit 13.x suporta arquiteturas Turing e posteriores. **Compatibilidade de cada biblioteca (CTranslate2, vLLM, llama.cpp) com Blackwell: não verificado**; testar antes de planejar.
- **Execução:** sob demanda (`docker compose run`) ou agendada pelo Windows. O notebook não fica ligado, então o desenho certo é **lote iniciado por humano ou por agendador local**, nunca um serviço de que algo dependa.

### Padrões de worker "somente saída" (CGNAT)

| Padrão | Como funciona | Segurança | Observação |
|---|---|---|---|
| Polling da API do GitHub ou de uma fila (D1/Queues/Neon) | Worker local pergunta "há trabalho?" | Token com o mínimo de escopo; sem porta aberta | Mais simples; Queues Free retém 24 h e tem 10 mil ops/dia |
| Cloudflare Tunnel | `cloudflared` abre túnel de saída; hostname público | Bloqueia toda entrada; exponha só o que for necessário | Gratuidade e ToS: **não verificado** nas páginas oficiais lidas |
| Tailscale | Rede privada entre seus dispositivos | Acesso por ACL | Personal é **só uso não comercial**; Funnel (beta) expõe 443/8443/10000 |
| GitHub self-hosted runner | Runner local recebe jobs do GitHub | **Docs: "almost never" em repo público** | Só se o workflow aceitar código de fork: não. Se usar, JIT/efêmero, em VM ou contêiner descartável, sem segredos |

**Recomendação de arquitetura:** polling de saída (API do GitHub) com o worker autenticado só com leitura, mais a abertura de PR a partir de um fork da própria pessoa.

### Contribuidores rodando workers sem segredos nem acesso de escrita

Modelo viável, alinhado às docs de segurança do GitHub:

1. A pessoa faz **fork** do repositório e roda o worker no próprio notebook, com a **própria** chave de provedor.
2. O worker só produz **arquivos de tradução + manifesto** (hash do arquivo-fonte, versão do modelo, versão do glossário) e abre **PR a partir do fork**.
3. O CI do repositório principal roda **validação** em `pull_request` (sem segredos, token somente leitura). Nunca usar `pull_request_target` com checkout do código do PR; a doc de segurança do GitHub avisa que essa combinação expõe segredos e escrita. Se for preciso um passo privilegiado, separá-lo em `workflow_run` consumindo artefato como dado, nunca como código.
4. **Artefatos assinados** (opcional): o manifesto pode ser assinado com chave da pessoa contribuidora; o CI valida a assinatura e o hash em vez de confiar no conteúdo. A fonte da verdade continua sendo a revisão humana do PR.
5. **Nunca** dar a runners de PR de fork segredos, `GITHUB_TOKEN` com escrita ou acesso à rede interna.

Limite do modelo: sem revisão humana ou de CI, saída de MT não é confiável. O manifesto reduz fraude, não substitui revisão linguística.

### Eletricidade (estimativa)

**Fórmula:** `custo (R$) = potência (kW) × horas × tarifa (R$/kWh)`.

**Tarifa:** a ANEEL projeta a tarifa média residencial (B1) em **R$ 851/MWh em dezembro de 2026, sem tributos** (R$ 0,851/kWh), alta média de 8,6% no ano (fonte: notícia sobre projeção da ANEEL). A bandeira amarela adiciona **R$ 1,885 por 100 kWh**. Com impostos (ICMS, PIS/Cofins) a tarifa final costuma ficar bem acima; uso o intervalo **R$ 0,85 a R$ 1,20/kWh** como **estimativa**, porque a tarifa exata da distribuidora de quem executa não foi verificada. Bandeira de dezembro: anunciada em 27/11, **não verificada**.

| Cenário (estimativa) | Potência | Horas | kWh | Custo |
|---|---|---|---|---|
| Lote LLM: 20 idiomas × 158 mil palavras (≈ 4,7 M tokens de saída, a ~300 tok/s com batch; **tempo estimado, não medido**) | 150 W | ~4,4 h | ~0,66 | R$ 0,56 a R$ 0,79 |
| Lote NMT em GPU: 10x conteúdo × 20 idiomas (≈ 95 M tokens, a ~1.000 tok/s; **tempo estimado, não medido**) | 150 W | ~26 h | ~4 | R$ 3,4 a R$ 4,8 |
| Notebook ligado 24 h como servidor W1, ocioso a ~30 W (**estimativa**) | 30 W | 720 h | ~21,6 | R$ 18 a R$ 26/mês |

Conclusão: **o custo de energia do lote é desprezível** (centavos a poucos reais por rodada). Manter o notebook ligado 24 h como servidor sai **mais caro** que um VPS de € 5,99 e ainda sofre com CGNAT e quedas.

## Pontos de quebra (qual cota estoura primeiro)

Estimativas a partir dos limites oficiais acima.

| Cenário | Weblate/DB local (≈300 MB por 1 M de palavras, pior caso) | D1 Free (5 GB; 100 mil escritas/dia) | Queues Free (≈ 3.300 mensagens/dia) | Workers AI Free (10 mil Neurons/dia) | Supabase Free (500 MB) |
|---|---|---|---|---|---|
| Hoje × 5 idiomas (≈ 0,8 M palavras) | ~0,24 GB | ok | ok se agrupar | **Neurons por palavra: não verificado** | ok |
| Hoje × 20 idiomas (≈ 3,2 M) | ~0,95 GB | ok | ~108 mil strings se uma por mensagem: **33 dias**; agrupe em lotes | provável limite primeiro, mas **não verificado** | ~950 MB: **estoura** se tudo for para o banco |
| 5x × 10 idiomas (≈ 7,9 M) | ~2,4 GB | ok | estoura sem agrupar | idem | **estoura** |
| 10x × 20 idiomas (≈ 31,6 M) | ~9,5 GB | **estoura os 5 GB** | estoura | idem | **estoura** |

- **Primeiro a quebrar no W2:** Supabase (500 MB) ou a escrita diária do D1 (100 mil linhas) quando a memória de tradução crescer; depois Queues (10 mil operações/dia).
- **Primeiro a quebrar no W1:** RAM (3 GB mínimo, 4 GB recomendado) vem antes do disco. Em 10x × 20, o banco chega perto de 10 GB, o que cabe em 40 GB de disco de um CX23.
- **Primeiro a quebrar no W3 em nuvem:** qualquer cota de IA gratuita (Workers AI). No notebook, o gargalo é o tempo de relógio, não custo.
- **W4:** GitHub Actions comporta (4 vCPU, 16 GB, 6 h por job, 20 jobs); o risco é ToS se virar computação pesada recorrente.

## Fallback pago de baixo custo

Fonte: hetzner.com/cloud/cost-optimized, lido em 2026-11-27. Preços mensais **sem IVA**.

| Plano | vCPU | RAM | Disco | Tráfego | Preço/mês | Serve ao W1? |
|---|---|---|---|---|---|---|
| CX23 | 2 (x86) | 4 GB | 40 GB | 20 TB | **€ 5,99** | Sim (no limite recomendado) |
| CAX11 | 2 (ARM) | 4 GB | 40 GB | 20 TB | € 6,49 | Sim (ARM64) |
| CX33 | 4 | 8 GB | 80 GB | 20 TB | € 8,99 | Folga para Celery + Valkey + PostgreSQL |
| CAX21 | 4 (ARM) | 8 GB | 80 GB | 20 TB | € 10,99 | Idem |

- Locais listados: NBG1 e HEL1 (UE); a página mostra "currently unavailable" para todos os planos na captura. Datacenters gerais: Falkenstein, Nuremberg, Helsinki, Singapura, Hillsboro, Ashburn. **Nenhum no Brasil**: latência maior, mas aceitável para uma ferramenta de tradução.
- Backups pagos do Hetzner: **não verificado**; custo extra provável. Alternativa: `pg_dump` agendado para R2 (10 GB grátis).
- Cobrança: Hetzner cobra por hora até o teto mensal; o teto é o preço do plano, **mas não há teto duro** contra recursos adicionais.
- Custo total estimado: **~€ 6 a € 11/mês (≈ R$ 38 a R$ 70/mês, conversão estimada)** para o W1. W2–W5 continuam grátis.

## Limitações

- Várias páginas oficiais não responderam ou não trazem o dado: FAQ da Oracle (HTTP 403); página de Tunnel e termos do Cloudflare não citam gratuidade; páginas de Azure e Netlify são genéricas. Tudo marcado "não verificado".
- A reportagem de InfoQ (redução do A1) e a fonte da Register (adiamento da taxa de self-hosted) são **secundárias**; confirmei apenas os valores atuais na documentação oficial.
- Sem medição de desempenho: os tempos de inferência são estimativas por ordem de grandeza; **nada foi executado**.
- Cotas de IA (Neurons/palavra) e uso real de Workers AI não foram calculados.
- Não verifiquei termos de uso de cada provedor para uso comercial; apenas o que as páginas oficiais lidas diziam.
- Preços em euro e dólar; nenhuma conversão cambial oficial foi buscada.
- Disponibilidade de capacidade (Oracle, Hetzner) muda por hora.

## Nível de confiança

| Afirmação | Confiança |
|---|---|
| Oracle A1 é 2 OCPU/12 GB hoje; regra de ociosidade de 7 dias | Alta (doc oficial) |
| A redução aconteceu em 2026-06-15 | Média (artigo secundário) |
| Falta de capacidade A1 em São Paulo | Baixa a média (relato anedótico, sem data) |
| Cota do Workers Free, D1, Queues, DO, Workers AI, Pages | Alta (docs oficiais) |
| Queues está no plano Free | Alta |
| Tunnel é gratuito e sem cartão | Baixa (não verificado nas páginas oficiais lidas) |
| GitHub Actions: 4 vCPU/16 GB, ARM, 6 h, 60 dias | Alta |
| GitHub self-hosted: nenhuma taxa hoje | Média a alta (billing docs "remains free"); risco de volta da taxa |
| GitHub Models aposentado | Alta (página oficial) |
| HF Spaces Docker/Gradio exigem plano pago | Alta (docs oficiais) |
| Supabase pausa em 1 semana; 2 projetos | Alta (página de preços) |
| Hetzner CX23 € 5,99 | Alta no preço; média na disponibilidade ("unavailable" na captura) |
| Vercel Hobby: restrição comercial | Não verificado |
| Estimativas de energia e tempo de inferência | Baixa a média (estimativas) |

## Perguntas em aberto

1. O Oracle exige cartão hoje para abrir conta, e o upgrade para PAYG preserva o A1 antigo (4 OCPU/24 GB)? A FAQ oficial não pôde ser lida.
2. O Cloudflare Tunnel é gratuito sem cartão, e como os ToS tratam tráfego não-HTML?
3. Quantos Neurons consome `m2m100-1.2b` por palavra? Decide se Workers AI serve como MT de contingência.
4. Qual a restrição comercial real do Vercel Hobby para um projeto open source com doações (se houver)?
5. A taxa de US$ 0,002/min de runner self-hosted será reintroduzida? Quando?
6. RTX 5070 laptop com CTranslate2/vLLM/llama.cpp sob WSL2: quais versões funcionam hoje?
7. "Hosted words" do Weblate conta cada tradução ou só a fonte?
8. Termos do ZeroGPU (cota diária) para conta gratuita.
9. Backup do Hetzner: preço e política atuais.
10. O Hetzner voltará a ter estoque do CX23 em NBG1/HEL1?

## Fontes

Todas lidas em **2026-11-27**, salvo indicação.

| Área da afirmação | URL | Data |
|---|---|---|
| Oracle Always Free (A1, ociosidade, bloco, saída) | https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm | 2026-11-27 |
| Oracle: redução do A1 (secundária) | https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/ | 2026-11-27 |
| Oracle: capacidade em São Paulo (comunidade) | https://community.oracle.com/CustomerConnect/discussion/949983/cannot-upgrade-free-tier-to-payg-a1-flex-out-of-capacity-in-sa-saopaulo-1-for-3-days | 2026-11-27 (conteúdo via resumo de busca) |
| Google Cloud free (e2-micro, Cloud Run, Firestore, trial) | https://docs.cloud.google.com/free/docs/free-cloud-features | 2026-11-27 |
| AWS Free | https://aws.amazon.com/free/ | 2026-11-27 |
| Azure free | https://azure.microsoft.com/en-us/pricing/free-services/ | 2026-11-27 |
| Cloudflare Workers limites | https://developers.cloudflare.com/workers/platform/limits/ | 2026-11-27 |
| Cloudflare Workers AI preços | https://developers.cloudflare.com/workers-ai/platform/pricing/ | 2026-11-27 |
| Cloudflare Workers AI limites | https://developers.cloudflare.com/workers-ai/platform/limits/ | 2026-11-27 |
| Cloudflare D1 | https://developers.cloudflare.com/d1/platform/pricing/ | 2026-11-27 |
| Cloudflare R2 | https://developers.cloudflare.com/r2/pricing/ | 2026-11-27 |
| Cloudflare Queues | https://developers.cloudflare.com/queues/platform/pricing/ | 2026-11-27 |
| Cloudflare Durable Objects | https://developers.cloudflare.com/durable-objects/platform/pricing/ | 2026-11-27 |
| Cloudflare Pages | https://developers.cloudflare.com/pages/platform/limits/ | 2026-11-27 |
| Cloudflare Tunnel (técnico) | https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/ | 2026-11-27 |
| Cloudflare CDN (termos) | https://www.cloudflare.com/service-specific-terms-application-services/ | 2026-11-27 |
| GitHub Actions billing | https://docs.github.com/en/billing/concepts/product-billing/github-actions | 2026-11-27 |
| GitHub runners hospedados | https://docs.github.com/en/actions/reference/runners/github-hosted-runners | 2026-11-27 |
| GitHub Actions limites | https://docs.github.com/en/actions/reference/limits | 2026-11-27 |
| GitHub Actions: workflows agendados desativados | https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows | 2026-11-27 |
| GitHub ToS (Actions, Pages) | https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features | 2026-11-27 |
| GitHub segurança (self-hosted, fork, pull_request_target) | https://docs.github.com/en/actions/reference/security/secure-use | 2026-11-27 |
| GitHub Pages limites | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits | 2026-11-27 |
| GitHub Models aposentado | https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models | 2026-11-27 |
| Taxa self-hosted adiada (secundária) | https://www.theregister.com/2025/12/17/github_charge_dev_own_hardware/ | 2026-11-27 (via busca) |
| Supabase | https://supabase.com/pricing | 2026-11-27 |
| Neon | https://neon.com/pricing | 2026-11-27 |
| Firebase Spark | https://firebase.google.com/pricing | 2026-11-27 |
| Render Free | https://render.com/docs/free | 2026-11-27 |
| Railway | https://docs.railway.com/reference/pricing/plans | 2026-11-27 |
| Fly.io | https://docs.fly.io/about/pricing | 2026-11-27 |
| Hugging Face Spaces | https://huggingface.co/docs/hub/spaces-overview | 2026-11-27 |
| Koyeb | https://www.koyeb.com/pricing | 2026-11-27 |
| Northflank | https://northflank.com/pricing | 2026-11-27 |
| Deno Deploy | https://deno.com/deploy/pricing | 2026-11-27 |
| Netlify | https://www.netlify.com/pricing/ | 2026-11-27 |
| Vercel Hobby | https://vercel.com/docs/plans/hobby | 2026-11-27 |
| Vercel fair use | https://vercel.com/docs/limits/fair-use-guidelines | 2026-11-27 |
| Turso | https://turso.tech/pricing | 2026-11-27 |
| Upstash Redis | https://upstash.com/pricing/redis | 2026-11-27 |
| Tailscale planos | https://tailscale.com/pricing | 2026-11-27 |
| Tailscale Funnel | https://tailscale.com/kb/1223/funnel | 2026-11-27 |
| Weblate requisitos | https://docs.weblate.org/en/latest/admin/install.html | 2026-11-27 |
| Tolgee self-hosting | https://docs.tolgee.io/platform/self_hosting/running_with_docker | 2026-11-27 |
| Hetzner Cloud (preços) | https://www.hetzner.com/cloud/cost-optimized/ | 2026-11-27 |
| NVIDIA CUDA no WSL2 | https://docs.nvidia.com/cuda/wsl-user-guide/index.html | 2026-11-27 |
| Tarifa ANEEL 2026 (projeção, via notícias; não a página da ANEEL) | https://www.gov.br/aneel/pt-br/assuntos/noticias/2026-defeso-eleitoral/bandeira-tarifaria-em-julho-permanece-amarela | 2026-11-27 (via busca) |
