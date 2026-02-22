# Reference: Regras de Sistemas de RPG

O RPG World implementa regras originais dos livros básicos dos sistemas para realizar cálculos matemáticos automáticos na Interface. Este documento espelha os "contratos lógicos" para traduzir o livro de regras para o código.

---

## Dungeons & Dragons 5ª Edição (dnd5e)

### 1. Modificadores de Atributos
A fórmula matemática para converter um atributo absoluto (ex: Força 16) em seu modificador:
```typescript
Modificador = Math.floor((Atributo - 10) / 2)
```

### 2. Bônus de Proficiência (PB / Proficiency Bonus)
Baseado no Nível Geral do Personagem:
| Níveis do Personagem | PB Bônus |
|----------------------|----------|
| 1 a 4                | +2       |
| 5 a 8                | +3       |
| 9 a 12               | +4       |
| 13 a 16              | +5       |
| 17 a 20              | +6       |

*Cálculo:* `PB = Math.ceil(level / 4) + 1`

### 3. Classe de Armadura (CA) Base
Se nenhuma armadura estiver equipada (e classes sem *Unarmored Defense*):
```typescript
CA = 10 + Modificador(Destreza)
```

### 4. Percepção Passiva
Calculada como um limiar mental automático (sem dados rodados):
```typescript
Passivo = 10 + Modificador(Sabedoria) + (Se proficiente ? PB : 0)
```

### 5. Distribuição de Perícias Clássicas
As perícias do sistema são intimamente interligadas ao seu Atributo regente:
- **Força (STR):** Atletismo
- **Destreza (DEX):** Acrobacia, Furtividade, Prestidigitação
- **Inteligência (INT):** Arcanismo, História, Investigação, Natureza, Religião
- **Sabedoria (WIS):** Adestrar Animais, Intuição, Medicina, Percepção, Sobrevivência
- **Carisma (CHA):** Atuação, Enganação, Intimidação, Persuasão

Cálculo de Rolagem Final da Perícia na ficha:
`Final = Modificador do Atributo + (Proficiente ? PB : 0) + (Expertise ? PB : 0)`

---

*Nota Arquitetural: Se formos adicionar Homebrews ou variantes, criar ramificações dessas fórmulas com flags separadas.*
