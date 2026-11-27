# Licenças e infraestrutura de localização: o que significam para o RPGWorld

Pesquisa feita em 2026-11-27. **Não sou advogado e este documento não é aconselhamento jurídico.** Onde a conclusão é interpretação minha e não texto de licença, está marcado. Nada do repositório foi enviado a serviço externo.

## Resumo

| Coisa | Licença (verificada) | OK para futuro comercial? | Obrigação principal |
| --- | --- | --- | --- |
| Código do RPGWorld | GPL-3.0-or-later (`LICENSE`, `package.json`) | Sim: a GPL permite cobrar e vender. Fechar módulos pagos exige ser titular de todo o código | Quem recebe uma cópia recebe o código; contribuidores de código mantêm o copyright deles |
| Weblate (plataforma) | GPL-3.0-or-later | Sim, rodando sem modificar | Só ao distribuir cópia ou fork; rodar como serviço não obriga a publicar nada (GPL, não AGPL) |
| Tolgee | Apache-2.0 fora de `ee/` e `webapp/src/ee`; **Tolgee EE License v1** dentro | Núcleo sim; `ee/` **não**: só uso não comercial e sem oferecer como serviço | Não contornar chaves de licença; manter avisos |
| Pontoon | BSD-3-Clause ("New BSD") | Sim | Manter aviso de copyright |
| Traduora | AGPL-3.0 | Sim rodando sem modificar; fork modificado exposto em rede deve publicar fonte | §13 AGPL. Estado de manutenção não confirmado |
| SRD 5.1 (en) | CC-BY-4.0 **e** OGL 1.0a, à escolha | Sim | Atribuição, indicar mudanças; se usar OGL, texto da licença e Section 15 |
| SRD 5.2 / 5.2.1 | CC-BY-4.0 | Sim | Atribuição, indicar mudanças |
| pt do SRD 5.1 (Foundry VTT Brasil) | Texto traduzido declarado OGL 1.0a; MIT só no código do módulo (segundo o `NOTICE.md`) | Sim, como OGC | Manter OGL + Section 15 + créditos |
| pt/es do SRD 5.2 (decito; sinregistrar) | decito: **sem licença declarada**; sinregistrar: CC-BY-4.0 | decito: **não usar texto sem permissão** | Atribuição (sinregistrar) |
| 5e SRD API / 5e-bits | MIT sobre dados SRD | Sim | Aviso MIT |
| NLLB-200 (pesos) | CC-BY-NC-4.0; ficha: "research model... not released for production deployment" | **Desqualificado para uso comercial dos pesos**; saídas: zona cinzenta | Evitar |
| MADLAD-400 | Apache-2.0 (verificado em `madlad400-3b-mt`) | Sim | Aviso Apache; ficha diz "not assessed for production" |
| OPUS-MT | Varia: `opus-mt-tc-big-en-pt` CC-BY-4.0; `opus-mt-en-ROMANCE` Apache-2.0 | Sim | Conferir modelo a modelo |
| Gemma 1 a 3 | Gemma Terms of Use + Prohibited Use Policy | Com condições | Termos repassados; texto não relido hoje |
| Gemma 4 (abril/2026) | Apache-2.0 | Sim | Aviso Apache |
| Llama 3.x | Llama Community License | Sim com condições | "Built with Llama", nome "Llama" em modelo derivado, AUP, 700M MAU |
| Qwen | Qwen3: Apache-2.0; Qwen2.5-3B: `qwen-research`; Qwen2.5-72B: `qwen` | Depende do tamanho/geração | Checar cada modelo |
| Mistral | 7B v0.3 e Small 24B 2501: Apache-2.0; Large 2411: MRL | Só os Apache | MRL é não comercial |
| Tower (Unbabel) | CC-BY-NC-4.0 (+ licença Llama 2 na base) | **Não** | Evitar |
| Aya Expanse | CC-BY-NC-4.0 + AUP da Cohere | **Não** | Evitar |
| LibreTranslate | AGPL-3.0 | Chamar por HTTP sem modificar: sim | §13 só se modificar |
| Argos Translate (código) | MIT ou CC0 | Sim | Licença dos pacotes de modelo não declarada no repositório; verificar pacote a pacote |
| CTranslate2, llama.cpp, Ollama | MIT | Sim | Aviso MIT |
| translate-toolkit | GPL-3.0 | Chamar como processo: sim | Não linkar em biblioteca de licença incompatível |

