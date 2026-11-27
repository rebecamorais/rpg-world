# 08 — Custos

**Data:** 2026-11-27 (revisado depois da [revisão adversarial](research/adversarial-review.md)). Volumes **medidos** em [02](02-translation-volume.md). Tempos de GPU, energia e horas de pessoa são **estimativas** com a conta escrita; preços vêm de [05](05-hosting-research.md). Nada aqui foi medido na máquina dela.

## Custo financeiro zero não é custo zero

Em todas as opções abaixo o dinheiro é pequeno. O que pesa são horas:

| Tipo de custo | Ordem de grandeza |
|---|---|
| Energia para traduzir tudo o que falta (291 mil palavras) | menos de R$ 2 |
| VPS de reserva, se um dia for necessária | ~€ 6/mês |
| Experimentos | 14–26 h, uma vez |
| Construir o validador e o lote | 14–28 h, uma vez |
| Manter | 0,5–3 h por mês |
| **Revisar o que a máquina traduziu** | **88–220 h só o português; 291–728 h tudo** |

## Premissas

| Premissa | Valor | Origem |
|---|---|---|
| Palavras de fonte no produto | 160.246 | medido |
| Faltam traduzir | pt 88 mil, es 43 mil, sv 160 mil palavras | medido |
| Tempo de GPU por 158 mil palavras | 1 a 2,2 h (Qwen3.5-9B Q4, 1 a 4 fluxos) | estimativa, [04](04-translation-engines.md) |
| Energia por 158 mil palavras | 0,15 a 0,35 kWh | estimativa, [04](04-translation-engines.md) |
| Tarifa residencial | R$ 0,85/kWh antes de impostos | projeção da ANEEL citada em [05](05-hosting-research.md) |
| Ritmo de revisão de texto de regra | 400 a 1.000 palavras/h | **suposição**, sem fonte conferida; medir no PoC 2 |
| Crescimento da interface | 1,4 a 5,1 mil palavras/mês | medido no git, ruidoso |
| Crescimento das regras | em eventos de importação de 43 a 50 mil palavras | medido no git |

## Tradução inicial

Conta: palavras que faltam ÷ 158 mil × (tempo, energia) por idioma.

| Idioma | Falta | GPU (h) | Energia (kWh) | Energia (R$) | Revisão (h) |
|---|---:|---:|---:|---:|---:|
| pt | 88 mil | 0,6–1,2 | 0,08–0,20 | 0,07–0,17 | 88–220 |
| es | 43 mil | 0,3–0,6 | 0,04–0,10 | 0,03–0,08 | 43–108 |
| sv | 160 mil | 1,0–2,2 | 0,15–0,35 | 0,13–0,30 | 160–400 |
| **Total** | **291 mil** | **1,9–4,0** | **0,27–0,65** | **0,23–0,55** | **291–728** |

Hoje só o português tem quem revise. O sueco não tem avaliador, e para o espanhol pode existir um SRD 5.2.1 oficial para importar (a confirmar).

Se o modo de raciocínio do modelo ficar ligado, o tempo de GPU multiplica por 3 a 10 ([04](04-translation-engines.md)); ainda assim é menos de dois dias de máquina.

## Tradução incremental

- **Interface:** até ~5 mil palavras por mês × idiomas liberados. Com 3 idiomas, 15 mil palavras: 6 a 12 minutos de GPU e 15 a 38 horas de revisão por mês no pior mês. Em mês típico, bem menos.
- **Regras:** um evento de importação (criaturas, por exemplo: ~320 por edição ainda não importadas) traz dezenas de milhares de palavras de uma vez. Trate cada importação como uma "tradução inicial" pequena, não como fluxo mensal.

## Projeções de escala

Conta: palavras de fonte × idiomas ÷ 158 mil × (1 a 2,2 h; 0,15 a 0,35 kWh). Supõe traduzir tudo do zero; a revisão não entra.

| Conteúdo | Idiomas | Palavras a traduzir | GPU (h) | Energia (R$) |
|---|---:|---:|---:|---:|
| 1× | 2 | 0,32 mi | 2–4,5 | 0,3–0,6 |
| 1× | 20 | 3,2 mi | 20–45 | 2,6–6 |
| 2× | 5 | 1,6 mi | 10–22 | 1,3–3 |
| 5× | 10 | 8 mi | 51–112 | 6,5–15 |
| 10× | 20 | 32 mi | 203–446 | 26–60 |

