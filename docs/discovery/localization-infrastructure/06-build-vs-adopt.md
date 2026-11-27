# 06 — Construir ou adotar

**Data:** 2026-11-27 (revisado depois da [revisão adversarial](research/adversarial-review.md)). Síntese sobre os docs [01](01-current-state.md) a [05](05-hosting-research.md) e a [análise de licenças](research/licensing.md). As horas são **estimativas** em faixas, feitas para uma pessoa sozinha com outro emprego; nenhuma foi medida.

## O que os fatos já decidem

Quatro fatos medidos ou verificados estreitam a escolha antes de qualquer comparação:

1. **O volume é pequeno.** 5.727 strings e 160 mil palavras de fonte ([02](02-translation-volume.md)). Falta traduzir 88 mil palavras em pt, 43 mil em es e 160 mil em sv. Uma GPU de notebook traduz um idioma inteiro em 1 a 2 horas (estimativa, [04](04-translation-engines.md)). Não existe problema de capacidade de máquina.
2. **O Git já é a fonte da verdade.** Os arquivos `messages/*.json` e `content/**/i18n/**` são o que vale; o app já completa com inglês o que falta ([01](01-current-state.md)). Nenhuma plataforma precisa guardar estado que o repositório não guarde.
3. **Nenhuma nuvem gratuita sustenta uma plataforma sempre ligada.** O Weblate pede 3 a 4 GB de RAM; o único gratuito que comporta é o Oracle A1, que recolhe instância ociosa ([05](05-hosting-research.md)). Quem quer plataforma própria paga cerca de € 6 por mês ou depende de aprovação de terceiros.
4. **O gargalo é a revisão humana, não a tradução.** Revisar as 291 mil palavras que faltam leva de 291 a 728 horas (suposição de 400 a 1.000 palavras por hora; não medido). Só o português, 88 a 220 horas. Nenhuma arquitetura elimina isso; as boas só evitam desperdiçar essa atenção.

5. **Não há fila de tradutores hoje.** O único PR do Weblate é o do dia da migração (15/11), e o sueco não tem quem avalie. O trabalho concreto é pontual: o português do SRD 5.2.

Consequência: o que falta ao projeto hoje não é uma plataforma. É (a) um lote que gere rascunho do que falta, na máquina dela, (b) completar a validação determinística no CI (tags e marcação já são testadas) e (c) um lugar confortável para revisar. O Weblate hospedado já cobre (c) enquanto existir.

## As sete estratégias

Faixas de esforço: **inicial** em horas de engenharia; **manutenção** em horas por mês.

| | Estratégia | Inicial | Manutenção | Custo recorrente | Veredito |
|---|---|---:|---:|---|---|
| A | Adotar: Weblate auto-hospedado, sem mudanças | 8–16 h | 2–4 h | ~€ 6/mês (VPS) ou Oracle com risco de recolhimento | Rejeitada como principal |
| B | Estender: Weblate + worker local de tradução | 14–30 h | 1–3 h | Zero se o Libre for aprovado; senão igual a A | Reserva, se a comunidade crescer |
| C | Fork de uma plataforma | 100–250 h | 5–10 h | Igual a A | Rejeitada |
| D | Motor CLI como projeto independente | 80–200 h | 4–8 h | Zero | Rejeitada agora; revisitar |
| E | Plataforma completa própria | 1.500–4.000 h | 20+ h | Zero a ~€ 6/mês | Desclassificada |
| F | GitHub-nativa: script no repositório + CI + PR | 14–28 h | 0,5–2 h | Zero | **Arquitetura mínima** |
| G | Híbrida: F + Weblate hospedado como tela de revisão opcional | 16–32 h | 1–3 h | Zero | **Recomendação principal** |

### A — Adotar (Weblate auto-hospedado)

