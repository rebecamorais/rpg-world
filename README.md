# RPG World 🎲

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/7u6guShqhQ) [![Roadmap](https://img.shields.io/badge/Roadmap-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/users/rebecamorais/projects/1) [![Crowdin](https://img.shields.io/badge/Crowdin-2E3340?style=for-the-badge&logo=crowdin&logoColor=white)](https://crowdin.com/project/rpgworld)

Fichas de RPG de mesa no navegador, começando por **Dungeons & Dragons 5ª Edição**. Gratuito, de código aberto, em português e inglês, com tema escuro e claro.

🔗 **Acesse:** [rpgworldapp.com](https://rpgworldapp.com/) · **Conheça sem conta:** [demo da mesa The Pioneers](https://rpgworldapp.com/demo)

## ✨ O que já dá para fazer

- **Ficha completa em uma página:** atributos, salvaguardas, perícias com proficiência e especialização, CA, iniciativa, deslocamento e dado de vida. Modificadores, bônus de proficiência e percepção passiva são calculados sozinhos.
- **Vida e magia do seu jeito:** PV, PV temporário e salvaguardas contra a morte; espaços de magia por círculo ou pontos de magia.
- **Grimório do SRD:** 658 magias do SRD 5.1 (2014) e do SRD 5.2 (2024), com busca e filtro por edição, nível, escola, classe e tipo de dano.
- **Inventário:** algibeira com pagar e receber (o troco vem sozinho) e mochila com os itens do SRD e o peso total.
- **História do personagem:** aparência, traços, ideais, vínculos, defeitos e história, com avatar e cor de destaque.
- **Mesas:** convite por link ou nome de usuário; o mestre vê os personagens em modo Role Play e conduz o combate com iniciativa, vida e condições em tempo real; baú da party e diário no Google Docs.

## 🗺️ Próximos passos

O que vem agora e em que ordem está no [Project Roadmap](https://github.com/users/rebecamorais/projects/1). A próxima grande entrega são as **mecânicas de classe** (pontos de feitiçaria, Forma Selvagem e os demais recursos, com descanso curto e longo), pedido de quem joga.

## 🚀 Tecnologias

- **Framework:** Next.js 16 (React 19), TypeScript e Tailwind CSS 4
- **Banco de dados e auth:** Supabase (Postgres com RLS, Auth, Storage e Realtime)
- **Conteúdo de regras:** arquivos versionados em `content/` (magias, itens e condições do SRD 5.1 e 5.2), traduzidos pela comunidade no [Crowdin](https://crowdin.com/project/rpgworld)
- **Testes:** Vitest, Playwright com axe (acessibilidade AA nos dois temas) e Stryker

## 🛠️ Como rodar o projeto localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 24+
- [Docker](https://www.docker.com/) (necessário para o banco de dados local)

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .example.env.local .env.local
```

### 3. Suba a infraestrutura local (Supabase & Docker)

> O Docker precisa estar rodando antes deste passo.

```bash
npm run infra up
```

Este comando irá subir os containers do Supabase (Dev e Test), configurar os symlinks necessários e gerar as tipagens do banco de dados automaticamente.

Ao finalizar, o terminal exibirá as chaves geradas para o ambiente de **Dev**. Copie os valores para o `.env.local`:

```
API URL        →  NEXT_PUBLIC_SUPABASE_URL
Anon key       →  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
Service role   →  SUPABASE_SECRET_KEY
```

> **Dica:** O ambiente de testes roda na porta **54421** de forma isolada.

### 4. Rode o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

O banco local já vem com a mesa **The Pioneers** pronta. Entre com `mestre@email.com` e senha `mestre123`; as contas dos jogadores estão em [Ambiente local: logins e mesa pronta](docs/ambiente-local.md).

### URLs do ambiente local

| Serviço              | URL                    |
| -------------------- | ---------------------- |
| Aplicação            | http://localhost:3000  |
| Supabase Studio (UI) | http://localhost:54323 |
| Inbucket (emails)    | http://localhost:54324 |
| Supabase API (Dev)   | http://localhost:54321 |
| Supabase API (Test)  | http://localhost:54421 |

> O **Inbucket** intercepta os emails enviados pelo auth (Magic Link, OTP) localmente — não é necessário um email real para testar.

## 📜 Documentação Interna

Para detalhes técnicos mais profundos, consulte nossos guias:

- [🗺️ Mapa e Estrutura do Projeto](.agents/rules/MAP_AND_STRUCTURE.md) - Guia de navegação por diretórios e arquitetura.
- [🏆 Regras de Ouro & Princípios](.agents/rules/RULES_REFERENCE.md) - Padrões de código, banco de dados e testes.
- [🤝 Guia de Contribuição](CONTRIBUTING.md) - Como configurar o ambiente e padrões de desenvolvimento.

## 🛠️ Scripts Disponíveis

| Comando                 | Descrição                                                       |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Inicia o servidor de desenvolvimento                            |
| `npm run infra up`      | Sobe Docker, sincroniza pastas e gera tipos                     |
| `npm run infra down`    | Para todos os containers da infraestrutura                      |
| `npm run clean`         | Reset total: apaga volumes, recria o banco e limpa o docker     |
| `npm run db:ui`         | Abre o Supabase Studio e o Inbucket no navegador                |
| `npm run seed:local`    | Gera o seed da mesa local a partir dos dados da demo            |
| `npm run test`          | Executa a pipeline completa (Unitários + Infra + Integração)    |
| `npm run test:unit`     | Executa apenas os testes unitários                              |
| `npm run test:ui`       | Abre a interface visual do Vitest                               |
| `npm run test:e2e`      | Testes ponta a ponta com Playwright (build de produção)         |
| `npm run test:coverage` | Cobertura dos testes unitários (relatório em `coverage/`)       |
| `npm run test:mutation` | Mutation testing com Stryker (relatório em `reports/mutation/`) |
| `npm run lint`          | Verifica erros de linting                                       |
| `npm run knip`          | Procura arquivos, exports e dependências sem uso                |
| `npm run format`        | Formata o código usando Prettier                                |

## 💬 Comunidade

O canal oficial do projeto é o [Discord do RPG World](https://discord.gg/7u6guShqhQ): suporte, dúvidas, ideias e conversa
sobre as próximas features. Bugs e sugestões também podem virar
[issue](https://github.com/rebecamorais/rpg-world/issues/new/choose); vulnerabilidades seguem a
[política de segurança](SECURITY.md).

Antes de participar, leia o [Código de Conduta](CODE_OF_CONDUCT.md). Para contribuir com código,
veja o [Guia de Contribuição](CONTRIBUTING.md).

---

Desenvolvido com 💜 por Rebeca.

## 📄 Licença

Este projeto está licenciado sob a **GNU GPLv3**. Consulte o arquivo [LICENSE](LICENSE) para obter mais detalhes.

O conteúdo de regras vem de fontes abertas com licenças próprias: o SRD 5.1 e o SRD 5.2 da Wizards of the Coast (CC-BY-4.0), os dados da [5e SRD API](https://github.com/5e-bits/5e-database) (MIT), as magias de 2024 extraídas do [5etools](https://github.com/5etools-mirror-3/5etools-src) e as traduções em português da comunidade [Foundry VTT Brasil](https://gitlab.com/fvtt-brasil/dnd5e) (MIT). Créditos completos em [NOTICE.md](NOTICE.md).

Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio).
