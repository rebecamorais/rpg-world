# Conteúdo oficial em arquivos, homebrew no banco

**Data:** 2026-10-15
**Status:** planejamento, nada implementado. Liga os planos `2026-10-15-traducoes-comunitarias.md`
(de onde vem o conteúdo), `2026-10-15-limites-de-uso.md` (custo do banco) e
`2026-10-15-party-e-notas.md` (compartilhar com a party).

A ideia: **o conteúdo de regras que é igual para todo mundo vira arquivo versionado no
repositório**, e **o banco guarda só o que os usuários criam**. E qualquer tipo de conteúdo pode
ter homebrew: magias, itens, classes, subclasses, antecedentes, espécies, talentos, monstros,
condições…

## Como está hoje

- As 319 magias do SRD 5.1 estão no banco (`spells` + `spell_translations`), carregadas por uma
  migração de seed. Atualizar conteúdo = migração SQL enorme, difícil de revisar.
- A busca (`SupabaseSpellsRepository.findAll`) filtra por nome, nível, escola, classe e tipo de
  dano e pagina no banco.
- `character_spells` aponta para `spells.id` (UUID) com chave estrangeira.
- Classe, raça e antecedente do personagem são texto livre em `system_data`.
- Não existe homebrew.

## 1. Conteúdo oficial em arquivos

- O importador (plano de traduções comunitárias) gera JSON em vez de SQL, por exemplo:
  - `content/dnd5e/srd-5.1/spells.json` (dados mecânicos);
  - `content/dnd5e/srd-5.1/i18n/pt-BR/spells.json` (textos por idioma).
- Cada entrada tem uma **chave estável**: `<sistema>:<fonte>:<tipo>:<id>`, por exemplo
  `dnd5e:srd-5.1:spell:fireball`.
- O servidor carrega só o sistema/fonte/idioma pedidos, mantém em memória e faz a busca ali
  (normalizando acentos). Para alguns milhares de itens por tipo, é rápido.
- **Ganhos:** acaba a seed de conteúdo; atualizar ou traduzir é um diff de arquivo num PR; quem
  hospeda a própria instância não precisa popular o banco; testes de busca sem banco; menos custo
  de banco.
- **Validação:** um schema (Zod, em `shared/systems/<sistema>`) por tipo de conteúdo valida os
  arquivos no CI. O mesmo schema valida o homebrew (ver abaixo).

## 2. Homebrew de qualquer tipo no banco

Com 10+ tipos de conteúdo, uma tabela por tipo (como `spells`) vira dezenas de tabelas. Proposta:
**uma tabela genérica**, com os dados do tipo validados pelo mesmo schema do conteúdo oficial.

- **`homebrew_entries`**
  - `id` (UUID), `owner_id`, `system` (texto, não enum, para aceitar sistemas novos), `type`
    (`spell`, `item`, `class`, `subclass`, `background`, `species`, `feat`, `monster`…);
  - `data` (jsonb) validado pelo schema do tipo e do sistema, e `schema_version`, para migrar
    quando o schema mudar;
  - `visibility`: `private` | `party` | `public`;
  - `based_on` (opcional): chave do conteúdo oficial de que partiu ("Bola de Fogo, versão da
    mesa");
  - `created_at`, `updated_at`, `archived_at`.
- **`homebrew_entry_translations`**: `entry_id`, `locale`, `name`, `texts` (jsonb com os campos de
  texto do tipo: descrição, em níveis superiores…). Quem cria escreve no próprio idioma; outras
  pessoas podem traduzir depois.
- **RLS:** dono lê e edita; membros das parties do dono leem quando `party`; todo mundo lê quando
  `public`. Escrita só do dono.
- **A tabela `spells` atual** deixa de existir depois que as magias oficiais forem para arquivo
  (o homebrew de magia vai para `homebrew_entries`). Ela não é reaproveitada porque é específica
  de magia e de D&D.

## 3. Como o personagem aponta para o conteúdo

O mesmo formato de referência para oficial e homebrew, em qualquer lugar da ficha:

- oficial: `dnd5e:srd-5.1:spell:fireball`;
- homebrew: `homebrew:<uuid>`.

- `character_spells` troca `spell_id` (UUID com chave estrangeira) por `content_ref` (texto).
  Migração dos personagens existentes: UUID atual → chave estável pelo `external_index`.
- Classe, antecedente, espécie e itens do inventário passam a guardar a referência (além do texto
  livre, que continua valendo para quem não quer escolher de uma lista).
- **Homebrew em uso não é apagado de vez:** "excluir" vira `archived_at`; quem já usa continua
  vendo, só não aparece mais na busca.
- No código, um `ContentCatalog` por tipo junta arquivo + banco e devolve o mesmo tipo de domínio
  (`Spell`, `Item`…). Busca, Spellbook e ficha não sabem de onde veio; a interface só mostra um
  selo "Homebrew" com o autor.

## 4. Compartilhar e o caminho de volta

- `party`: a mesa inteira usa o mesmo homebrew (ex.: o item mágico que o mestre criou).
- `public`: aparece numa busca da comunidade, com autor, e qualquer pessoa pode usar na própria
  ficha (sempre apontando para o original, ver "Uma versão só").
- **Homebrew público bom pode virar conteúdo da comunidade:** exportar para o formato de arquivo e
  abrir PR, no mesmo fluxo das traduções.
- **Licença (decidido): CC-BY-4.0.** Publicar como `public` pede aceitar que o conteúdo fica sob
  CC-BY-4.0, com crédito ao autor (o mesmo regime do SRD). Isso precisa entrar nos Termos de Uso
  junto com a funcionalidade.
- Conteúdo público precisa de denúncia/moderação mínima.

## 5. Limites e custo

- O banco passa a guardar só o que os usuários criam, que é exatamente o que o plano de limites
  controla.
- `max_homebrew_spells` vira `max_homebrew_entries` (total, ou por tipo se fizer falta) e um teto
  de tamanho para `data` e para os textos.

## 6. Sistemas próprios

Mesma ideia, mas bem maior: um sistema define atributos, ficha e cálculos, não só listas de
conteúdo. Começar com sistemas definidos em arquivos (como o plano de Feiticeiros & Maldições).
Sistemas criados por usuários no banco só quando houver um formato de definição de sistema
estável.

## Uma versão só (decidido)

Para simplificar, **todo homebrew tem uma única versão, a do autor**:

- Quem usa um homebrew aponta sempre para o original. **Não existe cópia independente** nem
  "versão que eu adotei".
- Quando o autor edita, a mudança aparece para todo mundo que usa, na hora.
- Quando o autor arquiva, quem já usa continua vendo a última versão; só some da busca.
- Consequências aceitas: uma edição do autor pode mudar a ficha de outras pessoas. Para não pegar
  ninguém de surpresa, a interface mostra "atualizado em …" no conteúdo homebrew.
- Se um dia fizer falta, versões ou cópias podem entrar depois sem mudar o formato da referência
  (`homebrew:<uuid>`).

## Ordem sugerida

1. Chave estável de conteúdo e schemas por tipo (começando por magia).
2. Importador gerando arquivos; `ContentCatalog` de magias lendo arquivo, com a busca atual
   reproduzida (mesmos resultados que o banco).
3. `character_spells` → `content_ref`, com migração dos personagens existentes; remover a seed e a
   tabela `spells`.
4. `homebrew_entries` + traduções + RLS, começando por magias e itens.
5. Compartilhar com a party e público; licença nos Termos.
6. Demais tipos (classes, antecedentes, espécies, talentos, monstros).
