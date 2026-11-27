# 03 — Pesquisa de mercado: plataformas e ferramentas de localização (open source)

Data da pesquisa: 2026-11-27. Papel: pesquisador de mercado open source, na discovery de infraestrutura de localização do RPGWorld. Só pesquisa, nada foi alterado no repositório além deste arquivo.

Regra de escrita: só afirmo limite, preço, licença ou data que vi numa fonte aberta nesta sessão. O que não consegui confirmar está marcado como **não verificado**. Todas as páginas foram lidas em 2026-11-27 (a tabela de Fontes no fim repete isso). Números do GitHub (estrelas, issues abertas, `pushed_at`) vêm da API pública, sem autenticação.

Premissas do RPGWorld que uso nas contas: ~5,4 mil strings, ~158 mil palavras (fonte em inglês), idiomas atuais en/pt/es/sv, dono único com trabalho fixo, fluxo git-native (PRs no GitHub), sem custo recorrente obrigatório, sem API de MT paga obrigatória, sem limite de volume imposto pelo software, licença compatível com uso comercial futuro.

---

## 1. Tabela comparativa

Legenda de "Aberto": **OSS** = todo o código sob licença aprovada pela OSI/FSF; **open core** = parte do código sob licença própria/proprietária ou recursos travados por chave; **SaaS** = só serviço.

| Ferramenta | Tipo | Licença (SPDX / observação) | Aberto? | Último release / atividade (verificado) | Limite imposto pelo software na edição grátis self-hosted | Git/PR nativo | MT própria/local (Ollama, LibreTranslate, endpoint OpenAI-compatível) | TM + glossário + checagens | RAM oficial |
|---|---|---|---|---|---|---|---|---|---|
| **Weblate** | Plataforma web | GPL-3.0 (docs: "3 ou posterior") | **OSS** (nenhum recurso travado encontrado) | `2026.11.2` em 2026-11-12; push em 2026-11-27 | Nenhum encontrado | Sim: PR/MR GitHub, GitHub App (hosted), GitLab, Gitea; auto-merge | Sim: LibreTranslate, LTEngine, Ollama, OpenAI com base URL custom, Anthropic, Mistral, DeepL etc. | Sim, tudo na edição livre; checagem `icu-message-format` existe | 3 GB / 2 CPU (host único); 4 GB p/ centenas de componentes |
| **Hosted Weblate (Libre)** | SaaS do Weblate | n/a (serviço) | SaaS sobre código OSS | Mesmo código | Plano Libre = limites do plano 160k hosted strings, só projetos públicos | Sim (GitHub App) | Os mesmos conectores, mas só os que o serviço expõe: **não verificado** | Sim | n/a |
| **Tolgee** | Plataforma web (Java/Spring) | Apache-2.0 fora de `ee/`; `ee/` e `webapp/src/ee` sob licença própria não comercial | **Open core** | `v3.248.1` em 2026-11-27 (releases quase diários) | Grátis: até 10 seats; sem licença: sem SSO, glossário/TM compartilhada, QA, webhooks, branching, tarefas | Integrações por SDK/CLI/Figma; sync Git/PR: **não verificado** | MT com chaves próprias; endpoint OpenAI-compatível/Ollama/LibreTranslate: **não verificado** (a doc lista Google, AWS, DeepL, Azure, Baidu, "AI Translator") | Glossário e TM compartilhada são pagos (self-hosted) | 4 GB mín. / 16 GB recomendado (+ Postgres) |
| **Mozilla Pontoon** | Plataforma web (Django) | BSD-3-Clause | **OSS** | Releases diários `v2026.11.26` | Nenhum, mas feito para o GCP da Mozilla | Sync por comando agendado, commit direto no remoto (sem PR documentado) | MT por APIs configuráveis (Google etc.) e OpenAI; Ollama/LibreTranslate: **não verificado** | TM, glossário: sim (docs de usuário); checagem ICU: **não verificado** | Sem requisitos documentados |
| **Traduora** (ever-traduora) | Plataforma web (NestJS) | AGPL-3.0 | **OSS** (marca registrada restrita) | `v0.23.0` em 2026-10-25 (release de segurança); commits diários em 2026-11-27, 1 autor | Nenhum encontrado | Não (README não cita) | MT: README diz "em breve" | Sem TM/glossário no README | Sem requisitos documentados |
| **Localazy** | SaaS | Não OSS (CLI/clientes: **não verificado**) | **SaaS** | n/a | Grátis: 200 chaves fonte | Sim (integrações), mas é SaaS | Créditos próprios (US$ 0,005/palavra IA) | Sim, no SaaS | n/a |
| **Crowdin (programa OSS)** | SaaS | Não OSS | **SaaS** | n/a | Grátis para OSS aprovado; quotas não publicadas | Sim | Sim (créditos/Global TM) | Sim | n/a |
| **Accent** (mirego) | Plataforma web (Elixir) | BSD-3-Clause (README: "New BSD") | **OSS** | push 2026-10-16; 23 issues | Nenhum encontrado | CLI + GraphQL; sync GitHub: **não verificado** | **não verificado** | **não verificado** | só Postgres 9.4+; RAM não documentada |
| **Texterify** (txty-io) | Plataforma web (Rails) | `NOASSERTION` no GitHub (licença própria; texto **não verificado**); chaves de licença basic/business/team no repo | **Open core / source-available (provável)** | push 2026-10-09; 203 estrelas | Planos pagos por chave: **não verificado** | **não verificado** | MT automática é do plano Business (SaaS) | Parcial no SaaS | Docker + compose; RAM não documentada |
| **Inlang (CLI + Fink + Paraglide)** | Ecossistema git-native (sem servidor) | MIT (repo e CLI) | **OSS** | push 2026-11-24 (`opral/inlang`) | Nenhum (não há servidor) | Totalmente git; Fink abre PR via GitHub | `machine translate` com provedor configurável/BYOK | `check`: variáveis, plural, vazio; Fink **sem TM e sem MT** | sem servidor |
| **Lingo.dev CLI** | CLI + engine em nuvem | Apache-2.0 (repo) | **OSS no CLI; engine é SaaS** | push 2026-11-20 | Sandbox: 100 mil tokens de saída/dia, pago por uso; BYOK só Enterprise | Sim (GitHub App abre PR) | CLI atual: não aceita LLM local (BYOK é Enterprise); CLI v0 legado: **não verificado** | Lockfile sim; glossário/TM: **não verificado** | n/a |
| **i18n-ai-translate** | CLI/Action Node | GPL-3.0 | **OSS** | push 2026-11-24; 104 estrelas; 1 mantenedor | Nenhum | GitHub Action; sem UI | Sim: OpenAI, Gemini, Claude, **Ollama** | Glossário e cache de TM por arquivo; `check` em CI | n/a (CLI) |
| **Languine** | CLI | MIT | **OSS** | último push 2026-05-09 (7 meses) | Nenhum | CLI | não verificado | não verificado | n/a |
| **translate-toolkit** | Biblioteca/CLI Python | repo `WeblateOrg/translate-toolkit`: não verificado (API 404 para `translate/`) | — | **não verificado** | — | — | — | — | — |
| **Zanata** | Plataforma web | LGPL-2.1 | OSS, **fim de vida** | Instância Red Hat desligada em 2024-09-09 (comunicado); repo com push 2026-10-20 sem sinal de projeto vivo | — | — | — | — | — |
| **Pootle** | Plataforma web | GPL-3.0 | OSS, **inativo** | Último release `2.8.2` em 2017-09-15; último push 2024-08-26 | — | — | — | — | — |
| **Mojito** (Box) | Plataforma web | Apache-2.0 | OSS | Último release `v0.110` em 2020-05-15; push 2026-11-09 | — | Sim (modelo Git) | — | — | — |
| **Okapi Framework** | Biblioteca/CLI Java | Apache-2.0 (GitLab) | **OSS** | 54 tags; commits recentes não confirmados | Nenhum | n/a | — | — | n/a |
| **OmegaT** | App desktop | GPL-3.0 | **OSS** | v6.1.1 (data **não verificada**) | Nenhum | "Team translations" (VCS: **não verificado**) | — | TM/glossário nativos | desktop |
| **Transifex (programa OSS)** | SaaS | Não OSS | **SaaS** | n/a | Grátis para OSS sem financiamento/receita | Sim | — | Sim | n/a |
| **POEditor / GitLocalize** | SaaS | Não OSS | **SaaS** | n/a | **não verificado** (páginas de OSS deram 404) | — | — | — | n/a |