## 1. Plataformas copyleft e open-core auto-hospedadas

**Rodar sem modificar, para a comunidade.** A GPL não impõe nada a quem apenas executa o programa; a obrigação de oferecer fonte nasce ao *distribuir* cópias. O FSF diz que a GPL "permite que qualquer um faça uma versão modificada e a use sem nunca distribuí-la" (FAQ `UnreleasedMods`). Para a **AGPL** (Traduora, LibreTranslate) a regra muda só se você *modificar* e deixar usuários interagirem pela rede: aí precisa oferecer o fonte modificado (FAQ `UnreleasedModsAGPL`; §13 da AGPL). Rodar a AGPL sem modificar não dispara o §13 (leitura padrão; confiança média-alta).

**Modificar.** Weblate (GPL): modificação privada e uso em servidor não obriga publicar; se você *distribuir* a imagem modificada (ex.: Docker Hub), precisa do fonte sob GPL. AGPL: modificou e expõe em rede, publica. Em ambos, um fork continua copyleft.

**"Contamina" os arquivos traduzidos ou o app?** Não. O FSF: "a saída de um programa não é, em geral, coberta pelo copyright do código do programa" (`WhatCaseIsOutputGPL`) e controlar a saída "é, em geral, legalmente impossível", salvo se partes substanciais do próprio programa forem copiadas para a saída (`GPLOutput`). Os `messages/*.json` exportados pelo Weblate não herdam a GPL dele. Na outra direção, o app RPGWorld já é GPL-3.0-or-later, então mesmo um caso hipotético seria compatível.

**Weblate vs. módulos MIT/ISC.** A página de licença do Weblate avisa que alguns módulos usam MIT ou ISC (confiança alta).

**Open-core (Tolgee).** O `LICENSE` raiz diz que o conteúdo de `ee/` e `/webapp/src/ee` segue `ee/LICENSE`; o resto é Apache-2.0. A **Tolgee EE License v1** permite produção só "enquanto você NÃO usa o software para fins comerciais" (comercial = lucro, pagamento ou vantagem econômica direta ou indireta), proíbe oferecê-lo como serviço hospedado ou gerenciado e proíbe "mover, alterar, desativar ou contornar" as chaves de licença; uso fora dos termos encerra a licença (reinstaurada se cessar em 30 dias). Consequência: usar só o núcleo Apache é livre; **ativar recurso `ee` num projeto que depois cobra por algo é risco real** (vantagem econômica indireta). Interpretação minha: se o RPGWorld virar parcialmente pago, o Tolgee com `ee` ligado fica fora.

## 2. Compatibilidade com um futuro comercial

- **App GPL-3.0-or-later:** a GPL permite vender cópias e serviços. O que ela impede é fechar o código *de terceiros* que você não tem o direito de relicenciar. Como há contribuidores de código, quem quiser oferecer módulo proprietário ou dual licensing precisa ser titular de tudo (CLA ou cessão) ou ficar com a GPL. Decisão em aberto para a mantenedora.
- **Traduções da comunidade.** Cada tradutor é autor do que escreve (no Brasil, autor é pessoa física, Lei 9.610/98 art. 11; tradução é obra protegida, art. 7º XI). Os `messages/*.json` estão no repositório GPL, então na prática já saem sob GPL, mas isso deve estar **escrito**. O Weblate tem exatamente os dois recursos: "License of the translation (does not need to be the same as the source code license)" e "Contributor license agreement which needs to be approved before a user can translate" (docs de configuração de componentes), no nível de projeto e de componente. A própria documentação do Weblate diz que você "deve evitar exigir um CLA, embora seja possível".
- **Recomendação:** sem CLA. Definir a licença da tradução no Weblate (a mesma do app, GPL-3.0-or-later, ou CC-BY-4.0 para strings) e escrevê-la no CONTRIBUTING. Isso cobre o futuro pago *desde que* as traduções continuem sob a licença livre publicada. Se um dia quiser relicenciar só as traduções em proprietário, precisará de consentimento de cada contribuidor; esse é o único ponto que um CLA resolveria. Confiança média; é decisão de política, não de lei.
- **Plataforma escolhida:** nenhuma das plataformas lista (Weblate, Pontoon, Tolgee núcleo, Traduora) reivindica propriedade das traduções. O limite comercial está só no Tolgee `ee`.

