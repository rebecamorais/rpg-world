# D&D 5e Character Schema (Technical Mapping)

Este documento detalha todos os campos que uma ficha completa e "padrão" de D&D 5e precisa para operar de forma modular dentro do projeto. Ele reflete a remoção do conceito intruso de "Mana" em favor de **Spell Slots** estruturados por círculo de magia e a introdução de blocos para Status Vitais, Atributos de Conjuração e Inventário mínimo.

## 1. Information Basics (Identificação & Roleplay)
- `name` (string): Nome do Personagem.
- `race` (string): Raça do Personagem.
- `class` (string): Classe Primária (no futuro abrimos pra Multiclasse).
- `subclass` (string): Subclasse do Personagem.
- `level` (number): Nível total do personagem.
- `background` (string): Antecedente.
- `alignment` (string): Tendência (ex: Chaotic Good).
- `xp` (number): Pontos de Experiência.

## 2. Vital Status (Combate e Sobrevivência)
- `hpMax` (number): Pontos de Vida Máximos.
- `hpCurrent` (number): Pontos de Vida Atuais.
- `hpTemp` (number): Pontos de Vida Temporários.
- `ac` (number): Armor Class (Classe de Armadura).
- `speed` (number): Deslocamento (em pés/metros a ser formatado).
- `initiative` (number): Bônus ou valor bruto de Iniciativa.
- `hitDice` (Object): Gestão de Dados de Vida (ex: `{ total: "1d8", current: 1 }`).
- `deathSaves` (Object): Testes contra Morte (ex: `{ successes: 0, failures: 0 }`).

## 3. Core Attributes & Skills (Estatísticas Base)
- `attributes` (Record<AttributeKey, number>): Valores brutos de STR, DEX, CON, INT, WIS, CHA.
- `savingThrowProficiencies` (Record<AttributeKey, boolean>): Marca em quais Testes de Resistência o personagem é proficiente.
- `skills` (Record<SkillKey, { isProficient: boolean, expertise?: boolean }>): Marca bônus de perícias.
- `passivePerception` (number): Percepção Passiva (geralmente fixo calculado = 10 + WIS mod + prof).

## 4. Spellcasting (A Magia de D&D)
Suporte duplo para conjuração tradicional (Slots) e Homebrew (Pontos de Magia/Mana), permitindo que o usuário alterne livremente na ficha.

- `spellcastingSystem` (string, *novo*): Define qual sistema a ficha usará no momento: `'slots'` ou `'points'`.
- `spellcastingAbility` (AttributeKey): Qual atributo o personagem usa para castar (ex: 'INT' pra Magos, 'CHA' pra Bardos).
- `spellSaveDc` (number): Classe de Dificuldade da Magia (Geralmente `8 + Proficiência + Modificador do Atributo`).
- `spellAttackBonus` (number): Bônus de ataque com magias (`Proficiência + Modificador`).
- `spellSlots` (Object): Capacidade customizável de espaços de magia por Nível (1º ao 9º círculo). O usuário poderá definir o `max` e controlar o `used`.
  ```typescript
  type SpellSlotsList = {
    [level: string]: { // "1", "2", "3"..."9"
      max: number; // Slots totais configurados pelo usuário
      used: number; // Slots já gastos
    }
  }
  ```
- `spellPoints` (Object, *novo*): Implementação do sistema de Mana (Spell Points) Homebrew.
  ```typescript
  type SpellPoints = {
    max: number; // Máximo de mana definido pelo usuário
    current: number; // Mana atual
  }
  // Custo: Cada magia custará uma quantidade de Spell Points igual ao nível da magia conjurada.
  ```
- `spellsKnown` (string[]): Lista de IDs das Magias que o Personagem sabe ou preparou.

## 5. Economy & Inventory (Básico, *Opcional*)
Para que o sistema consiga manter e salvar sessões sem depender de bot Discord:
- `coins` (Object): `{ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }` (Peças de cobre, prata, eletro, ouro, platina).