---

## 2. Seções por candidato

### 2.1 Weblate (self-hosted)

**Saúde do projeto**
- Licença: GPL-3.0 segundo a API do GitHub; a doc oficial diz GPL versão 3 ou posterior, e que alguns módulos são MIT/ISC. A página de licença não menciona edição enterprise, componentes proprietários nem recursos travados (não encontrei nenhum nas fontes lidas).
- Releases: `weblate-2026.11` (2026-11-02), `2026.11.1` (2026-11-05), `2026.11.2` (2026-11-12). Último push no repositório em 2026-11-27. Criado em 2012. 6.188 estrelas, 451 issues abertas, 92 inscritos.
- Contribuidores, advisories e política de segurança: **não verificado** (não abri as páginas de Security do repositório).
- Quem financia: a Weblate s.r.o. vende hosting e suporte (preços abaixo). Risco de abandono baixo, risco de dependência de uma empresa pequena (Michal Čihař é o autor histórico; **bus factor exato não verificado**).
- Docs: extensas (admin, add-ons, checagens, formatos), um pouco lentas de navegar por serem muito grandes.

**Capacidades na edição livre**
- JSON aninhado: sim (`json-nested`, `i18nextv4`, Format.JS, go-i18n, ARB, WebExtension JSON). A página de formatos avisa que a detecção automática pode errar em variantes de JSON/YAML, então escolher o formato explicitamente.
- ICU MessageFormat: existe a checagem `icu-message-format` ("erros de sintaxe e/ou divergência de placeholders em strings ICU MessageFormat"), ativada por flag. A página de formatos não menciona next-intl; a compatibilidade do JSON de next-intl com `json-nested` precisa de teste (ver Perguntas em aberto).
- Conteúdo estruturado/markdown: checagens `md-link`, `md-reflink`, `md-syntax`, `placeholders`, `regex`, "Não segue o glossário", "Inconsistente", "Tradução não alterada", AI checks (precisão, fluência, terminologia).
- Memória de tradução e glossário: sim (TM fuzzy, `weblate-translation-memory`; glossário por projeto, usado também nos prompts de LLM).
- MT: lista oficial inclui LibreTranslate, LTEngine (API compatível com LibreTranslate sobre LLMs locais), Ollama, OpenAI com base URL personalizada, Anthropic, Mistral, Azure OpenAI, DeepL, Google, AWS e classe Python custom. Ordem: TM 100% tem prioridade e nenhuma MT roda nesse caso.
- Tradução automática incremental: add-on `weblate.autotranslate.autotranslate` roda na instalação, a cada atualização do componente, diariamente e em mudança de evento (serve para strings novas). Add-on `automation` permite sequência "TM antes de MT". Add-ons de flag "Needs rewriting"/"Needs checking" marcam o que veio de máquina para revisão humana.
- Revisão humana, sugestões, votação: não verifiquei a página de workflow nesta sessão, mas as menções em MT/add-ons ("Translated, Approved, Read-only") indicam estados de aprovação. **Votação da comunidade: não verificado.**
- GitHub: `create_merge_request` abre PR/MR (GitHub, GitHub App, Gitea, GitLab). `merge_request_merge_method` (merge/squash/rebase), `merge_request_automerge`, labels e assignee. Em self-hosted, a doc sugere HTTPS com token para um repositório ou usuário dedicado com chave SSH; o GitHub App é descrito para o Hosted Weblate. A doc de integração contínua recomenda **evitar squash merges de commits do Weblate** porque o Git pode deixar de reconhecê-los no upstream; mas o próprio `merge_request_merge_method` oferece `squash` (ponto a testar, porque a dona faz squash dos PRs).
- API REST e cliente `wlc` (lock/push/pull/unlock). Gestão de usuários/SSO: **não verificado** nesta sessão.
- Backup: BorgBackup integrado (retenção padrão 14 diários/8 semanais/6 mensais), `pg_dump` manual, backup por projeto exportável e importável em outra instância (desde 4.14). Restauração Docker documentada (volume Postgres, `database.sql`, `updategit --all`).

