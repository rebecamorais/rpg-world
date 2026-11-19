# Suporte: modo manutenção

Para upgrades do Supabase ou qualquer janela em que o banco fica fora do ar. Com a flag ligada, toda
página mostra a tela "Voltamos já" na própria URL (status 503) e a API responde 503 com
`common_error_maintenance`. Nada disso lê o banco nem a sessão. Código em `shared/flags.ts` e
`proxy.ts`.

## Preparar (uma vez)

1. Vercel → Storage → **Create** → Edge Config, nome `rpg-world-flags`.
2. No store, **Connect Project** → `rpg-world`, nos ambientes Production e Preview. A Vercel cria a
   variável `EDGE_CONFIG`; ela só vale a partir do próximo deploy.
3. Em **Items**, crie a chave `flags` com:

   ```json
   { "maintenance": false }
   ```

Sem o store, sem a chave `flags` ou sem `maintenance` dentro dela, a flag fica desligada: um erro na
flag nunca derruba o site.

## Ligar e desligar

Em Items, edite `flags` para `{ "maintenance": true }` e salve. Vale em segundos, sem deploy. Confira
abrindo o site numa aba anônima. Para desligar, volte para `false`.

Desligue só com o projeto saudável no dashboard do Supabase. Logo depois, teste o login e abrir uma
ficha numa aba anônima.

## Avisar

Poste no Discord antes de ligar e depois de desligar. A tela de manutenção aponta para lá.
