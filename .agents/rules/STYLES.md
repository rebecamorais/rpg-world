---
trigger: always_on
---

## 11. Tipografia & Design System (Tailwind Standard)

Para garantir consistência visual e manutenibilidade, o projeto segue estritamente a escala tipográfica padrão do Tailwind CSS. Evite o uso de valores arbitrários (ex: `text-[10px]`) exceto em casos de extrema necessidade técnica.

### Escala Padrão Recomendada:

| Classe          | Tamanho (px) | Line Height | Uso Comum                                                       |
| :-------------- | :----------- | :---------- | :-------------------------------------------------------------- |
| **`text-xs`**   | 12px         | 16px        | Labels secundários, mini-badges, notas de rodapé.               |
| **`text-sm`**   | 14px         | 20px        | **Padrão do Projeto.** Textos de interface, botões, descrições. |
| **`text-base`** | 16px         | 24px        | Corpo de texto longo, parágrafos de lore.                       |
| **`text-lg`**   | 18px         | 28px        | Subtítulos ou destaques de UI.                                  |

- **Estilo Premium**: Para labels pequenos, prefira combinar `text-sm` ou `text-xs` with `font-bold`, `tracking-wider` e `uppercase` em vez de reduzir ainda mais a fonte.
- **Acessibilidade**: O tamanho `text-xs` (12px) é o limite mínimo sugerido para garantir a legibilidade.

## 12. Sistema de Cores Dinâmicas (Proxy de Cores do Personagem)

Para suportar interfaces personalizadas baseadas no `accentColor` do personagem de forma sustentável, utilizamos um sistema de variáveis proxy e tokens do Tailwind v4.

### Princípios:

- **Proxy Centralizado**: Todas as cores dependentes do personagem devem ser definidas no `:root` do `globals.css` utilizando a variável base `--character-color`.
- **Tokens de Tema**: Estas variáveis devem ser mapeadas no `@theme inline` do Tailwind para permitir o uso de classes utilitárias semânticas.
- **Transparência e Efeitos**: Utilize `color-mix` diretamente na definição das variáveis CSS para criar camadas de superfície (`surface`), estados desabilitados (`muted`) ou brilhos (`glow`).

### Tokens Disponíveis:

| Token               | Variável CSS          | Descrição                                                     |
| ------------------- | --------------------- | ------------------------------------------------------------- |
| `character`         | `--character-primary` | Cor base do personagem (passa por fallback para `--primary`). |
| `character-flare`   | `--character-flare`   | Cor vibrante para ícones e destaques.                         |
| `character-surface` | `--character-surface` | Fundo sutil (10% opacidade) para cards e inputs.              |
| `character-muted`   | `--character-muted`   | Cor atenuada (30% opacidade) para bordas e estados inativos.  |
| `character-glow`    | `--character-glow`    | Brilho suave (50% opacidade) para sombras e efeitos de hover. |

### Regras de Implementação:

- **Proibido Estilo Inline**: Evite `style={{ color: 'var(--character-color)' }}`. Use classes como `text-character-flare`.
- **Proibido color-mix Ad-hoc**: Não utilize `color-mix` diretamente nos arquivos `.tsx`. Se precisar de uma nova variante, adicione-a ao `globals.css`.
- **Preferência Semântica**: Use `text-character-flare` em vez de `text-character` para elementos informativos (ícones, títulos pequenos) para aumentar o contraste.
- **Shadows e Borders**: Utilize as classes utilitárias de borda (`border-character-muted`) e sombra customizada aproveitando o mapeamento do tema.

## 13. Padronização de Cores do Sistema (Paleta Global)

Para evitar a proliferação de tons arbitrários, utilizamos uma paleta fixa para estados e categorias de dados, mapeada com variantes de transparência no `globals.css`.

### Tokens Principais:

| Cor          | Token Base | Variantes Disponíveis                      | Uso Comum                    |
| ------------ | ---------- | ------------------------------------------ | ---------------------------- |
| **Vermelho** | `red`      | `red`, `red-surface`, `red-muted`          | Perigo, Erro, HP Crítico.    |
| **Azul**     | `blue`     | `blue`, `blue-surface`, `blue-muted`       | Info, Magia, Mana.           |
| **Verde**    | `green`    | `green`, `green-surface`, `green-muted`    | Sucesso, HP, Natureza.       |
| **Amarelo**  | `yellow`   | `yellow`, `yellow-surface`, `yellow-muted` | Alerta, Inspiração, Sagrado. |

### Critérios de Uso:

- **Consistência**: Sempre prefira `bg-red-surface` ou `text-green-flare` em vez de valores hexadecimais arbitrários ou classes de cores do Tailwind com opacidades inline (ex: `bg-red-500/10`).
- **Acessibilidade**: Utilize a variante `flare` (base) para textos e ícones sobre fundos escuros para garantir visibilidade.
- **Semântica**: Embora os tokens tenham nomes de cores, tente associá-los à semântica do componente (ex: vermelho para erros, verde para confirmações).