**Infraestrutura**
- Mínimo oficial: 3 GB de RAM, 2 núcleos, 1 GB de disco para host único (Weblate + banco + servidor web); "centenas de componentes" pedem 4 GB. Abaixo disso, usar Celery em processo único (`CELERY_WORKER_MODE: single`). Armazenamento de banco ~300 MB por milhão de hosted words.
- PostgreSQL 15+ (extensão trigram); Redis 6+ ou Valkey com RESP3. Há Celery para tarefas em segundo plano.
- Docker oficial `weblate/weblate`: tag `latest` com linux/amd64 e linux/arm64 (Docker Hub, empurrada "há 4 dias" na captura). Desde 2026.8 a imagem x86-64 exige CPU x86-64-v2 (SSE4.2).
- RAM ociosa real: não achei medição atual. Só um relato antigo (Weblate 3.3, 2018: ~100 MiB processo principal e ~150 MiB por worker). **Não verificado para 2026.** Medir com `docker stats` num piloto.
- Serverless: não, é aplicação Django com workers e Postgres/Redis permanentes.

### 2.2 Hosted Weblate e o plano Libre

Fatos vistos:
- Planos pagos por hosted strings (strings-fonte × (idiomas de tradução + 1)); idiomas, projetos, componentes e tradutores ilimitados: 10k €47/mês, 40k €70, 160k €114, 640k €193 (mensal, sem IVA); anual 10x o mensal.
- Trial: "14 dias grátis em todos os planos cloud". A página **não** diz o que acontece quando o trial termina.
- Libre: "mesmos limites do plano 160k, e só para projetos públicos"; pede-se pelo setup de hosting. Gratuito.
- Critérios (post de 2020-11-27, fonte mais antiga): código público num repositório suportado; licença aprovada como livre pela OSI ou reconhecida pela FSF; tamanho e receita do projeto não importam; 14 dias após o setup para pedir aprovação. O post não diz o que ocorre se não aprovar. Pode estar desatualizado.
- Fila: post de 2024-07-01 (Weblate) afirma que pedidos de Libre daquele ano esperaram mais do que o esperado, que o trial foi estendido e que nada foi removido sem querer. Relato de 2023 (lista JShelter): projeto sem resposta no ticket recebeu aviso de remoção do Hosted Weblate numa data fixa. Os dois são os únicos dados de "o que acontece" que encontrei; **tempo típico de aprovação em 2026: não verificado**; **política atual para trial vencido sem aprovação: não verificado** (confirmar com sales@weblate.org, endereço citado na página de hosting).
- Outro caso observado: um projeto (MapComplete) publicou "migramos porque excedemos o tier grátis aqui" no Hosted Weblate; a página deu 403, então **não li o texto completo**. Indica que o limite de hosted strings é aplicado na prática.

Conta com os números da dona (premissa: 5,4 mil strings-fonte; se for total, refazer): 5,4k × (3 + 1) = 21,6k hosted strings hoje. O teto Libre de 160k comporta ~29 mil strings-fonte com 4 idiomas, ou ~5,4k strings com 28 idiomas de tradução. Crescer para 20 mil strings-fonte e 7 idiomas de tradução já usa os 160k. Isso é aritmética minha, não afirmação do Weblate.

