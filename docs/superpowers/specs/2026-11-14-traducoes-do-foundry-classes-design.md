# Traduções do Foundry → Crowdin: nomes de classes / Foundry translations → Crowdin: class names

## Intenção

Reaproveitar traduções que a comunidade do Foundry VTT já fez, em vez de traduzir à mão ou gastar
tokens de IA. Um script converte essas traduções para o nosso formato e as manda ao Crowdin como
**sugestões não aprovadas**. A Rebeca confere no editor do Crowdin (com o assistente Gemini, já
configurado por ela) e aprova; o sync normal (`/sync-crowdin`) traz o que foi aprovado num PR.

Nada de IA no pipeline: o script é determinístico e não gasta tokens.

## Escopo deste primeiro lote

- **Só os rótulos curtos** de `content/dnd5e/srd-5.{1,2}/i18n/<locale>/classes.json`:
  - `name` da classe e `subclassTitle`
  - `name` de cada `features.*`, `resources.*`, `choices.*`
  - `subclasses.*.name` e os `name` de `features`/`resources` dentro de cada subclasse
- **Fora:** `description` e `note` (texto longo) — ficam para um lote futuro.
- **Idiomas e fontes:**

| Livro          | Locale | Fonte                                                                                                                  |
| -------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| SRD 5.1        | pt     | Foundry VTT Brasil (`classes`, `subclasses`, `classfeatures`)                                                          |
| SRD 5.2        | pt     | Sem fonte direta. Reaproveita o pt do 5.1 quando o nome em inglês for **idêntico** (Rage, Sneak Attack, Extra Attack…) |
| SRD 5.2        | es     | `translate-dnd5e-sdr2-es` (`classes24`)                                                                                |
| SRD 5.1 es, sv | —      | Fora (sem fonte)                                                                                                       |

Raças/espécies ficam para a #207 (o app ainda não tem o conteúdo de raças em arquivo).

## Fontes e licenças

Versões fixadas no script (commit), como o importador do 5etools faz:

| Repositório                                                                                                                                                            | Commit     | Licença do texto                           | Uso                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------ | -------------------------------------------------------------- |
| gitlab.com/fvtt-brasil/dnd5e (mesmo projeto que `foundryvtt-pt-br/foundryvtt-dnd5e-brazilian-portuguese`; manter o endereço já citado no `NOTICE.md`, README e termos) | `0c813e5b` | OGL 1.0a (o MIT do repo cobre só o código) | Já creditado no `NOTICE.md` pelas magias pt 5.1                |
| github.com/foundryvtt-sinregistrar/translate-dnd5e-sdr2-es                                                                                                             | `1c0f6091` | CC-BY 4.0                                  | Nova seção no `NOTICE.md` (crédito, link, "marcação adaptada") |
| github.com/foundryvtt/dnd5e (`packs/_source/classes24`)                                                                                                                | `81af804b` | SRD CC-BY 4.0 / código MIT                 | Só para mapear o ID do Foundry → nome em inglês                |

**NOTICE.md:** estender o crédito existente do Foundry VTT Brasil para cobrir as classes, e
acrescentar a seção do módulo es. A questão OGL do módulo pt-BR já existe pelas magias; não é
resolvida aqui (ver "Em aberto").

## Como casar as entradas

- **pt (Foundry VTT Brasil):** formato Babele, `entries` com chave = nome em inglês
  (`"Rage": { "name": "Fúria", … }`). Casar pelo nosso `name` em inglês.
  Variantes como `"Ability Score Improvement (Fighter)"` existem: preferir a chave exata; aceitar a
  variante `"<nome> (<Classe>)"` quando ela pertence à classe em questão.
- **es (sinregistrar):** `entries` com chave = ID do Foundry (`phbClcPotentSpel`). Ler o YAML de
  `packs/_source/classes24/**` do sistema dnd5e para ter ID → `name` em inglês, depois casar pelo
  nosso nome em inglês. Nomes compostos do Foundry (`"Blessed Strikes: Potent Spellcasting"`) podem
  corresponder a uma escolha nossa (`"Potent Spellcasting"`) — casar pelo trecho depois de `": "`
  só quando não houver ambiguidade.
- **Recursos:** quase sempre têm o mesmo nome de uma habilidade (Arcane Recovery). Se o recurso não
  tem entrada própria na fonte, usar a tradução da habilidade com o mesmo nome em inglês.
- **`subclassTitle`** ("Primal Path"): usar a fonte se houver um nome casável; senão fica sem
  tradução.
- **Ambíguo ou sem par → não traduz.** Melhor faltar do que errar.

