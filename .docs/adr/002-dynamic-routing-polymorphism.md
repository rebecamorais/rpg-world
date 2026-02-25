# ADR-002: Roteamento Dinâmico para Polimorfismo de UI (Padrão Multissistema)

## Contexto
O projeto visa abrigar personagens e formatos de fichas de múltiplos RPGs (D&D 5e, Tormenta, Vampiro). Construir telas de `if/else` intermináveis dentro de um único componente estragaria a manutenção.

## Decisão
Utilizaremos o sistema de *Dynamic Routes* restrito do Next.js via paradigma de Pasta `[system_name]`: `/system/[system_name]/character/[id]`. O Next.js agirá como um "Layout Engine", direcionando a request para Server Components exclusivos para a arquitetura daquele RPG.

## Consequências
- **Positivas**:
    - Falhas de renderização em subcomponentes de um sistema não afetam outros (Error Boundaries fáceis).
    - Carga útil de rede menor (vazamento de tipos/dependências evitado).
    - Maior clareza nas URLs.
- **Negativas**:
    - Necessidade de duplicar lógica de layout base caso os sistemas sejam muito parecidos (mitigável via shared components).