- **Arquitetura:** contêiner Weblate (Django + Celery) + PostgreSQL 15+ + Valkey/Redis, atrás de um proxy com TLS. Lê e escreve no GitHub por PR, como hoje.
- **Dependências:** Docker, PostgreSQL, Valkey, domínio, e-mail de saída (SMTP) para contas.
- **Hospedagem:** VPS de 4 GB (Hetzner CX23, € 5,99/mês) ou Oracle A1 gratuito (2 OCPU / 12 GB, recolhido se ocioso por 7 dias).
- **Capacidade:** sem limite de strings imposto pelo software. Banco estimado em até ~9,5 GB a 10× conteúdo × 20 idiomas (pior caso, [05](05-hosting-research.md)).
- **Tradução automática:** o Weblate aceita configurar serviço de tradução (Ollama, OpenAI com URL própria) e tem o complemento de tradução automática com modo sugestão. Mas ele chama um endpoint HTTP: o modelo no notebook não é alcançável por um servidor na nuvem sem túnel, e um modelo de 9B não cabe na VPS de 4 GB. Se isso funciona no Weblate **hospedado** não foi verificado; é o PoC 0 de [10](10-poc-plan.md), porque dispensaria o script. Sem isso, sobra enviar sugestões pela API, que já é a estratégia B.
- **Riscos de segurança:** serviço público com login, superfície de ataque de um Django exposto, atualizações de segurança por conta dela.
- **Migração:** baixa. Os arquivos são os mesmos; o Weblate tem backup de projeto para levar memória e histórico.
- **Aprisionamento:** baixo (GPL-3.0, formatos abertos).
- **Falhas e recuperação:** VPS cai → traduções já aceitas estão no Git; perde-se sugestões pendentes desde o último backup. Recuperar: subir o contêiner e restaurar o dump.
- **Comunidade:** a melhor experiência entre as opções.
- **Sustentabilidade:** boa tecnicamente; **viola o custo zero** ou troca por uma dependência frágil (Oracle).
- **Por que não é a principal:** paga-se dinheiro e horas de operação por um servidor que, com um punhado de tradutores, fica quase sempre parado.

### B — Estender (Weblate + worker local)

- **Arquitetura:** Weblate (hospedado no plano Libre ou auto-hospedado) como dona do fluxo; um script local traduz o que falta com o modelo na GPU e envia como **sugestão** pela API. O `scripts/content/weblate-translations.ts` já faz exatamente esse envio para os nomes do Foundry.
- **Inicial:** 14–30 h (lote de tradução, validador, glossário). **Manutenção:** 1–3 h/mês.
- **Custo:** zero só enquanto o Libre existir e for aprovado. O plano hospedado tem teto de 160 mil strings: com as 5.727 strings de hoje, cabem ~26 idiomas; com 5× o conteúdo, 4; com 10×, 1 (aritmética sobre [03](03-market-research.md)).
- **Falha principal:** o fluxo depende de um terceiro aprovar e manter o plano. Isso contraria o requisito de não depender de aprovação como estratégia primária. Aceitar milhares de sugestões uma a uma pode ser lento (PoC 5).
- **Quando faz sentido:** se aparecer uma comunidade de tradutores de verdade. Ganha a matriz quando "comunidade" pesa 20% ([09](09-decision-matrix.md)).

### C — Fork

- **Custo real:** sincronizar com o upstream. O Weblate publica versões com frequência; um fork com mudanças no núcleo custa 5 a 10 horas por mês só para não ficar para trás, e correções de segurança atrasadas viram risco.
- **Licença:** o fork do Weblate continua GPL-3.0; fork do `ee/` do Tolgee é proibido para uso comercial ([licensing](research/licensing.md)).
- **Rejeitada:** não achamos nenhuma necessidade que exija mexer no núcleo. O que falta (tradução local, validação de dados) fica fora da plataforma, via API e CI.

### D — Motor CLI como projeto independente

- **Arquitetura:** pacote npm próprio, com provedores plugáveis (llama.cpp, Ollama, OPUS-MT), arquivo de trava com hash da fonte, glossário, validação, formatos genéricos.
- **Inicial:** 80–200 h, porque um projeto para terceiros precisa de formatos genéricos, documentação, testes em vários sistemas, versões e suporte. **Manutenção:** 4–8 h/mês (issues de terceiros, quebras de dependência).
- **Rejeitada agora:** o mesmo resultado para o RPGWorld sai em 14–28 h dentro do repositório (estratégia F). A diferença de horas compra generalidade que ninguém pediu ainda. O gerador aberto mais próximo (`i18n-ai-translate`, GPL-3.0) foi testado no PoC 3 e não serve como está para os arquivos do projeto ([resultados](research/poc-results.md)).
- **Quando revisitar:** se um segundo repositório dela (ou de outra pessoa) quiser usar o script. Aí se extrai o que já funciona, em vez de projetar no escuro.