## Saída do script

- Só os campos **ausentes ou vazios** no arquivo do repositório (`i18n/<locale>/classes.json`):
  nunca sobrescreve o que já foi revisado.
- Escreve arquivos parciais numa pasta de saída fora do `content/` (gitignored), na mesma estrutura
  de caminhos do Crowdin, prontos para upload como traduções.
- Imprime um relatório por livro/locale: quantos casados, quantos reaproveitados do 5.1, e a lista
  dos que ficaram sem par (para a Rebeca saber o que falta).
- Rodar de novo com as mesmas versões gera a mesma saída.

## Envio ao Crowdin

- Upload como **traduções não aprovadas** (sem `auto_approve_imported`), para o arquivo de origem
  `content/dnd5e/srd-5.x/i18n/en/classes.json` já existente no Crowdin.
- O workflow atual (`.github/workflows/crowdin.yml`) continua igual: `export_only_approved: true`
  garante que nada não revisado entra no app.
- Disparo **manual**, como o resto do Crowdin no projeto: um workflow próprio no GitHub Actions
  (`workflow_dispatch`), separado do `crowdin.yml`, usando os mesmos `CROWDIN_PROJECT_ID` e
  `CROWDIN_PERSONAL_TOKEN`. O job baixa as fontes fixadas, roda o script e faz o upload; a pasta de
  saída é temporária do job (e gitignored quando o script roda localmente para conferir o
  relatório). Não toca no passo do `crowdin.yml` que envia as traduções do repositório aprovadas.
- **Estado do Crowdin:** antes do upload, o script lê pela API as traduções que o Crowdin já tem
  para cada string de `classes.json` (aprovadas ou não) e pula as que já têm qualquer tradução no
  locale. Assim não empilha sugestões repetidas em cima de trabalho feito no Crowdin e ainda não
  sincronizado. A parte de casamento continua offline e determinística; só o filtro final e o
  upload falam com o Crowdin.

## Metas e não-metas

- **Meta:** a Rebeca abre o Crowdin e encontra os nomes de classes/subclasses/habilidades em pt
  (5.1 e parte do 5.2) e es (5.2) como sugestões, prontas para conferir e aprovar.
- **Não-meta:** traduzir descrições; criar raças; tradução por máquina; automação no push.
- **Anti-meta:** qualquer tradução entrar no app sem aprovação; sobrescrever uma tradução já
  revisada; reescrever o arquivo pt/es do repositório direto (o caminho é sempre via Crowdin).

## Decisões tomadas por mim (Claude) — conferir

- Pasta de saída fora do `content/` e gitignored, em vez de gravar no repositório.
- Reuso do pt 5.1 no 5.2 só com nome em inglês **idêntico**.
- Na dúvida, não traduz.
- Upload num workflow manual próprio no GitHub Actions (não local), para usar o token que já está
  nos secrets e não mexer no `crowdin.yml`.
- O script consulta o Crowdin e pula strings que já têm tradução lá.
- Fonte pt citada pelo endereço `gitlab.com/fvtt-brasil/dnd5e`, que continua no ar.
- As `choices` são grupos (Invocações, Dádiva Épica, Estilo de Luta); o casamento por trecho depois
  de `": "` no es só vale sem ambiguidade e quase não deve casar nada.

## Em aberto

Nada.

## Licença OGL do texto pt-BR (decidido pela Rebeca)

O README do módulo diz que o texto traduzido está sob a OGL 1.0a (o MIT cobre só o código); o
`NOTICE.md` hoje o descreve como adaptação do SRD 5.1 (CC-BY) distribuída sob MIT. **Corrigir no
mesmo PR:**

- O trecho do Foundry VTT Brasil no `NOTICE.md` passa a dizer que o texto traduzido é OGL 1.0a,
  cobrindo as magias pt 5.1 (já no app) e os nomes de classes deste lote.
- Incluir o texto completo da OGL 1.0a (arquivo próprio no `content/dnd5e/` ou bloco no
  `NOTICE.md`, a critério de quem construir) com a seção 15 copiada do módulo.
- Conferir se README e `app/[locale]/(public)/terms/page.tsx`, que também citam o módulo, precisam
  do mesmo ajuste.

## Para quem for construir decidir

- Nome do script/comando (`npm run content:foundry-translations` segue o padrão).
- Como baixar as fontes (clone fixado em pasta temporária, tarball, etc.).
- A forma exata do upload (Crowdin CLI com `--base-path` apontando para a pasta de saída, ou API).
- Testes do casamento (unitários com amostras pequenas das fontes).
