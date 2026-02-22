# Architectural Decision Records (ADRs)

Registro histórico do raciocínio e o "porquê" de certas decisões técnicas e de design de sistema terem sido tomadas no projeto.

---

## [ADR-001] Clean Architecture Light no Frontend e Repositórios Abstratos
**Contexto:** O Next.js (com App Router) permite e muitas vezes encoraja misturar a busca/persistência de dados diretamente nas lógicas de renderização (Server Components) e actions, o que pode causar forte acoplamento do sistema de DB à interface.
**Decisão:** Optamos por usar uma variante simplificada de Clean Architecture utilizando *Use Cases*, *Services* e *Repositories* baseados em interfaces (TypeScript) no backend do projeto (mesmo rodando em SSR/Actions).
**Consequências Positivas:** 
- A migração futura para Supabase não afetará os Use Cases nem o Frontend. Só exigirá escrever uma classe nova que imite a interface do Repository.
- Isola firmemente as regras. Rebeca do futuro vai agradecer. 

---

## [ADR-002] Roteamento Dinâmico para Polimorfismo de UI (Padrão Multissistema)
**Contexto:** O projeto visa abrigar personagens e formatos de fichas de múltiplos RPGs (D&D 5e, Tormenta, Vampiro). Construir telas de `if/else` intermináveis dentro de um único componente estragaria a manutenção.
**Decisão:** Utilizaremos o sistema de *Dynamic Routes* restrito do Next.js via paradigma de Pasta `[system_name]`: `/system/[system_name]/character/[id]`. O Next.js agirá como um "Layout Engine", direcionando a request para Server Components exclusivos para a arquitetura daquele RPG.
**Consequências Positivas:**
- Falhas de renderização em subcomponentes do D&D não derrubam e não afetam páginas de Call of Cthulhu, gerando um limite forte de erro (Error Boundaries fáceis).
- Carga útil de rede menor, pois as dependências/tipos dos outros sistemas não vazam pela URL atual.
- Maior clareza nas URLs.