Risco de licença comercial futura: o Weblate não exige "sem produtos comerciais" nos critérios que li, mas a página atual não os lista; confirmar por escrito se recursos pagos no app mudam a elegibilidade.

### 2.3 Tolgee

**Saúde:** repositório `tolgee/tolgee-platform`, 4.166 estrelas, 220 issues abertas, criado em 2020-10-13; releases `v3.248.0`/`v3.248.1` em 2026-11-27 (muito ativo). Licença na API: `NOASSERTION`, por ser monorepo: Apache-2.0 fora de `ee/` e `webapp/src/ee`; o conteúdo EE está sob `ee/LICENSE`, que permite uso **somente não comercial** e proíbe contornar o mecanismo de chave de licença. Financiamento: empresa (Tolgee s.r.o.). Advisories/segurança: **não verificado**.

**Grátis self-hosted (página de preços self-hosted):** "grátis para até 10 seats", chaves e projetos ilimitados, "grátis para uso em produção e comercial, sem chave", só suporte da comunidade. Inclui localização padrão, in-context, MT/auto-tradução com chaves de provedor próprias, SDKs, Figma, MCP.
**Licença paga (Enterprise, preço por hosted words, sob cotação):** SSO (OpenID Connect), permissões granulares, branching, tarefas/review, **QA checks e webhooks**, **glossários e TM compartilhada**, AI translator e brand context, suporte premium. A página de preços da nuvem lista glossários, branching, tarefas e AI translator como recursos padrão da nuvem; isso contradiz o split do self-hosted, então vale o split do self-hosted para o caso da dona.
Observação de risco: um blog de terceiros descreve a presença do código EE nos binários oficiais como zona cinzenta de licença; o texto de `ee/LICENSE` que li não menciona assinatura, só "uso não comercial". Para um app que pode ter recursos pagos, usar o conjunto EE sem licença é arriscado. Não encontrei uma frase oficial dizendo o contrário.

**Infra:** mínimo oficial 2 CPUs e 4 GB RAM; recomendado 4 CPUs, 16 GB e 20 GB de disco. Postgres externo recomendado (v17); o Postgres embutido é PostgreSQL 13 (fim de vida em nov/2025, segundo a doc) e some na v4. LanguageTool opcional usa ~1–1,5 GB. Redis/S3 e ARM64: **não verificado**. RAM ociosa medida: **não verificado**. Backup: **não verificado**.
**Git:** sync nativo com PR no GitHub: **não verificado** (não achei a página; a busca não devolveu doc oficial).
**Formatos:** i18next/next-intl via SDK e CLI: **não verificado** nesta sessão.

### 2.4 Mozilla Pontoon

- Licença BSD-3-Clause, 1.680 estrelas, 307 issues abertas, releases diários (`v2026.11.26`). Financiada e operada pela Mozilla.
- README: auto-hospedagem possível, mas "projetada para o GCP"; as duas instâncias públicas rodam na MozCloud, algumas opções são "específicas da Mozilla", e o setup de desenvolvimento "não serve para produção". Suporte por GitHub Discussions, sem SLA.
- Sync: `./manage.py sync_projects` pelo menos a cada hora; faz commit das mudanças do banco no remoto VCS e puxa as novas; tarefa Celery com lock de uma por projeto. Não encontrei PR automático documentado.
- Formatos (lista de build de 2024, indireta): `.json` (WebExtensions e chave-valor), `.po`, `.properties`, `.xliff`, `.ftl`, Android XML etc. next-intl/ICU: **não verificado**.
- Recursos exigem Celery, banco, SMTP, cache; requisitos de hardware: **não documentados**.
- Conclusão: bom para comunidades grandes de localização (modelo Mozilla), pesado e pouco "portável" para um mantenedor solo.

### 2.5 Traduora (ever-traduora)

Contradiz a suposição comum de abandono: o repositório tem `v0.22.0` e `v0.23.0`, ambos em 2026-10-25 (o 0.23.0 é release de segurança, "corrige duas vulnerabilidades"); o anterior era `v0.21.0` em 2025-06-22, uma lacuna de ~16 meses. Em 2026-11-27 há commits no mesmo dia (correções de segurança, rate-limit, "organizations as tenants (Traduora SaaS P1)"), todos de um único autor (`evereq`). Interpretação: retomado há pouco, por uma empresa (Ever Co.) que prepara um SaaS; bus factor 1. Licença AGPL-3.0; marca "Traduora" restrita sem permissão escrita.
Capacidades (README): importa/exporta JSON (plano e aninhado), CSV, YAML, Properties, XLIFF 1.2, PO, Strings, Android XML; REST API; CLI não oficial. MT: "em breve". TM, glossário, git: não mencionados. Sem requisitos de hardware documentados. Conclusão: vivo mas imaturo para o escopo (sem TM, sem MT, sem Git).

### 2.6 Localazy (comparação não OSS)

