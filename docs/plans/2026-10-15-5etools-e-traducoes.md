# Conteúdo do 5etools com tradução pt-BR e inglês

**Data:** 2026-10-15
**Status (2026-10-22):** entregue no #97 para magias (`2026-10-21-magias-por-edicao.md`): importador em
`scripts/content/` (5etools v2.38.0, só `srd52`), 339 magias do SRD 5.2 ao lado das 319 do 5.1,
filtro e etiqueta de edição. O pt do 2024 não existe em nenhuma fonte e não há tradução
automática: aparece em inglês com o selo "Em inglês" até chegar pelo Crowdin. Próximo conteúdo:
condições.

**Status (2026-10-21):** decidido e em andamento.

- **Licença:** só SRD (5.1 e 5.2), como já era.
- **Edições:** o mesmo feitiço em 2014 e 2024 são duas entradas, com textos e traduções próprios
  (chaves `dnd5e:srd-5.1:spell:fireball` e `dnd5e:srd-5.2:spell:fireball`), e aparecem como dois
  cartões. A edição é uma etiqueta (também para homebrew), não parte da identidade.
- **Lista:** mostra as duas edições com filtro, que começa na edição do personagem; dá para
  aprender magia de qualquer edição.
- **Esquema:** em vez de `source` na tabela `spells`, o conteúdo oficial vai para arquivo (plano de
  conteúdo e homebrew). Primeiro passo: `2026-10-21-magias-em-arquivo.md`.

O objetivo é trazer mais conteúdo de D&D (magias, condições, itens, talvez monstros) do formato do
5etools, sempre com **inglês como base e português do Brasil** lado a lado. A tabela de magias já
segue esse modelo; o plano é generalizar o que funciona nela.

## Como está hoje

- `spells` guarda os dados mecânicos (nível, escola, alcance, componentes, classes…) e
  `spell_translations` guarda o texto por `locale` (`name`, `description`, `higher_level`,
  `material`, `is_verified`).
- A carga veio de uma seed gerada uma vez (`20260328152200_seed_prod_spells.sql`, 319 magias). O
  `external_index` (`acid-arrow`) segue o padrão da 5e SRD API, não do 5etools.
- **4 magias não têm tradução em pt** (319 em `en`, 315 em `pt`).
- `external_index` é `UNIQUE` sozinho, sem `system` nem livro de origem (ver "Esquema").

## Antes de tudo: licença

Este é o ponto que mais pode mudar o plano.

- O SRD 5.1 (regras de 2014) e o SRD 5.2 (regras de 2024) estão em **CC-BY-4.0**: dá para usar,
  traduzir e publicar, com atribuição.
- O 5etools inclui **todo o conteúdo dos livros**, que não é aberto. Publicar isso num site
  público é risco de takedown.
- O 5etools marca nos dados o que é SRD (campos `srd` / `srd52` nas entradas; conferir no dump
  atual).

**Proposta:** usar o 5etools como _formato e fonte de importação_, mas só carregar no banco o que
for SRD. Conteúdo fora do SRD fica para um "importar meus dados" do próprio usuário, se um dia
fizer sentido (cada um traz o seu, nada é publicado pelo site).

Decidir isso antes de escrever o importador.

## Esquema

Mudanças nas tabelas de magia que valem também para os próximos tipos de conteúdo:

- **Origem do conteúdo:** coluna `source` (`PHB`, `XPHB`, `SRD`…) e `system` entrando na chave.
  `UNIQUE (system, source, external_index)` no lugar do `UNIQUE (external_index)`. Sem isso, o
  Fireball de 2014 e o de 2024 colidem (ver o plano do D&D 2024).
- **Tradução:** `is_verified` já existe e hoje é sempre `true`. Passar a usar de verdade:
  - `en` vem da fonte e é `is_verified = true`;
  - `pt` gerado automaticamente entra como `is_verified = false` e a interface mostra um selo
    discreto ("tradução automática");
  - revisão humana marca `true`. Talvez guardar `translated_by` / `reviewed_at`.
- **Fallback de idioma:** se faltar `pt`, mostrar `en` com aviso, em vez de sumir com a magia.
  Hoje é o que acontece com as 4 magias sem tradução? Conferir.
- **Próximos conteúdos** seguem o mesmo par: tabela com o dado mecânico + tabela `*_translations`
  (ex.: `conditions` / `condition_translations`, `items` / `item_translations`). Preferível a uma
  tabela genérica de "entradas", porque cada tipo tem campos mecânicos que a ficha usa.

## Importador

- **Script em `scripts/`**, não chamada em tempo de execução. Lê o JSON do 5etools (versão fixada),
  converte e gera uma migração de seed idempotente (`ON CONFLICT … DO UPDATE`), como a seed atual.
  O banco continua sendo a fonte da aplicação; o 5etools nunca é chamado pelo site.
- **Texto do 5etools:** as descrições vêm em `entries` (lista aninhada, tabelas, listas) com tags
  como `{@damage 8d6}`, `{@condition frightened}`, `{@spell fireball}`. Converter para um formato
  nosso:
  - Markdown simples para o texto;
  - tags viram marcações que a interface pode usar (rolagem de dado, link para condição/magia),
    ou texto puro na primeira versão.
- **Mapeamento:** escolas (`V` → `evocation`), tempo de conjuração, alcance, duração, classes
  (no 5etools as classes de magia ficam num arquivo separado, `sources.json`/`gendata`) para as
  colunas que já existem.
- **Traduções:** vêm primeiro das traduções comunitárias do Foundry (formato Babele), em vários
  idiomas; ver `2026-10-15-traducoes-comunitarias.md`. Tradução automática (LLM, com glossário
  versionado no repo) só para o que não existir em nenhuma fonte, gravada como não verificada.
- **Atualização:** rodar de novo o script com uma versão nova do 5etools só altera o `en` e os
  dados mecânicos; traduções `pt` revisadas não são sobrescritas (marcar quando o `en` mudou
  depois da revisão, para revisar de novo).

## Ordem sugerida

1. Decidir a licença (só SRD ou não).
2. Esquema: `source`, nova chave única, fallback de idioma, uso real do `is_verified`.
3. Importador de magias do 5etools reproduzindo as 319 atuais (comparar com a seed de hoje;
   nada deve mudar sem querer). Completar as 4 traduções que faltam.
4. Glossário pt e tradução automática marcada como não verificada.
5. Próximo conteúdo: condições (pequeno, usado pelos links das magias), depois itens.
