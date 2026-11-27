# Revisão adversarial

**Data:** 2026-11-27. Um agente independente leu os docs 01 a 11 com a tarefa de derrubar a recomendação. Veredito: **sobrevive com mudanças**. Este arquivo registra o que ele achou, o que foi conferido e o que mudou nos docs.

## O argumento mais forte contra

O recurso escasso é gente para revisar, e o repositório mostra que hoje não há: o único commit do `hosted-weblate[bot]` é o #224, do dia da migração (2026-11-15). Não há quem avalie sueco. Logo, o trabalho real é pontual: cerca de 88 mil palavras de português, revisadas pela própria mantenedora. Um lote "só preenche chave vazia" mais o validador resolve; a máquina de estados com trava serve a um fluxo que ainda não existe.

**Aceito.** A trava saiu do primeiro passo e virou desenho adiado ([07](../07-architecture-options.md), seção 6).

## Achados conferidos no repositório

| Achado | Conferido | Efeito |
|---|---|---|
| 186 de 319 descrições de magia do pt 5.1 têm números diferentes do inglês (pés viram metros) | Sim, mesma contagem | A verificação "números iguais" barraria tradução aprovada. O validador precisa entender unidades e o projeto precisa de convenção escrita |
| Descrições do pt 5.1 com sobra em inglês entre colchetes (`6 metros [20-foot-radius sphere]`) | Sim: 69 com um padrão mais estreito; o revisor contou 78 | A referência do benchmark precisa de limpeza antes de servir de gabarito ou exemplo |
| Já existe teste de paridade de tags e marcação para regras (`content/dnd5e/content.unit.test.ts`) | Sim | [01](../01-current-state.md) corrigido; a lacuna real são dados soltos, ICU e números |
| O app é GPL-3.0-or-later; um script dentro dele também é | Sim (`package.json`) | Adaptar ou embutir `i18n-ai-translate` (GPL-3.0) é permitido. Apache-2.0 só vale para um projeto separado |
| [07] dizia "sugestão por padrão" numa seção e "rascunho com selo" em outra | Sim | Unificado: texto de máquina só entra na `main` depois de revisado |

## Achados aceitos sem conferência própria

- **Opção "só adotar" não avaliada:** o Weblate deixa o projeto configurar serviço de tradução (Ollama, OpenAI com URL própria) e tem o complemento de tradução automática com modo "sugestão". Virou o PoC 0.
- **Trava falha para o lado inseguro:** qualquer mudança no valor (até correção de uma letra) era lida como "corrigido por pessoa". Agora só uma marca explícita conta como revisado.
- **Hash do glossário inteiro** causaria retradução em massa a cada termo novo. Agora, hash só dos termos que aparecem naquela string.
- **Trava dentro de `messages/`** casaria com a máscara `messages/*.json` do Weblate como se fosse um idioma. Agora, pasta separada.
- **Matriz:** dependência do plano Libre contada duas vezes; "capacidade" igual para todas embora o gargalo seja revisão; implementação igual para 8 h e 55 h. Notas refeitas: G 4,25, B 4,20, F 4,20, empate dentro da incerteza.
- **Poder estatístico do PoC 2:** com 100 segmentos, "≤ 2%" e "> 5%" não se distinguem. Limiares refeitos.
- **Ritmo de revisão:** 2.000 palavras/h é quase velocidade de leitura. Passou para 400 a 1.000 (da experiência do revisor, sem fonte conferida).
- **CC-BY-4.0 pede indicar modificações:** o `NOTICE.md` precisa dizer quando um texto é tradução automática; um selo no app não substitui.
- **"Nada se perde" ao sair do Weblate** era exagero: configuração, sugestões pendentes e memória ficam só no servidor deles.

## Conferido na web pelo revisor

- Qwen3.5-9B: Apache-2.0, raciocínio ligado por padrão.
- Seed-X-PPO-7B: OpenMDW, cobre pt, es e sv, sem modelo de conversa (não recebe glossário no prompt).
- Gemma 4 E4B: Apache-2.0.
- Weblate: mínimo de 3 GB e 2 núcleos; as strings hospedadas contam o idioma de origem; o Libre tem o teto de 160 mil.
- Vercel Hobby: "personal or non-commercial use" (Termos, §4). A [análise de licenças](licensing.md) estava certa; o [05](../05-hosting-research.md) só não tinha conseguido conferir.
- `i18n-ai-translate`: GPL-3.0, Ollama, modo `diff` e `--glossary`.

## Ficou sem verificar

- Se o Weblate hospedado, no plano Libre, aceita serviço de tradução com URL própria.
- Se o Weblate grava no JSON um texto marcado "precisa de edição".
- A situação do pedido do plano Libre. Se o teste de 14 dias começou em 2026-11-15, acaba por volta de 2026-11-29 (baixa confiança na data).
- O SRD 5.2.1 oficial em espanhol (visto só num resumo de busca; confirmar em dndbeyond.com/srd).
- O corte do Oracle A1 (só fontes secundárias, com datas conflitantes), o preço da Hetzner e toda a vazão de GPU.
