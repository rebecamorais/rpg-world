# Política de Segurança

## Versões com suporte

O RPG World é publicado continuamente a partir da branch `main` em
[rpgworldapp.com](https://rpgworldapp.com/). Só a versão em produção recebe correções de
segurança.

## Como reportar uma vulnerabilidade

**Não abra uma issue pública.** Use o
[reporte privado de vulnerabilidades do GitHub](https://github.com/rebecamorais/rpg-world/security/advisories/new)
(aba **Security** → **Report a vulnerability**).

Inclua, se possível:

- O que a falha permite (ex.: ler a ficha de outra pessoa, escalar permissão, XSS)
- Passo a passo para reproduzir, com URLs e payloads
- Impacto que você imagina e qualquer ideia de correção

## O que esperar

- Confirmação de recebimento em até **7 dias**.
- Uma avaliação inicial e, se confirmada, um plano de correção logo depois.
- Crédito no advisory publicado, se você quiser.

## Escopo

Dentro do escopo: o app em `rpgworldapp.com`, este repositório e as políticas de acesso (RLS) do
banco.

Fora do escopo: ataques de negação de serviço, engenharia social, spam e falhas em serviços de
terceiros (Supabase, Vercel, Cloudflare, Crowdin) que não dependam da nossa configuração.
