# Conteúdo de terceiros e créditos

O código do RPG World é licenciado sob a GNU GPLv3 (ver [LICENSE](LICENSE)). O conteúdo de regras
(`content/`) vem das fontes abaixo, cada uma com a sua licença.

Os retratos da demo dos Pioneers em `public/demo/pioneers` foram gerados com IA (ChatGPT / OpenAI Image Generation).

## System Reference Document 5.1

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards
of the Coast LLC and available at <https://dnd.wizards.com/resources/systems-reference-document>.
The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available
at <https://creativecommons.org/licenses/by/4.0/legalcode>.

Usado em: textos em inglês das magias (`content/dnd5e/srd-5.1/i18n/en/spells.json`).

## Documento de referencia del sistema 5.1 (español)

Esta obra incluye materiales extraídos del Documento de referencia del sistema 5.1 ("SRD 5.1") de
Wizards of the Coast LLC, que está disponible en
<https://dnd.wizards.com/es/resources/systems-reference-document>. El SRD 5.1 tiene la licencia
Creative Commons Atribución/Reconocimiento 4.0 Licencia Pública Internacional, que está disponible
en <https://creativecommons.org/licenses/by/4.0/legalcode.es>.

Usado em: magias e condições em espanhol (`content/dnd5e/srd-5.1/i18n/es/`), extraídas do PDF
oficial (<https://www.dndbeyond.com/srd>). Só a marcação foi acrescentada: as tags de condição
`{@condition …}` e as tabelas em Markdown, como nos textos em inglês.

## System Reference Document 5.2

This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of
the Coast LLC, available at <https://www.dndbeyond.com/srd>. The SRD 5.2 is licensed under the
Creative Commons Attribution 4.0 International License, available at
<https://creativecommons.org/licenses/by/4.0/legalcode>.

Usado em: magias de 2024 (`content/dnd5e/srd-5.2/`). Os dados foram extraídos do 5etools
(<https://github.com/5etools-mirror-3/5etools-src>, versão fixada em
`scripts/content/import-5etools-spells.ts`), só das entradas que ele marca como SRD 5.2.

O RPG World não é afiliado, endossado nem patrocinado pela Wizards of the Coast. Dungeons & Dragons
e D&D são marcas da Wizards of the Coast LLC.

## 5e SRD API

Os dados das magias em inglês (identificadores como `acid-arrow`, nível, escola, componentes e os
textos do SRD 5.1) foram obtidos da 5e SRD API (<https://www.dnd5eapi.co>), cujos dados vêm do
repositório <https://github.com/5e-bits/5e-database>, distribuído sob a licença MIT:

```text
MIT License

Copyright (c) [2018-2020] [Adrian Padua, Christopher Ward]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Tradução em português do Brasil: Foundry VTT Brasil

As traduções em português das magias do SRD 5.1 (`content/dnd5e/srd-5.1/i18n/pt/spells.json`),
das descrições dos itens (`content/dnd5e/srd-5.1/i18n/pt/items.json`) e dos nomes e descrições das
classes, subclasses e características (`content/dnd5e/srd-5.{1,2}/i18n/pt/classes.json`) vêm do
módulo de tradução do sistema D&D 5e para o Foundry VTT, mantido pela comunidade Foundry VTT Brasil:
<https://gitlab.com/fvtt-brasil/dnd5e>. Os nomes de classe são enviados ao Weblate por
`npm run content:foundry-class-names`; os demais textos foram conferidos com o inglês, receberam a
marcação do RPG World e entraram pelo Weblate. Agradecemos a Cauã Pessoa e a todas as pessoas que
contribuíram com essa tradução. No SRD 5.2 só se reaproveitam os nomes (de classes e de magias) cujo
original em inglês não mudou.

O texto traduzido é Open Game Content sob a Open Game License v1.0a, como o módulo declara. O texto
completo da licença, com a seção 15 (Copyright Notice), está em
[`content/dnd5e/OGL-1.0a.txt`](content/dnd5e/OGL-1.0a.txt). A licença MIT abaixo cobre só o código
do módulo:

```text
MIT License

Copyright (c) 2020 Cauã Pessoa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Tradução em português do Brasil do SRD 5.2: decito/dnd5e-pt-br

Os nomes em português das classes, subclasses e características do SRD 5.2
(`content/dnd5e/srd-5.2/i18n/pt/classes.json`) que não vêm do módulo acima são sugeridos a partir do
módulo "Translation: Português (Brasil) [D&D 5E](SRD)" para o Foundry VTT, de decito, java3040 e
MagelaCE: <https://github.com/decito/dnd5e-pt-br>. Ele continua o módulo do Foundry VTT Brasil e
traduz material do System Reference Document 5.2 da Wizards of the Coast LLC (CC BY 4.0, atribuição
acima). Os nomes são enviados ao Weblate por `npm run content:foundry-class-names` e só entram
depois de conferidos. O repositório não declara uma licença própria para o texto traduzido.

## Game Icons

Ícones de <https://game-icons.net> por Lorc, Delapouite e colaboradores, licenciados sob
Creative Commons Attribution 3.0 (CC BY 3.0), disponível em
<https://creativecommons.org/licenses/by/3.0/>.

Usado em: ícones de jogo da interface (`src/frontend/constants/game-icons.svg`), inclusive as
imagens padrão dos itens.

## Traducción al español del SRD 5.2.1: translate-dnd5e-sdr2-es

Os textos em espanhol do SRD 5.2 (`content/dnd5e/srd-5.2/i18n/es/`: magias, itens, nomes das
condições e nomes e descrições das classes, subclasses e características) vêm do módulo "D&D 5e SRD
2024 Spanish Translation" para o Foundry VTT, de
[foundryvtt-sinregistrar](https://github.com/foundryvtt-sinregistrar):
<https://github.com/foundryvtt-sinregistrar/translate-dnd5e-sdr2-es>. Os nomes de classe são
enviados ao Weblate por `npm run content:foundry-class-names`; os demais textos foram conferidos com
o inglês e entraram pelo Weblate. O módulo é licenciado sob a
Creative Commons Attribution 4.0 International (CC BY 4.0,
<https://creativecommons.org/licenses/by/4.0/legalcode>) e incorpora material do System Reference
Document 5.2.1 da Wizards of the Coast LLC (CC BY 4.0, atribuição acima). Só a forma foi adaptada:
cada texto foi associado ao conteúdo correspondente do RPG World pelo nome em inglês, recebeu a
marcação do RPG World (tags e tabelas) e teve corrigidos erros de extração, como palavras partidas
por hífen.