Plano grátis: até 200 chaves-fonte, assentos e idiomas ilimitados. Pagos: Professional US$ 34/mês (1.000 chaves), Autopilot US$ 78 (3.500), Business US$ 175 (10.000); créditos de MT à parte (US$ 0,005/palavra IA em média). A página não cita programa OSS (cita contas básicas para ONGs e um Ambassador Program). Com 5,4 mil chaves, ficaria no Business ou acima. Não é open source (**licença do CLI: não verificado**).

### 2.7 Crowdin: programa para open source

Critérios (página oficial do programa, todos exigidos exceto para clientes pagos): projeto criado no Crowdin; licença aprovada por iniciativa open source; código publicamente baixável; **sem produtos comerciais relacionados ao projeto**; ser o líder do projeto; pelo menos três meses de trabalho; comunidade ativa; seção de novidades do site atualizada; builds regulares. Condições: entrar no grupo beta e **contribuir as traduções para o Crowdin Global TM**. Limites/quotas e duração: a página não informa. O pagamento da quota de hosted words explica o estouro de nov/2026 que a dona já viveu; sem limites publicados, não dá para planejar. Conflito com o RPGWorld: "sem produtos comerciais" é incompatível com a possibilidade de recursos pagos futuros. Os preços pagos não aparecem na página de preços lida.

### 2.8 Accent (mirego)

BSD-3-Clause, 1.494 estrelas, 23 issues, push em 2026-10-16. Elixir/Phoenix + Postgres (única dependência externa), imagem Docker `mirego/accent`, histórico e rollback, CLI, API GraphQL, login por GitHub/GitLab/Google/Slack/OIDC. Copyright no README: Mirego 2015–2019 (texto antigo). TM, MT, ICU e GitHub sync: **não verificado**. Candidato menor, sem os recursos que a dona pede (TM, MT automática).

### 2.9 Texterify

Licença: `NOASSERTION` no GitHub, `LICENSE` não encontrado no caminho principal; repositório com arquivos de chave de licença "basic/business/team" → provável modelo open core; **licença exata e limites do self-hosted: não verificado**. Cloud grátis: 1 usuário, 1 projeto, 2 idiomas; MT automática só no plano Business (€39/usuário/mês). Rejeitado por falta de clareza de licença.

### 2.10 Inlang (CLI, Fink, Paraglide)

MIT. `@inlang/cli`: `check` (faltando, vazio, variáveis, plural/select, não usadas) com saída 1 em CI e JSON; `machine translate` opcional (General Translation recomendado, serviço comunitário que não é afiliado, ou BYOK); `lint`/`validate` estão deprecados. Plugins: i18next, **next-intl**, **ICU MessageFormat v1**, inlang message format; detecção de mensagens não usadas só vale para next-intl ≥ 2.4.0, não para JSON/ICU genéricos. Fink: editor web gratuito e MIT, tradutor precisa de conta GitHub para salvar, mudanças viram branch/PR (fork para quem não tem escrita), **sem TM e sem MT**, só GitHub. Sem servidor. Paraglide JS (MIT, push em 2026-11-26) é uma biblioteca de i18n, **não** substitui next-intl sem reescrever o app. Servirá como "linter em CI + editor de PR", não como plataforma de TM/glossário.

### 2.11 Lingo.dev CLI

Repo Apache-2.0 (5.397 estrelas, 19 issues, push em 2026-11-20). **Contradiz a suposição de "CLI local com lockfile e LLM próprio":** o CLI atual (`@lingo.dev/cli`) usa um "engine" na nuvem ("a tradução roda no servidor"; autenticação e `lingo link`). Preços: Sandbox US$ 0 + uso (limite 100 mil tokens de saída/dia), Production US$ 99/mês + uso; **BYOK só no Enterprise**. Lockfile existe (`.lingo/lock.json`, versionado) e a execução é incremental. Um CLI "v0" legado (`i18n.json` + `i18n.lock` com checksums de fonte) ainda tem doc, mas é descrito como o pacote antigo; se aceita Ollama/BYOK: a busca indicou provider block com openai/anthropic/google/mistral/openrouter/ollama, mas a página de referência que abri não confirmou, então **não verificado**. Para RPGWorld: não atende "sem SaaS recorrente" com o CLI atual.

### 2.12 i18n-ai-translate

GPL-3.0, 104 estrelas, 12 issues, push em 2026-11-24, pacote npm `5.4.0`, mantenedor único (taahamahdi). Motores: OpenAI, Gemini, Claude, **Ollama local**. Formatos: i18next JSON (padrão), PO, `.properties`, `.strings`. Comandos: `translate`, `diff` (só chaves novas/alteradas, remove excluídas), `check` (sai ≠0 em CI). Glossário em arquivo, contexto, cache de TM, dry-run, dicas de plural CLDR, GitHub Action. Preserva placeholders e verifica a tradução contra a fonte. É a peça mais próxima de "MT incremental barata e local", mas não há revisão humana, TM central, votação ou interface: usar como gerador de rascunho em PR ou alimentar o Weblate. GPL-3.0: sem problema se usada como ferramenta externa, não incorporada ao app.

### 2.13 Outros

