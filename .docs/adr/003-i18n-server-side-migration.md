# ADR-003: Migração do i18n para Server-Side (next-intl via Middleware + Cookie)

## Status
**Aceita** — Implementada em 2026-02-25

## Contexto
O projeto usava `next-intl` com detecção de idioma 100% client-side: o `LanguageProvider` lia o locale do `localStorage`, carregava dicionários dinamicamente e envolvia toda a árvore com `NextIntlClientProvider`. A troca de idioma era feita via um hack global (`window.__changeLocale`). Isso impedia o uso de `useTranslations` (e `getTranslations`) em Server Components, forçando **todos** os componentes que exibem texto traduzido a serem Client Components.

## Decisão
Migrar para detecção server-side utilizando:
1. **Middleware** (`middleware.ts`) que lê o cookie `NEXT_LOCALE` e define o locale na request via `next-intl/middleware`, sem prefixo de URL (`localePrefix: 'never'`).
2. **Layout async** (`app/layout.tsx`) que usa `getLocale()` / `getMessages()` para buscar locale e mensagens no servidor e passá-los como props ao `Providers`.
3. **`Providers.tsx`** recebe `locale` + `messages` e envolve a árvore com `NextIntlClientProvider`.
4. **`LanguageSwitcher`** agora seta o cookie `NEXT_LOCALE` + chama `router.refresh()` para re-renderizar com o novo idioma.
5. **`LanguageProvider.tsx`** deletado — substituído pelo fluxo nativo do `next-intl`.

## Prós
- **`useTranslations` funciona em Server Components** — desbloqueia decomposição de componentes na estratégia Leaf.
- **Sem flash de conteúdo não traduzido (FOUC)** — o servidor já entrega o HTML com as traduções corretas.
- **Cookie persiste entre reloads** — sem depender de `localStorage` que não existe no SSR.
- **Elimina hack global** (`window.__changeLocale`) — código mais limpo e previsível.
- **Compatível com Server Actions futuras** — ações server-side podem acessar o locale via `getLocale()`.
- **SEO melhorado** — `<html lang>` é definido dinamicamente no servidor.

## Contras
- **Todas as rotas viram Dynamic** — o middleware intercepta toda request, então o Next.js não consegue fazer static prerendering. Para este projeto (app autenticada, não pública), o impacto é mínimo.
- **Troca de idioma faz round-trip ao servidor** — `router.refresh()` faz um re-render server-side em vez de trocar dicionários client-side. A UX é imperceptivelmente diferente, mas adiciona uma request HTTP. Não deve acontecer com frequencia.
- **Cookie sem proteção contra expiração** — se o cookie expirar (max-age: 1 ano), o fallback é o locale default (`en`) via `Accept-Language` header.
- **Middleware adicionado** — mais uma camada no pipeline de request. Em projetos sem i18n, seria overhead. Aqui, é justificado.

## Alternativas Consideradas
1. **Manter 100% client-side** — descartada porque impedia Server Components com traduções.
2. **Prefixo de URL (`/en/`, `/pt/`)** — descartada para manter a estrutura de rotas limpa e evitar migração de URLs existentes.
3. **Subpath routing com `[locale]` segment** — descartada pela mesma razão + complexidade adicional no roteamento.