## 3. Licenças de conteúdo

**CC-BY-4.0 (SRD 5.1 e 5.2/5.2.1).** O texto legal define *Adapted Material* como material "derivado de ou baseado em" o original em que ele é "traduzido, alterado, arranjado, transformado ou de outro modo modificado" (resumo do texto legal; a frase inteira excede o que a ferramenta devolveu). Logo, **tradução é adaptação**, permitida pela concessão da §2(a)(1) (mundial, isenta de royalties, irrevogável, sem cláusula NC). Condições da §3(a): atribuição; **"indicar se você modificou o material"** e manter indicação de modificações anteriores; indicar a licença; "de qualquer maneira razoável" ao meio; remover a informação se o licenciante pedir; sem termos adicionais que restrinjam o direito do destinatário (§2(a)(5)). Marcas e patentes não são licenciadas (§2(b)(2)). A WotC afirma que "o único requisito é a atribuição" e que SRD 5.1/5.2 ficam permanentemente sob CC. Também diz que a licença não cobre streaming, fan art, cosplay. O `NOTICE.md` já traz a atribuição e a nota de que o RPGWorld não é afiliado à WotC; falta (confiança média) uma frase padronizada "traduzido/adaptado do SRD; alterações: tradução, marcação de tags e tabelas" por idioma, que é a forma de "indicar mudanças". Tradução automática não muda essa obrigação: a obra continua adaptação.

**CC-BY-4.0 e GPL.** O CC diz que BY-SA 4.0 é compatível de mão única com GPLv3; BY (permissiva) pode ser incorporada, mas a GPL não relicencia o texto do SRD: ele segue CC-BY dentro de `content/`. Prática atual (conteúdo separado, `NOTICE.md`) é adequada.

**OGL 1.0a.** Vale só para o que você usa *sob* a OGL: o texto da OGL 1.0a precisa ir junto ("incluir o texto completo da OGL 1.0a no seu produto", WotC), com a **Section 15** atualizada (copyright de cada fonte OGC usada). Como o SRD 5.1 oferece CC-BY-4.0 como alternativa, o mais simples é tratar o inglês do SRD 5.1 sob CC. **Mas o pt do Foundry VTT Brasil é declarado OGL pelos autores**; o direito sobre a *tradução* é deles, então manter OGL + Section 15 + créditos para esse texto, como `content/dnd5e/OGL-1.0a.txt` já faz. Product Identity: só o que a WotC designa; o SRD não inclui marcas como "Dungeons & Dragons" para uso de marca, e a WotC trocou nomes no 5.2 (ex.: *Mysterious Deck*). Tradução automática de OGC continua OGC e continua exigindo o aviso; não elimina obrigações. Incerteza: a OGL é geralmente vista como incompatível com GPL para *código*; mantê-la como conteúdo agregado, separado, é o tratamento defensável (confiança média; não é parecer).

**Misturar fontes.** Cada campo traduzido deve poder ser rastreado à origem (já previsto no plano de "registro de fontes"). Regras: Foundry VTT Brasil = OGL; sinregistrar = CC-BY-4.0; **decito/dnd5e-pt-br: sem licença declarada = todos os direitos reservados por padrão**; o `NOTICE.md` já limita a nomes e a "sugestões conferidas". Nomes curtos de regras provavelmente não são protegíveis, mas isso é interpretação; para texto longo, pedir licença por escrito aos autores.