- **Languine** (MIT, 2.031 estrelas): último push 2026-05-09, ~7 meses sem atividade; detalhes **não verificados**.
- **Zanata**: LGPL-2.1; Red Hat desligou `translate.zanata.org` em 2024-09-09; Fedora e OpenStack migram para Weblate. Fim de vida.
- **Pootle**: GPL-3.0; último release 2017-09-15; inativo.
- **Mojito** (Box): Apache-2.0; último release `v0.110` em 2020-05-15, 49 issues; baixa atividade de produto.
- **Okapi Framework**: Apache-2.0, GitLab, 54 tags, "framework multiplataforma para ferramentas de localização"; Tikal: **não verificado**. Serve como biblioteca de conversão de formatos, não como plataforma.
- **OmegaT**: GPL-3.0, v6.1.1, ferramenta desktop de CAT; "team translations" existe, mas a página não menciona git. Inadequada para colaboração aberta.
- **Transifex (programa OSS)**: código público em licença aprovada pela OSI **e nenhum financiamento, receita ou modelo de comercialização**. Quotas não publicadas. Incompatível com recursos pagos futuros.
- **POEditor, GitLocalize, translate-toolkit (WeblateOrg)**: as páginas relevantes deram 404; tudo **não verificado**.
- **Plataformas local-first/serverless**: não encontrei nenhuma que ofereça TM + glossário + revisão sem servidor. O mais próximo é Inlang (git como banco).

---

## 3. Open source × open core, por ferramenta

| Ferramenta | Classificação | Detalhe |
|---|---|---|
| Weblate | **100% OSS** (GPL-3.0) | A doc de licença não cita edição EE/recursos travados. Vende hosting e suporte. |
| Pontoon | OSS (BSD-3-Clause) | Mantida pela Mozilla; algumas opções específicas de lá. |
| Traduora | OSS (AGPL-3.0) | Marca registrada restrita; AGPL obriga a abrir mudanças se oferecida como serviço de rede. |
| Accent | OSS (BSD-3-Clause) | — |
| Inlang CLI/Fink/Paraglide | OSS (MIT) | Serviços hospedados opcionais "futuros" (inlang Cloud). |
| i18n-ai-translate | OSS (GPL-3.0) | — |
| Languine | OSS (MIT) | Sem atividade recente. |
| Okapi, Mojito, Zanata, Pootle, OmegaT | OSS | Estado variado (ver acima). |
| **Tolgee** | **Open core** | Apache-2.0 + `ee/` não comercial com chave de licença; features pagas no self-hosted: SSO, branching, tarefas, QA, webhooks, glossário/TM compartilhada. |
| **Texterify** | Provável open core/source-available | Licença `NOASSERTION`; chaves de licença no repo. |
| **Lingo.dev** | OSS no CLI, SaaS no motor | Apache-2.0 só no repositório; tradução roda no servidor deles. |
| Crowdin, Localazy, Transifex, POEditor, GitLocalize | **SaaS fechado** | Programas "OSS" são concessão do vendedor, com critérios próprios. |

---

## 4. Shortlist (máx. 4) e rejeições

**Shortlist**

1. **Weblate self-hosted** (GPL-3.0, sem split EE visto). Cobre todos os itens do dono: Git/PR, TM, glossário, checagem ICU, add-on de autotradução incremental com Ollama/LibreTranslate/OpenAI-compatível, revisão, API. Custo: operar Django + Postgres + Valkey/Redis + Celery, 3–4 GB de RAM, e um piloto para medir RAM ociosa. Risco: squash merge (documentado como problema) e compatibilidade do JSON do next-intl.
2. **Hosted Weblate Libre** como ponte ou destino (mesmo software, zero ops, 160k hosted strings, só público). Depende de aprovação por pessoas, sem prazo verificado, e do que acontece no fim do trial (não verificado). Vantagem: migrar entre Hosted e self-hosted mantém os formatos e o fluxo (o backup por projeto é exportável para outra instância).
3. **Inlang CLI + Fink** (MIT, sem servidor) como plano B leve: `check` em CI para variáveis/plural/ICU, `machine translate` BYOK, edição comunitária por PR. Perde TM, glossário e revisão estruturada; Fink só GitHub.
4. **i18n-ai-translate** (GPL-3.0, Ollama local) como motor de rascunho incremental (`diff`) para qualquer das opções acima, sem MT paga.

**Rejeições**

- **Tolgee**: open core; glossário, TM compartilhada, QA e webhooks pedem licença no self-hosted; `ee/LICENSE` é não comercial; 4 GB mín./16 GB recomendado; sync Git não confirmado.
- **Crowdin OSS e Transifex OSS**: critérios de "sem produtos/financiamento comercial" colidem com recursos pagos futuros; quotas desconhecidas; lock-in e doação de TM ao Global TM (Crowdin).
- **Localazy**: 200 chaves grátis, não OSS.
- **Lingo.dev (CLI atual)**: motor em nuvem, BYOK só Enterprise, cobrança por uso.
- **Pontoon**: desenhado para GCP/Mozilla, sem PR automático, sem requisitos documentados, peso operacional alto.
- **Traduora**: sem TM/MT/Git, retomada recente com bus factor 1.
- **Accent, Texterify**: recursos essenciais não confirmados; Texterify com licença opaca.
- **Zanata, Pootle, Mojito**: fim de vida, inativo ou sem releases há anos.
- **OmegaT, Okapi**: não são plataformas colaborativas.

---