### E — Plataforma completa própria

- **Escopo:** interface web, contas e permissões, editor, memória de tradução, glossário, moderação, integração com GitHub, filas, e-mail, segurança.
- **Inicial:** 1.500–4.000 h. Com 5 a 10 horas livres por semana, são de 3 a 15 anos.
- **Desclassificada:** falha no requisito obrigatório de baixa manutenção para uma pessoa só, e o Weblate já entrega tudo isso sob GPL-3.0 sem recursos travados.

### F — GitHub-nativa

- **Arquitetura:** o Git guarda fonte, traduções e glossário. Um script de lote roda **no notebook dela**, preenche só chaves vazias numa branch de rascunho, e a revisão entra por PR em fatias. O GitHub Actions valida todo PR que toque tradução (ICU, placeholders, dados, unidades, glossário). O script é GPL-3.0 como o app, então pode adaptar `i18n-ai-translate`. Detalhes em [07](07-architecture-options.md).
- **Dependências:** Node (já no projeto), llama.cpp ou Ollama instalado localmente, o modelo (5 a 7 GB em disco).
- **Hospedagem:** nenhuma. Actions em repositório público para a validação.
- **Inicial:** 14–28 h (validador 6–12 h; lote 8–16 h, ou menos com ferramenta pronta). **Manutenção:** 0,5–2 h/mês.
- **Capacidade:** 1 a 2 h de GPU por idioma hoje; ~200 h de GPU para 10× conteúdo × 20 idiomas (estimativa), em lotes.
- **Limites de escala:** revisão por PR é ruim para quem não programa; diffs de milhares de linhas cansam; PRs grandes concorrem com PRs de conteúdo.
- **Segurança:** superfície mínima. O CI valida PR de fork sem segredos. Nada fica exposto na internet.
- **Aprisionamento:** nenhum além do GitHub, e os arquivos saem com `git clone`.
- **Falhas:** notebook indisponível → tradução atrasa, nada quebra. Modelo ruim → o validador barra o que é mecânico; o resto é pego na revisão.
- **Comunidade:** fraca para não programadores. É a nota baixa desta opção.

### G — Híbrida (recomendada)

F como núcleo, mais o **Weblate hospedado como tela de revisão opcional**: ele já está configurado, lê os mesmos arquivos e abre PRs. Com ele ligado, a saída da máquina vai como sugestão e só o que for aceito chega ao repositório. A regra de projeto é que **nada dependa dele**: se o plano Libre for negado ou mudar, desliga-se o webhook e o núcleo F continua igual.

- **Inicial:** 16–32 h (F + acertar a convivência com o Weblate, incluindo o conflito de squash já visto em 15/11).
- **Manutenção:** 1–3 h/mês. É mais que F por causa da sincronização com o Weblate.
- **Comunidade:** boa enquanto o Weblate existir; cai para a de F se sair.
- **Risco:** dois escritores nos mesmos arquivos. Mitigação em [07](07-architecture-options.md): com o Weblate ligado a um idioma, o script só sugere, não escreve nos arquivos dele.

## Reavaliação depois dos PoCs (27/11)

Os PoCs 0 e 3 mostraram que o script de lote é necessário, e a etapa A2 mostrou que o miolo dele não é trivial: mascarar tags, proteger números, consertar marcadores, tentar de novo, validar. A revisão humana continua sendo o gargalo, e nenhuma ferramenta pronta olhada cobre o que a etapa B precisa (comparação cega, severidade, cronômetro). Por isso a comparação foi refeita em cinco opções mais estreitas. Horas são **estimativas**.

