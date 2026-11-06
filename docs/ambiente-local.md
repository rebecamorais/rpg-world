# Ambiente local: logins e mesa pronta

O banco de desenvolvimento já vem com a mesa **The Pioneers** montada, com mestre, jogadores, fichas, magias e inventário. Dá para entrar e usar o app sem criar nada.

> Estas contas e senhas são públicas e existem só no banco local. Os seeds ficam em `database/db-dev/seeds` e não vão para a produção, que recebe apenas `database/migrations`.

## Como subir

Com o Docker rodando, siga o [passo a passo do README](../README.md#️-como-rodar-o-projeto-localmente). Em resumo:

```bash
npm install
```

```bash
cp .example.env.local .env.local
```

```bash
npm run infra up
```

Copie as chaves que o terminal mostrar para o `.env.local` e rode:

```bash
npm run dev
```

Abra <http://localhost:3000/login> e escolha **E-mail e senha**.

## Contas

| Papel   | E-mail                   | Senha       | Username                     | Personagens                                      |
| ------- | ------------------------ | ----------- | ---------------------------- | ------------------------------------------------ |
| Mestre  | `mestre@email.com`       | `mestre123` | `mestre`                     | 7 NPCs, em **Meus NPCs**                         |
| Jogador | `playerchilli@email.com` | `chilli123` | `playerChilli`               | Grace Hopper, Hedy Lamarr e Mirela Pardan        |
| Jogador | `playerpepper@email.com` | `pepper123` | `playerPepper`               | Ada Lovelace, Katherine Johnson e Maren Hamilton |
| Avulso  | `player@email.com`       | `player123` | escolhido no primeiro acesso | Alatar, o Sábio, fora da mesa                    |

Os NPCs do mestre são Joan of Arc, Ching Shih, Queen Nzinga, Hypatia, Florence Nightingale, Boudica e Mary Shelley.

## O que testar com cada conta

- **Mestre:** abra [a mesa](http://localhost:3000/parties/dddddddd-dddd-4ddd-8ddd-dddddddddddd) para ver a aba Role Play, abrir as fichas dos jogadores em modo leitura, iniciar um combate e usar o baú.
- **Jogadores:** edite as próprias fichas, prepare magias e use o inventário. Para ver mestre e jogador ao mesmo tempo, abra a outra conta em uma janela anônima.

A mesa não tem imagem porque o banco só aceita uma imagem enviada pelo mestre. O envio funciona normalmente em **Configurações** da mesa.

## Voltar ao estado inicial

Se o banco já existia antes destes dados, ou se você quiser desfazer o que mudou, rode:

```bash
npx supabase db reset --workdir database/db-dev
```

> **Atenção:** esse comando apaga tudo do banco local de desenvolvimento, inclusive contas e personagens que você criou, e aplica de novo as migrações e os seeds.

## Mudar os dados da mesa

O arquivo `database/db-dev/seeds/03-seed-the-pioneers.sql` é gerado a partir dos dados da demo, em `src/frontend/demo/data`. Não edite o SQL à mão. Depois de mudar os dados, gere o arquivo de novo:

```bash
npm run seed:local
```

Um teste unitário falha se o SQL ficar diferente dos dados da demo. Quem joga cada personagem e as contas ficam em `src/frontend/demo/data/local-seed.ts`.