**Direito autoral de saída de tradução automática.**
- EUA: o relatório do Copyright Office (Parte 2, 29/01/2025) rejeita proteção para "o mero fornecimento de prompts", mas admite proteção quando há arranjo ou modificação criativa humana de saída de IA e quando obra humana é perceptível na saída; assistência de IA não impede a proteção do conjunto.
- UE: a leitura dominante é antropocêntrica; é preciso escolhas criativas humanas expressas na obra. Não achei fonte aplicando isso a tradução automática especificamente.
- Brasil: autor é pessoa física (art. 11) e a tradução é protegida se "apresentada como criação intelectual nova" (art. 7º XI). Não achei doutrina ou decisão citável sobre saída de IA.
- Consequência prática (interpretação minha, confiança média): MT puro provavelmente **não gera direito autoral para você**, o que não impede o uso, mas impede reivindicar exclusividade; **MT + revisão humana substancial** (o fluxo "rascunho no Weblate, aprovação humana") dá base clara de autoria humana nos trechos editados. O plano atual diz "sem tradução automática, nem como rascunho"; este achado não obriga a mudar isso, apenas mostra que, se mudar, a licença do modelo (seção 4) importa mais que o direito autoral.

## 4. Licenças de pesos de modelo: pesos vs. saídas

**Distinção central.** Licenças de modelo se aplicam ao *Licensed Material* (os pesos, o código, o uso do serviço). A saída de um modelo geralmente não é "material adaptado" dos pesos. Mas: (a) várias licenças e fichas fazem restrições explícitas sobre uso; (b) licenças como a CC-BY-NC definem *NonCommercial* como uso "não direcionado primariamente a vantagem comercial ou compensação monetária", e o contexto do uso (produto parcialmente pago) é o que importa. Se NLLB gera a tradução de um app que cobra, o risco é interpretativo. Não achei decisão judicial nem FAQ oficial que tranquilize. Confiança baixa na tese "saída é livre".

**Tabela por família (o que foi lido hoje nos cabeçalhos do Hugging Face):**

| Modelo | Licença | Pesos comerciais | Saídas para produto parcialmente pago |
| --- | --- | --- | --- |
| NLLB-200 | CC-BY-NC-4.0; "research model, not released for production deployment"; saídas não valem como tradução certificada | Não | Zona cinzenta, evitar |
| MADLAD-400 | Apache-2.0 | Sim | Sim (qualidade e "não avaliado para produção" são outro assunto) |
| OPUS-MT | CC-BY-4.0 ou Apache-2.0 conforme o modelo | Sim | Sim, com atribuição quando CC-BY |
| Gemma 4 | Apache-2.0 (blog do Google, abril/2026) | Sim | Sim |
| Gemma 1 a 3 | "gemma" + Gemma Prohibited Use Policy; aceitar os termos | Com condições | Depende dos termos, que não reli hoje (a URL oficial redirecionou para domínio que não é do Google e não foi seguida) |
| Llama 3.1 | Community License | Sim abaixo de 700M MAU | Sim; "Built with Llama" ao distribuir; modelo treinado com saídas deve começar com "Llama"; AUP incorporada; foro Califórnia |
| Qwen | Qwen3 (testado 8B e 0.6B): Apache-2.0; Qwen2.5-3B: `qwen-research`; Qwen2.5-72B: `qwen` | Qwen3: sim; 3B: não comercial (nome da licença, texto não lido); 72B: licença própria (texto não lido) | Conferir por modelo |
| Mistral | 7B v0.3 e Small 24B 2501: Apache-2.0; Large 2411: MRL (não comercial) | Só os Apache | Só os Apache |
| Tower (Unbabel) | CC-BY-NC-4.0 | Não | Evitar |
| Aya Expanse | CC-BY-NC-4.0 + AUP | Não | Evitar |
| LibreTranslate | AGPL-3.0 (o serviço) | Rodar sem modificar: sim | Saída livre; §13 só se modificar |
| Argos Translate | MIT ou CC0 (código); índice de pacotes MIT/CC0 mas **a licença de cada modelo não consta no repositório** | Verificar pacote | Idem |

