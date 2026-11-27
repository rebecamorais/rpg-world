# 09 — Matriz de decisão

**Data:** 2026-11-27 (notas refeitas depois da [revisão adversarial](research/adversarial-review.md)). Notas de 0 a 5 dadas por mim (Claude) a partir dos docs [01](01-current-state.md) a [08](08-cost-analysis.md). São julgamento apoiado em evidência, não medição. Para refazer a conta ou trocar uma nota:

```bash
node docs/discovery/localization-infrastructure/scripts/decision-matrix.mjs
```

## Resultado em uma linha

**A matriz não separa G, B e F** (4,25, 4,20 e 4,20; a diferença é menor que a incerteza das notas). Ela separa bem esse grupo do resto: auto-hospedar agora (A), projeto independente (D), fork (C) e plataforma própria (E) ficam atrás em todos os cenários. O desempate entre G, B e F vem dos requisitos obrigatórios, não da pontuação.

## Requisitos obrigatórios (eliminam antes de pontuar)

| Requisito                              | A                | B                   | C   | D   | E   | F   | G                       |
| -------------------------------------- | ---------------- | ------------------- | --- | --- | --- | --- | ----------------------- |
| Sem assinatura obrigatória             | ⚠️ VPS ou Oracle | ⚠️ depende do Libre | ⚠️  | ✅  | ⚠️  | ✅  | ✅                      |
| Sem API paga obrigatória               | ✅               | ✅                  | ✅  | ✅  | ✅  | ✅  | ✅                      |
| Sem depender de aprovação de terceiros | ✅               | ❌ se hospedado     | ✅  | ✅  | ✅  | ✅  | ✅ (Weblate é opcional) |
| Licença aberta, uso comercial futuro   | ✅               | ✅                  | ✅  | ✅  | ✅  | ✅  | ✅                      |
| Manutenção cabível para uma pessoa     | ✅               | ✅                  | ❌  | ⚠️  | ❌  | ✅  | ✅                      |

- **E está desclassificada** (1.500 a 4.000 h de construção). Fica na tabela só como referência.
- **C falha** na manutenção (5 a 10 h por mês de sincronização com o upstream).
- **B hospedada depende de aprovação.** É o único ponto que a separa de G: o trabalho do dia a dia é o mesmo (sugestões no Weblate), mas G continua funcionando se o Weblate sair.

## Notas e justificativa

Pesos: finanças 20, manutenção 20, capacidade 15, qualidade 10, infraestrutura 10, Git 10, licença 5, implementação 5, comunidade 5.

| Critério                      |        A |        B |        C |        D |        E |        F |        G |
| ----------------------------- | -------: | -------: | -------: | -------: | -------: | -------: | -------: |
| Sustentabilidade financeira   |        2 |        4 |        2 |        5 |        3 |        5 |        5 |
| Esforço de manutenção         |        3 |        4 |        1 |        2 |        0 |        4 |        3 |
| Capacidade e escala           |        4 |        4 |        4 |        3 |        4 |        3 |        4 |
| Qualidade de tradução         |        3 |        4 |        3 |        4 |        3 |        4 |        4 |
| Viabilidade de infraestrutura |        2 |        5 |        2 |        5 |        2 |        5 |        5 |
| Git e automação               |        4 |        4 |        4 |        5 |        4 |        5 |        5 |
| Licença e portabilidade       |        5 |        5 |        3 |        5 |        5 |        5 |        5 |
| Esforço de implementação      |        5 |        4 |        1 |        2 |        0 |        4 |        4 |
| Experiência da comunidade     |        5 |        5 |        4 |        2 |        4 |        2 |        4 |
| **Total ponderado**           | **3,25** | **4,20** | **2,50** | **3,70** | **2,55** | **4,20** | **4,25** |

