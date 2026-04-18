# Skill Authoring Guidelines

Detailed standards for creating high-performance Agent Skills.

## Core Principles

### 1. Concise is Key

Every token competes for space. Assume the agent is smart.

- Avoid: "It is important to note that..."
- Use: "Note: ..."

### 2. Under 500 Lines

Keep `SKILL.md` under 500 lines. Move details here.

### 3. Progressive Disclosure

Put essential info in `SKILL.md`; detailed reference material here or in other files.

### 4. Appropriate Degrees of Freedom

- **High**: Code review guidelines.
- **Medium**: Report templates.
- **Low**: Critical utility scripts.

## Effective Descriptions

Discovery depends on the description.

- **Third Person**: "Processes Excel files..." (not "I help with...")
- **Specific**: Include trigger terms (e.g., ".xlsx", "charts").
- **What & When**: Define capability and trigger scenarios.

## Common Patterns

### Template Pattern

Provide output format templates to ensure consistency.

### Examples Pattern

Concrete examples help quality. Input/Output pairs work best.

### Workflow Pattern

Break complex tasks into checklists and steps.

## Anti-Patterns to Avoid

| Anti-Pattern      | Solution                            |
| :---------------- | :---------------------------------- |
| Decorative Emojis | Use only for status/meaning.        |
| Echo Headers      | Subheaders should add unique value. |
| filler Words      | "In order to" -> "To".              |
| Repeated Intros   | Get straight to the point.          |

## Detection Checklist

- [ ] > 3 decorative emojis.
- [ ] "This section covers..." phrases.
- [ ] Code blocks >10 lines in main `SKILL.md`.
- [ ] Same command repeated 3+ times.