| | Opção | Inicial | Manutenção | Hospedagem | Veredito |
|---|---|---:|---:|---|---|
| 1 | Script de lote dentro do RPGWorld (é a F) | 16–30 h | 0,5–2 h/mês | Nenhuma | Insuficiente sozinha: não resolve a revisão |
| 2 | CLI independente com adaptadores do RPGWorld | 60–120 h | 3–6 h/mês | Nenhuma | Cedo demais |
| 3 | Pipeline + tela de revisão local, **dentro do repositório, com a divisão núcleo/adaptador já feita** | 28–50 h | 1–2 h/mês | Nenhuma | **Recomendada** |
| 4 | Plataforma existente + motor próprio (é a G: Weblate hospedado como tela) | 18–34 h | 1–3 h/mês | De terceiro | Complemento opcional da 3, não substituto |
| 5 | Plataforma independente completa | 1.500–4.000 h | 20+ h/mês | Própria | Continua desclassificada |

**Por que a 3.** A tela de revisão local é necessária de qualquer jeito para a etapa B, e é ela que ataca o gargalo. Feita uma vez, serve para o trabalho real: as mesmas telas revisam os 71,5 mil palavras que faltam.

**Por que não a 2 agora, e o que se guarda dela.** Publicar um pacote para terceiros custa formatos genéricos, documentação, versões e suporte, e ainda não existe segundo usuário. O que vale fazer desde o primeiro dia, por 2 a 4 horas a mais, é a divisão de pastas:

| Núcleo (não sabe o que é D&D) | Adaptador do RPGWorld |
|---|---|
| Protocolo de marcadores: mascarar, desmascarar, consertar | Gramática das tags `{@…}` do 5etools |
| Validação: marcadores, ICU, números, glossário | Política de unidades (tabela de conversão) |
| Orquestração: lotes, novas tentativas, segundo motor | Glossário pt-BR e termos contextuais |
| Cliente do servidor de modelo (API compatível com OpenAI) | Formato e caminho dos arquivos `i18n/` |
| Formato do estado de revisão e a tela | Resolução de nomes de entidades (`{@spell …}` → nome em pt) |

Com isso, extrair um projeto independente depois é mover uma pasta, não reescrever. **Licença:** dentro do repositório o código é GPL-3.0-or-later. Enquanto a Rebeca for a única autora e nada for copiado de código GPL de terceiros, ela pode publicar o núcleo sob outra licença quando extrair ([licenças](research/licensing.md)).

**O que seria o diferencial de um projeto independente, se um dia existir:** tradução em lote de conteúdo estruturado, local e nativa de Git, com validação determinística e revisão humana assistida. É um escopo bem menor que o de uma plataforma. Os gatilhos para extrair estão em [11](11-recommendation.md).

**Custo de revisão esperado (suposição até a etapa B medir):** 71,5 mil palavras do SRD 5.2 a 400–1.000 palavras por hora dão 72 a 179 horas. A tela boa mexe nesse número mais do que a troca de motor.

## O que não construir

- Interface web de tradução, contas, permissões ou moderação.
- Banco de dados, fila ou servidor sempre ligado para tradução.
- Trava de hashes e máquina de estados antes de existir fluxo recorrente sem Weblate.
- Memória de tradução difusa (fuzzy). A deduplicação exata economiza só 5,4% das palavras, e os livros 5.1 e 5.2 quase não compartilham texto literal ([02](02-translation-volume.md)).
- Treinar ou ajustar modelo de tradução.
- Workers distribuídos de contribuidores. O modelo "fork + PR" já resolve sem código novo.
- Um pacote npm genérico antes de existir um segundo usuário.

## Nível de confiança

- **Alto:** E e C não cabem para uma pessoa só; nenhuma nuvem gratuita sustenta A.
- **Médio:** as faixas de horas de F e G (dependem dos PoCs 0 e 3 e da qualidade do modelo).
- **Baixo:** horas de revisão humana (a taxa de palavras por hora é suposição).

## Perguntas em aberto

- A qualidade do modelo local em regras de RPG é suficiente? Só o benchmark responde ([10](10-poc-plan.md)).
- O plano Libre vai ser aprovado, e o que acontece se o período de teste acabar antes?
- `i18n-ai-translate` ou o CLI do inlang lidam com o formato dos arquivos de regras sem adaptação?