**Recomendação conservadora.** Para um projeto gratuito hoje e talvez parcialmente pago amanhã: (1) só usar **pesos com licença comercial limpa** (Apache-2.0, MIT, CC-BY): Qwen3, Gemma 4, Mistral 7B/Small Apache, MADLAD-400, OPUS-MT; (2) **não usar** modelos NC (NLLB, Tower, Aya, Mistral Large/MRL, Qwen2.5 3B) para produzir conteúdo que entra no produto, mesmo que a saída "seja livre"; é um risco evitável e desnecessário; (3) registrar qual modelo e versão produziu cada rascunho (proveniência); (4) revisão humana antes de publicar. Se alguém ainda quiser NLLB, só como ferramenta pessoal descartável, sem a saída chegar ao repositório sem reescrita humana, e mesmo isso depois de consultar advogado.

## 5. Se o RPGWorld publicar a própria ferramenta de localização

**Recomendação: Apache-2.0**, com **DCO** (sem CLA).

Raciocínio:
- **MIT vs Apache-2.0:** ambas permissivas e compatíveis com tudo no ecossistema Node/TS e com CTranslate2, llama.cpp, Ollama (todos MIT). Apache-2.0 acrescenta concessão expressa de patente (que termina se o licenciado processar por patente, §3) e NOTICE (§4d), a um custo pequeno de atrito. Tolgee núcleo e Gemma 4 já usam Apache-2.0.
- **AGPL-3.0:** protege contra captura por SaaS, mas, para uma CLI cujo objetivo é adoção, afasta empresas e exige que quem a use como serviço publique mudanças. Sem plano de monetização obrigatória, a proteção custa mais adoção do que vale. Fica como alternativa se a mantenedora quiser explicitamente impedir um concorrente hospedado de fechar o código; assunto pessoal dela.
- **Compatibilidade com GPL do app:** uma ferramenta Apache-2.0 **separada** do app pode ser usada por ele sem problema (Apache-2.0 é compatível com GPLv3, mas não com GPLv2 só). Os arquivos gerados são dados, não código.
- **Chamar GPL por fora:** `translate-toolkit` é GPL-3.0; executá-lo como processo separado (linha de comando, pipes) é, na leitura do FSF (`MereAggregation`), "mecanismos normalmente usados entre dois programas separados", logo **não** contamina a CLI. Importá-lo como biblioteca no mesmo processo faria a CLI virar GPL-3.0. Chamar o Ollama por HTTP e LibreTranslate (AGPL) por HTTP também é separação. Interpretação do FSF; o limite final é de juiz.
- **Contribuição:** DCO (sign-off em commit, `Signed-off-by`): cada contribuidor atesta ter direito de enviar sob a licença do projeto; é leve para mantenedora solo. Não permite relicenciar depois sem consulta; com Apache-2.0 isso raramente importa (já é permissiva, e dá para adicionar termos de distribuição). CLA só se ela quiser poder fechar partes no futuro.
- **npm e Docker:** publicar o código sem pesos. **Não embutir pesos** no pacote nem na imagem: cada pesos tem licença própria (Llama exige copiar o acordo e "Built with Llama"; Gemma antigo repassa termos; NC proíbe). Baixar do Hugging Face no primeiro uso, com um manifesto `models.json` que registre licença e SHA de cada modelo e falhe com aviso para licença NC. Imagem Docker: incluir licenças de terceiros (NOTICE) e só dependências livres.
- **Sustentabilidade sem monetização obrigatória:** licença permissiva + DCO + manifesto de modelos permitido; patrocínio (GitHub Sponsors/Open Collective) opcional; o RPGWorld é o primeiro cliente, então a ferramenta é mantida por necessidade própria. Se o custo de manter crescer, o caminho é hospedar serviço pago *além* do código aberto, como Weblate faz.

