# ADR-003: Registro de API Isomórfica (@api)

## Contexto
No Next.js (App Router), a fronteira entre cliente e servidor é fluida. Desenvolvedores frequentemente enfrentam dilemas:
- Fazer `fetch` para rotas internas no servidor (ineficiente).
- Importar serviços de back-end no front-end por engano (vaza código/segredos e quebra o build).
- Duplicar definições de tipos e caminhos de URL.

Precisamos de uma interface única que "faça a coisa certa" dependendo do ambiente.

## Decisão
Implementar um **Isomorphic API Registry** sob o alias `@api`. 
Utilizaremos um **Factory Pattern** que encapsula a lógica de ambiente:
- **No Servidor**: Utiliza `import()` dinâmico para chamar a lógica de back-end diretamente (zero latência de rede).
- **No Cliente**: Utiliza `fetch()` para os endpoints de API correspondentes.

## Prós e Contras

### Prós
- **DX (Developer Experience)**: Interface única `api.domain.method()` com autocomplete total.
- **Performance**: Chamadas no servidor são locais (memória), não via rede (HTTP).
- **Segurança**: Bundle de cliente fica livre de dependências de servidor (Supabase Admin, etc).
- **Consistência**: Centraliza a definição de caminhos e contratos.

### Contras
- **Abstração**: Adiciona uma camada de "mágica" que novos desenvolvedores precisam entender.
- **Sincronização**: Exige manter as strings de rota da factory em dia com as API Routes reais.
- **Complexidade Inicial**: Requer configuração de uma factory de tipos robusta.

## Consequências
- **Positivas**: Redução drástica de boilerplate, maior velocidade de desenvolvimento e segurança garantida por design.
- **Negativas**: Leve curva de aprendizado sobre como adicionar novas rotas ao registro.

## Referência Técnica
Veja os detalhes de implementação e exemplos de uso em [src/api/index.ts](file:///home/rebeca/dev/github/rpg-world/src/api/index.ts).