A 10× × 20 idiomas, a máquina leva de 8 a 19 dias de notebook ligado, em lotes. É viável. A revisão humana desse volume não é: 32 milhões de palavras a 1.000 por hora são 32 mil horas. **O que quebra primeiro é gente para revisar, muito antes da GPU.**

## Cenários

### 1. Zero assinatura, estrito

Arquitetura mínima ([07](07-architecture-options.md)): lote local, validador no Actions, revisão por fatia em PR.

- **Recorrente:** R$ 0. Energia: centavos por execução.
- **Depende de:** GitHub gratuito para repositório público; o notebook que ela já tem.
- **Não depende de:** créditos de teste, patrocínio, aprovação de terceiros, hardware novo, API paga.
- **Falha dura em vez de cobrança:** sim. Nada aqui tem cartão cadastrado.

### 2. Zero nuvem, hardware local

Igual ao 1. Variante: Weblate em Docker no notebook só para ela revisar com memória e glossário. Não serve à comunidade (máquina desligada, sem porta de entrada). Manter o notebook ligado 24 h custaria R$ 18 a 26 por mês de energia (estimativa), mais que a VPS.

### 3. Tudo em nuvem gratuita

- **Plataforma:** Oracle A1 (2 OCPU / 12 GB) é a única que comporta o Weblate. Riscos: recolhimento por ociosidade, falta de capacidade em São Paulo, exigência de cartão não verificada.
- **Tradução:** não cabe. Nenhuma nuvem gratuita verificada oferece GPU; o Workers AI gratuito tem 10 mil Neurons por dia e custo por palavra desconhecido.
- **Veredito:** não recomendado. É o cenário com mais horas de operação e mais risco de sumir.

### 4. Híbrido (recomendado)

Cenário 1 + Weblate hospedado no plano Libre como tela de revisão.

- **Recorrente:** R$ 0 enquanto o plano existir.
- **Teto do plano:** 160 mil strings hospedadas ≈ strings de fonte × (idiomas + 1). Com 5.727 strings: 26 idiomas. Com 2×: 12. Com 5×: 4. Com 10×: 1.
- **Se o plano sair:** volta ao cenário 1. As traduções aceitas já estão no Git; sugestões pendentes, memória e configuração só sobrevivem se o backup do projeto for exportado antes.

### 5. Reserva paga, se o gratuito não bastar

| Item | Preço | Quando |
|---|---|---|
| Hetzner CX23 (2 vCPU / 4 GB / 40 GB) para Weblate auto-hospedado | € 5,99/mês sem imposto | Comunidade ativa e plano Libre indisponível |
| Backup em armazenamento de objetos | centavos/mês (não verificado) | Junto com a VPS |
| API paga de tradução | não orçado | Não recomendado; contraria o requisito |

Ordem de grandeza: cerca de € 75 por ano. Não há datacenter da Hetzner no Brasil; para uma ferramenta de tradução, latência não é crítica.

## Pontos de quebra

| O que cresce | O que quebra | Quando |
|---|---|---|
| Idiomas × conteúdo no Weblate hospedado | Teto de 160 mil strings | 5× conteúdo com 5 idiomas, ou 10× com 2 |
| Texto de máquina sem revisão | Atenção humana | Já agora: 88–220 h só no português |
| Tamanho dos PRs de tradução | Revisão por diff | Lotes acima de algumas centenas de strings |
| Tradutores simultâneos sem Weblate | Conflitos de merge | A partir de um punhado de pessoas no mesmo arquivo |
| VRAM | Modelos maiores que ~9B em Q4 | Só se o benchmark exigir modelo maior |
| Banco do Weblate auto-hospedado | Disco de 40 GB | Não antes de 10× × 20 idiomas (~9,5 GB estimados) |

## CI

A validação lê alguns MB de JSON: segundos por execução, em repositório público (minutos gratuitos). Nenhum custo previsto. Inferência no Actions está fora do desenho.

## Limitações

- Vazão e consumo do modelo não foram medidos neste notebook (PoC 1).
- O ritmo de revisão é suposição.
- A tarifa usada é projeção antes de impostos; o valor na conta de luz é maior.
- Preço de armazenamento de backup não foi verificado.

## Nível de confiança

- **Alto:** energia é irrelevante no orçamento; revisão humana domina.
- **Médio:** tempos de GPU (dependem de o modelo caber inteiro na VRAM).
- **Baixo:** horas de revisão.