Confiança: alta nas licenças e compatibilidades citadas; média na escolha entre Apache e AGPL, que depende da intenção da mantenedora.

## 6. Termos de serviço

- **GitHub Actions** (Termos para Produtos Adicionais): independentemente do runner, Actions não deve servir a mineração de criptomoedas, a CDN ou "parte de aplicação serverless"; em runners hospedados também veda "qualquer outra atividade não relacionada à produção, teste, implantação ou publicação do projeto de software". Traduzir as strings do próprio projeto em CI é defensável como produção do software; rodar inferência pesada de modelos como computação geral não é (interpretação minha, confiança média).
- **Hosted Weblate Libre:** gratuito, "somente para projetos públicos", com os limites do plano de 160 mil strings (a página oficial atual; fontes de terceiros citam 10 mil, divergência não resolvida). A notícia oficial (2017 a 2020) exige licença aprovada pela OSI ou reconhecida como livre pelo FSF e código disponível publicamente, e diz que "não importa o tamanho do projeto nem se ele tem receita". GPL-3.0-or-later cumpre. Verificar os termos vigentes no momento de qualquer mudança comercial.
- **Vercel Hobby:** os Termos §4 dizem "você só deve usar os Serviços sob o plano Hobby para uso pessoal ou não comercial". Quando surgirem recursos pagos, o projeto precisa ir ao plano Pro (a página de planos não repete a cláusula; vale o ToS). Os fair-use guidelines da Vercel tratam de limites de uso, não de comercialização.

## Limitações

- Não sou advogado. Não consultei advogados ou o texto completo de cada licença (por exemplo, Qwen, Gemma Terms, MRL, Llama 2 de base do Tower).
- Cabeçalhos de licença do Hugging Face podem mudar; só reflitam 2026-11-27.
- As buscas web não deram fonte específica sobre UE/Brasil para saída de tradução automática.
- A ferramenta de fetch resumiu páginas longas; citações curtas podem ser paráfrases. Onde apenas o resumo foi lido, está dito.
- Não verifiquei o estado de manutenção do Traduora, o texto integral da Tolgee EE (li só o resumo) nem a licença de cada pacote do Argos.
- Não verifiquei termos de Hosted Weblate além da página de hosting e de uma notícia oficial antiga.

## Nível de confiança por afirmação

| Afirmação | Confiança |
| --- | --- |
| Weblate GPL-3.0-or-later; Pontoon BSD-3; Traduora AGPL-3.0; Tolgee Apache + EE | Alta |
| Rodar sem modificar não obriga publicar nada (GPL/AGPL) | Média-alta |
| Saída do Weblate não herda a GPL | Alta (FSF) |
| Tolgee `ee` incompatível com um projeto que cobra | Média (interpretação de "comercial") |
| Tradução = adaptação sob CC-BY, precisa "indicar mudanças" | Alta |
| Fluxo OGL para o pt do Foundry | Média |
| MT puro sem copyright; MT + revisão humana com copyright | Média |
| Saída de modelo NC pode ser usada comercialmente | Baixa; por isso evitar |
| Apache-2.0 + DCO para a ferramenta | Média-alta |
| Chamar GPL como processo separado não contamina | Média-alta (FSF) |

## Perguntas em aberto

1. A mantenedora pretende manter a GPL-3.0-or-later quando surgirem recursos pagos, ou quer poder relicenciar? Isso decide CLA vs DCO no app.
2. Qual licença declarar para as traduções do Weblate (GPL-3.0-or-later como o app, ou CC-BY-4.0)?
3. Pedir licença explícita ao repositório decito/dnd5e-pt-br ou parar de usá-lo.
4. O texto atual do Gemma Terms e das licenças Qwen/MRL, se algum desses modelos for realmente escolhido.
5. As licenças dos pacotes Argos específicos, se forem usados.
6. Confirmar com o Weblate o plano Libre vigente (limite de strings).
7. Aconselhamento jurídico, se houver cobrança real.