**Finanças.** F, G e D não têm nada pago nem cartão cadastrado (5). B é gratuita enquanto o plano Libre durar, com teto de 160 mil strings (4); a dependência do plano é contada **só aqui**. A e C precisam de € 6 por mês ou do Oracle A1, que recolhe instância ociosa (2).

**Manutenção.** F é um script e um job de CI (4). G soma a convivência com o Weblate, que já gerou conflito de rebase depois de squash em 15/11 (3). B deixa o servidor com terceiros (4). A exige atualizar e fazer backup de Django, PostgreSQL e Valkey (3). D vira projeto público com issues de terceiros (2).

**Capacidade.** A máquina sobra em todas; o gargalo é revisão humana. Por isso a nota mede **vazão de revisão**: quem tem tela de revisão leva 4, quem revisa por diff de PR leva 3.

**Qualidade.** Depende do motor e do glossário, não da plataforma (4 onde há glossário no prompt e validador). A leva 3 porque um servidor na nuvem não alcança o modelo local sem a parte de extensão. Nenhum motor foi medido ainda.

**Infraestrutura.** Mede se roda com o que existe hoje. F, G, D e B rodam (5): o Weblate hospedado já está configurado. A, C e E não cabem em nuvem gratuita sustentável (2).

**Git.** F, G e D não têm estado fora do repositório (5); as com Weblate como dono guardam sugestões e memória no banco dele (4).

**Licença.** Weblate GPL-3.0 sem recursos travados; script dentro do repositório, GPL-3.0 como o app (5). Fork fica preso ao ritmo do upstream (3).

**Implementação.** A: 8 a 16 h (5). B, F e G: 14 a 32 h (4). D: 80 a 200 h (2). C e E: centenas a milhares de horas.

**Comunidade.** Weblate é a melhor tela para quem não programa (5 em A e B). G leva 4 porque a tela é opcional e pode sair. F e D dependem de PR (2).

## Sensibilidade

Um critério sobe e os outros encolhem na mesma proporção.

| Cenário         | 1º     | 2º     | 3º     |
| --------------- | ------ | ------ | ------ |
| Pesos originais | G 4,25 | B 4,20 | F 4,20 |
| Finanças 35%    | G 4,39 | F 4,35 | B 4,16 |
| Manutenção 35%  | B 4,16 | F 4,16 | G 4,02 |
| Comunidade 20%  | B 4,33 | G 4,21 | F 3,85 |

Leitura:

- **Finanças mais pesadas:** G e F, as duas sem dependência de terceiros.
- **Manutenção mais pesada:** B e F empatam; G cai porque mantém script **e** sincronização com o Weblate.
- **Comunidade mais pesada:** B vence, G em segundo. Se um dia houver comunidade ativa, o Weblate vira dono do fluxo (arquitetura de escala em [07](07-architecture-options.md)).
- **A nunca passa do quarto lugar.** Rejeitar o servidor próprio agora se sustenta.
- G, B e F compartilham as mesmas peças (script de lote e validador). Escolher G é construir F e continuar usando o Weblate que já existe; não fecha a porta para B.

## O que mudou nas notas depois da revisão

| Mudança             | Antes | Depois | Motivo                                                           |
| ------------------- | ----- | ------ | ---------------------------------------------------------------- |
| Capacidade de F e D | 4     | 3      | Revisão por diff tem menos vazão que uma tela de revisão         |
| Implementação de A  | 4     | 5      | 8 a 16 h não é igual a 30 a 55 h                                 |
| Infraestrutura de B | 4     | 5      | A dependência do Libre já estava em finanças; contava duas vezes |

Com as notas antigas, F ficava em primeiro com 4,35. Esse resultado não se sustentava.

## Limitações

- As notas são de um avaliador só. Uma nota a mais ou a menos troca a ordem entre G, B e F.
- "Qualidade" está quase empatada porque nenhum motor foi medido.

## Nível de confiança

- **Alto:** C e E por último; A atrás do grupo da frente.
- **Baixo:** a ordem entre G, B e F.
