# Acessibilidade

Queremos que qualquer pessoa consiga criar e jogar com a sua ficha no RPG World, inclusive quem usa
leitor de tela, teclado ou zoom.

## Meta

Seguir as [WCAG 2.1](https://www.w3.org/TR/WCAG21/) nível **AA**.

## Como verificamos

- Testes automáticos com [axe-core](https://github.com/dequelabs/axe-core) no Playwright
  (`e2e/a11y.spec.ts`), rodando no CI em todo PR, nos temas escuro e claro. Violações sérias ou
  críticas das WCAG A/AA fazem o teste falhar.
- Os tokens de cor dos dois temas e as cores livres (como a cor de destaque da ficha) têm testes de
  contraste, que falham se um par de cores ficar abaixo do mínimo da WCAG AA.
- Cada página tem um único `main` e um único `h1`, para leitores de tela pularem direto ao conteúdo.
- Mudanças de tela são conferidas no desktop e no celular antes do merge.

## Ambientes suportados

- Navegadores atuais baseados em Chromium (Chrome, Edge), Firefox e Safari
- Desktop e celular (layout responsivo)

## Limitações conhecidas

- **Sem modo de alto contraste.** Há tema escuro e claro, mas ainda não um modo de alto contraste.
- Navegadores sem suporte a `oklch(from …)` (cores relativas do CSS) recebem cores de reserva, que
  são só de melhor esforço: o contraste das cores livres não é garantido nesses navegadores.
- Os testes automáticos pegam só parte dos problemas; a navegação completa com leitor de tela ainda
  não foi testada de forma sistemática.
- Conteúdo de terceiros (descrições de magias e traduções da comunidade) pode não ter a mesma
  revisão de texto que a interface.

## Reportar uma barreira

Se algo impede ou atrapalha você de usar o app, abra uma issue com o
[formulário de bug](https://github.com/rebecamorais/rpg-world/issues/new?template=bug.yml) e marque
que é um problema de acessibilidade. Conte qual página, o que você tentou fazer e qual tecnologia
assistiva usa (se usar). Se preferir, conte no [Discord](https://discord.gg/7u6guShqhQ). Problemas de acessibilidade são tratados como bugs.