## 5. Limitações

- Usei WebFetch (um modelo pequeno resume a página), então detalhes finos podem ter perdido nuance; números e datas que importam vêm de JSON da API do GitHub ou de páginas oficiais.
- Várias páginas deram 403/404 (Hosted Weblate `/hosting/`, projeto MapComplete, GitLocalize, POEditor, OmegaT no GitHub, `ee/LICENSE` do Texterify). Nada disso foi preenchido de memória.
- Não medi RAM de nenhuma ferramenta; só números oficiais e um relato antigo do Weblate (2018).
- Não verifiquei contribuidores, advisories nem SECURITY.md de nenhum projeto.
- Contagens de strings e a conta do Libre dependem da premissa de que "5,4 mil" são strings-fonte.
- O Weblate "2026.x" e vários números vêm de docs em `latest`; versões mudam rápido.

## 6. Nível de confiança

| Afirmação | Confiança |
|---|---|
| Weblate é GPL-3.0 e ativo (release 2026.11.2 em 2026-11-12) | Alta (API GitHub + doc de licença) |
| Weblate: 3 GB/2 CPU mínimo, 4 GB para centenas de componentes, PG 15+, Valkey/Redis 6+ | Alta (doc oficial) |
| Weblate: PR automático, Ollama/LibreTranslate/OpenAI custom, add-on autotranslate, checagem ICU | Alta (docs oficiais) |
| Weblate: nenhum recurso travado/EE | Média (a doc de licença não menciona; não procurei em todo o código) |
| Weblate: imagem arm64 | Alta (Docker Hub) |
| Weblate: RAM ociosa real | Não verificado |
| Libre = limites do 160k, só projetos públicos | Alta (página oficial) |
| Critérios do Libre (código público, licença OSI/FSF, 14 dias) | Média-baixa (post de 2020) |
| Espera típica e política de trial vencido | Não verificado (só relatos de 2023 e 2024) |
| Tolgee: split de recursos grátis × pago no self-hosted | Alta (página de preços self-hosted) |
| Tolgee: `ee/LICENSE` não comercial | Média-alta (resumo da licença; não li o arquivo inteiro) |
| Tolgee: 4 GB/16 GB | Alta (doc oficial) |
| Crowdin OSS: 9 critérios e Global TM | Alta (página oficial); quotas não verificadas |
| Traduora ativo, 1 autor, release de segurança em 2026-10-25 | Alta (API GitHub) |
| Lingo.dev CLI atual depende de engine na nuvem e BYOK é Enterprise | Alta (páginas oficiais); CLI v0 com Ollama: não verificado |
| i18n-ai-translate suporta Ollama, `diff`, glossário | Média-alta (README no npm) |
| Inlang CLI/Fink funcionalidades | Alta (páginas oficiais) |
| Pontoon: sync por comando, sem PR documentado | Média (doc de deploy) |
| Zanata, Pootle em fim de vida/inatividade | Alta (comunicados e releases) |

## 7. Perguntas em aberto

1. Quanto o Weblate leva hoje para aprovar o Libre e o que acontece com o projeto ao fim do trial se ainda não aprovado? (Perguntar a sales@weblate.org antes de depender dele.)
2. O Libre fica em risco se o RPGWorld tiver recursos pagos? Nenhum critério que li exclui isso, mas a página de critérios atual não foi lida.
3. O JSON do next-intl (ICU, aninhado) funciona com `json-nested` + `icu-message-format` sem quebrar plurais e `{count, plural, ...}`? Precisa de um teste real.
4. O Weblate lida bem com PRs que a dona faz **squash**? A doc de integração contínua desaconselha; a opção `merge_request_merge_method=squash` existe.
5. O GitHub App do Hosted Weblate também funciona em self-hosted ou só no hosted?
6. RAM ociosa do Weblate (Docker, Celery `single`) com ~5k strings e 4 idiomas: medir num piloto.
7. Os JSONs de conteúdo (SRD) com expressões de dados e markdown: o Weblate preserva e checa `{...}`/markdown? Testar um arquivo.
8. Tolgee: existe sync com Git/PR, e aceita endpoint OpenAI-compatível? Não confirmei.
9. Traduções de LLM local (Ollama) para sv/es/pt de termos de D&D: qualidade e custo de GPU/CPU; fora do escopo desta pesquisa.

## 8. Fontes (todas lidas em 2026-11-27)

