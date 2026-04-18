# Esqueleto para nova skill `*-lore-reviewer`

Copie e adapte os blocos abaixo ao gerar `.agent/skills/<nome>-lore-reviewer/SKILL.md`. Substitua placeholders `{{...}}`.

---

## Frontmatter (YAML)

```yaml
---
name: { { skill-folder-name } }
description: >
  Revisor de Lore do projeto RPG {{CampanhaOuMundo}}. {{O_que_faz_em_uma_frase}}.
  Use quando {{gatilhos: revisar lore, analisar sessões, inconsistências, ganchos}}.
---
```

Regras: `name` deve ser idêntico ao nome da pasta pai; só minúsculas, números e hífens; máx. 64 caracteres.

---

## Árvore do vault (exemplo)

Ajuste caminhos relativos ao vault real. Mantenha comentários curtos à direita.

```
{{RaizDoVaultOuPasta}}/
├── {{pasta_ideias}}/
├── {{pasta_docs_macro}}/
├── {{pasta_lore_detalhado}}/
│   └── _indice.md
├── {{pasta_sessoes_ou_anotacoes}}/
├── {{pasta_npcs}}/
└── {{pasta_fichas_ou_campanha_ativa}}/
```

---

## Lista de leitura obrigatória (template)

Numerar na ordem em que o revisor deve abrir os arquivos:

1. `{{caminho}}/{{indice_ou_visao_geral}}`
2. `{{caminho}}/{{linha_do_tempo_ou_cronologia}}`
3. `{{...}}`

Para análise de sessão N, acrescentar transcrição/resumo correspondente.

---

## Template do relatório de revisão

```markdown
# Relatório de Revisão de Lore — {{Escopo}}

## Inconsistências encontradas

### {{Título}}

- **Arquivo A diz:** [citação + caminho]
- **Arquivo B diz:** [citação + caminho]
- **Impacto:** Alto / Médio / Baixo
- **Sugestão de resolução:** [proposta]

---

## Informações incompletas

### {{Item}}

- **Mencionado em:** [arquivo e contexto]
- **O que falta:** [gap]
- **Sugestão de preenchimento:** [proposta]

---

## Ideias de história e ganchos

### {{Gancho — título}}

- **Inspiração:** [fonte no lore]
- **Setup:** [introdução]
- **Desenvolvimento:** [possível arco]
- **Conexão com personagens:** [quem e como]

---

## Sugestões de organização

### {{Sugestão}}

- **Problema atual:** [descrever]
- **Solução proposta:** [reorganizar / fundir / criar arquivo]
```

---

## Modos de ativação (exemplos)

Defina prefixos coerentes com o projeto; exemplos genéricos:

- `/lore check` — revisão ampla
- `/lore sessão [N]` — cruzar sessão N com o restante do lore
- `/lore npc [nome]` — raio-X de NPC e lacunas
- `/lore gancho` — ideias para próximas sessões
- `/lore organizar` — estrutura de pastas e duplicações

---

## Diretrizes narrativas (preencher)

- Tom da campanha: {{...}}
- Estilo do mundo: {{...}}
- O que não pode ser contradito (canon): {{...}}
- Como marcar especulação: {{ex.: bloco ESPECULAÇÃO ou #wip}}

---

## Ao modificar arquivos no vault

Liste convenções do repositório (Markdown, seções, tabelas, onde registrar sessão nova, índices a atualizar).