## Fontes

Todas verificadas em 2026-11-27.

| Área | URL |
| --- | --- |
| Licença e CLA no Weblate | https://docs.weblate.org/en/latest/admin/licensing.html ; https://docs.weblate.org/en/latest/admin/projects.html |
| Licença do Weblate | https://docs.weblate.org/en/latest/contributing/license.html ; https://raw.githubusercontent.com/WeblateOrg/weblate/main/LICENSE |
| Hosted Weblate Libre | https://weblate.org/en/hosting/ ; https://weblate.org/en/news/archive/weblate-even-more-open-now/ |
| FSF FAQ (saída, serviço, AGPL, agregação) | https://www.gnu.org/licenses/gpl-faq.html |
| Tolgee | https://raw.githubusercontent.com/tolgee/tolgee-platform/main/LICENSE ; https://raw.githubusercontent.com/tolgee/tolgee-platform/main/ee/LICENSE |
| Pontoon | https://github.com/mozilla/pontoon |
| Traduora | https://github.com/ever-co/traduora |
| CC-BY-4.0 texto legal | https://creativecommons.org/licenses/by/4.0/legalcode.en |
| FAQ do Creative Commons | http://wiki.creativecommons.org/Frequently_Asked_Questions ; https://creativecommons.org/faq/ |
| SRD, CC-BY e OGL, WotC | https://www.dndbeyond.com/resources/1781-systems-reference-document-srd |
| Copyright Office, IA Parte 2 | https://www.copyright.gov/newsnet/2025/1060.html |
| Lei 9.610/98 | https://www.planalto.gov.br/ccivil_03/leis/l9610.htm |
| UE, IA e autoria (busca) | https://www.ivir.nl/publicaties/download/AI-Copyright.pdf |
| NLLB-200 | https://huggingface.co/facebook/nllb-200-distilled-600M |
| MADLAD-400 | https://huggingface.co/google/madlad400-3b-mt |
| OPUS-MT | https://huggingface.co/Helsinki-NLP/opus-mt-tc-big-en-pt ; https://huggingface.co/Helsinki-NLP/opus-mt-en-ROMANCE |
| Gemma 4 / Gemma 3 | https://opensource.googleblog.com/2026/03/gemma-4-expanding-the-gemmaverse-with-apache-20.html ; https://huggingface.co/google/gemma-3-4b-it |
| Llama 3.1 | https://raw.githubusercontent.com/meta-llama/llama-models/main/models/llama3_1/LICENSE |
| Qwen | https://huggingface.co/Qwen/Qwen3-8B ; https://huggingface.co/Qwen/Qwen2.5-3B-Instruct ; https://huggingface.co/Qwen/Qwen2.5-72B-Instruct |
| Mistral | https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3 ; https://huggingface.co/mistralai/Mistral-Small-24B-Instruct-2501 ; https://huggingface.co/mistralai/Mistral-Large-Instruct-2411 |
| Tower, Aya | https://huggingface.co/Unbabel/TowerInstruct-7B-v0.2 ; https://huggingface.co/CohereLabs/aya-expanse-8b |
| LibreTranslate, Argos | https://github.com/LibreTranslate/LibreTranslate ; https://github.com/argosopentech/argos-translate ; https://github.com/argosopentech/argospm-index |
| CTranslate2, llama.cpp, Ollama, translate-toolkit | https://github.com/OpenNMT/CTranslate2 ; https://github.com/ggml-org/llama.cpp ; https://github.com/ollama/ollama ; https://github.com/translate/translate |
| DCO, Apache-2.0 | https://developercertificate.org/ ; https://www.apache.org/licenses/LICENSE-2.0.txt |
| GitHub Actions | https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features |
| Vercel | https://vercel.com/legal/terms ; https://vercel.com/docs/limits/fair-use-guidelines |
| Repositório | `LICENSE`, `NOTICE.md`, `content/dnd5e/OGL-1.0a.txt`, `package.json`, `docs/plans/2026-10-15-traducoes-comunitarias.md` |