| Área | URL | Data de verificação |
|---|---|---|
| Weblate: preços/Libre/hosting | https://weblate.org/en/hosting/ | 2026-11-27 |
| Weblate: Libre e trial | https://weblate.org/try/ | 2026-11-27 |
| Weblate: critérios Libre (2020) | https://weblate.org/news/archive/weblate-even-more-open-now/ | 2026-11-27 |
| Weblate: fila Libre (2024-07-01) | https://weblate.org/news/archive/versions-libre-projects-company/ | 2026-11-27 |
| Weblate: relato de remoção (2023) | https://lists.gnu.org:443/archive/html/js-shield/2023-09/msg00011.html | 2026-11-27 (via busca; trecho de resultado) |
| Weblate: instalação/requisitos | https://docs.weblate.org/en/latest/admin/install.html | 2026-11-27 |
| Weblate: Docker/workers/RAM | https://docs.weblate.org/en/latest/admin/install/docker.html | 2026-11-27 |
| Weblate: MT | https://docs.weblate.org/en/latest/admin/machine.html | 2026-11-27 |
| Weblate: add-ons | https://docs.weblate.org/en/latest/admin/addons.html | 2026-11-27 |
| Weblate: formatos | https://docs.weblate.org/en/latest/formats.html | 2026-11-27 |
| Weblate: checagens | https://docs.weblate.org/en/latest/user/checks.html | 2026-11-27 |
| Weblate: integração contínua | https://docs.weblate.org/en/latest/admin/continuous.html | 2026-11-27 |
| Weblate: VCS/PR | https://docs.weblate.org/en/latest/vcs.html | 2026-11-27 |
| Weblate: backup | https://docs.weblate.org/en/latest/admin/backup.html | 2026-11-27 |
| Weblate: licença | https://docs.weblate.org/en/latest/contributing/license.html | 2026-11-27 |
| Weblate: repo e releases | https://api.github.com/repos/WeblateOrg/weblate (e `/releases`) | 2026-11-27 |
| Weblate: Docker Hub | https://hub.docker.com/r/weblate/weblate/tags | 2026-11-27 |
| Tolgee: repo/releases | https://api.github.com/repos/tolgee/tolgee-platform (e `/releases`) | 2026-11-27 |
| Tolgee: licença | https://raw.githubusercontent.com/tolgee/tolgee-platform/main/LICENSE e `/ee/LICENSE` | 2026-11-27 |
| Tolgee: preços self-hosted | https://tolgee.io/pricing/self-hosted | 2026-11-27 |
| Tolgee: preços cloud | https://tolgee.io/pricing | 2026-11-27 |
| Tolgee: requisitos | https://docs.tolgee.io/platform/self_hosting/getting_started | 2026-11-27 |
| Tolgee: Docker | https://docs.tolgee.io/platform/self_hosting/running_with_docker | 2026-11-27 |
| Tolgee: MT | https://docs.tolgee.io/platform/translation_process/machine_translation | 2026-11-27 |
| Tolgee: licenciamento | https://docs.tolgee.io/platform/self_hosting/licensing | 2026-11-27 |
| Pontoon: repo/releases | https://api.github.com/repos/mozilla/pontoon (e `/releases`) | 2026-11-27 |
| Pontoon: README | https://raw.githubusercontent.com/mozilla/pontoon/main/README.md | 2026-11-27 |
| Pontoon: deploy | https://pontoon.mozilla.org/docs/dev/deployment/ | 2026-11-27 |
| Pontoon: admin | https://pontoon.mozilla.org/docs/admin/ | 2026-11-27 |
| Traduora: repo/releases/commits | https://api.github.com/repos/ever-co/ever-traduora (e `/releases`, `/commits`) | 2026-11-27 |
| Traduora: README | https://raw.githubusercontent.com/ever-co/ever-traduora/develop/README.md | 2026-11-27 |
| Localazy: preços | https://localazy.com/pricing | 2026-11-27 |
| Crowdin: programa OSS | https://crowdin.com/product/for-open-source | 2026-11-27 |
| Crowdin: preços | https://crowdin.com/pricing | 2026-11-27 |
| Transifex: programa OSS | https://www.transifex.com/open-source/ | 2026-11-27 |
| Accent | https://api.github.com/repos/mirego/accent e README raw | 2026-11-27 |
| Texterify | https://api.github.com/repos/txty-io/texterify, https://github.com/texterify/texterify, https://texterify.com/pricing | 2026-11-27 |
| Inlang | https://raw.githubusercontent.com/opral/inlang/main/README.md, https://api.github.com/repos/opral/inlang | 2026-11-27 |
| Inlang CLI | https://inlang.com/m/2qj2w8pu/app-inlang-cli | 2026-11-27 |
| Fink | https://fink.inlang.com/ | 2026-11-27 |
| Paraglide | https://api.github.com/repos/opral/paraglide-js | 2026-11-27 |
| Lingo.dev | https://api.github.com/repos/lingodotdev/lingo.dev, https://github.com/lingodotdev/lingo.dev, https://lingo.dev/en/pricing, https://lingo.dev/en/cli/fundamentals/how-it-works, https://lingo.dev/en/docs/devtools/cli-v0 | 2026-11-27 |
| i18n-ai-translate | https://api.github.com/repos/taahamahdi/i18n-ai-translate, https://unpkg.com/i18n-ai-translate@5.1.0/README.md, https://registry.npmjs.org/i18n-ai-translate | 2026-11-27 |
| Languine | https://api.github.com/repos/languine-ai/languine | 2026-11-27 |
| LibreTranslate | https://api.github.com/repos/LibreTranslate/LibreTranslate | 2026-11-27 |
| Zanata, Pootle, Mojito | https://api.github.com/repos/zanata/zanata-platform; https://api.github.com/repos/translate/pootle (+`/releases`); https://api.github.com/repos/box/mojito (+`/releases`); busca com comunicados Red Hat/Fedora/OpenStack | 2026-11-27 |
| Okapi, OmegaT | https://gitlab.com/okapiframework/Okapi; https://omegat.org/ | 2026-11-27 |
