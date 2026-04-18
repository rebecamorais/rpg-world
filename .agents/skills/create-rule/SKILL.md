---
name: create-rule
description: Define Antigravity behavior, coding standards, or project conventions in `.agent/rules/`. Use when the user asks to "always follow X" or "for files Y, do Z".
---

# Creating Rules

Rules provide persistent context to the agent. They live in `.agent/rules/`.

## Workflow

1. **Identify Need**: Coding standards, file-specific conventions, or universal behavior.
2. **Define Scope**:
   - **Global**: `alwaysApply: true`
   - **Filtered**: `globs: "**/*.ts"` (use JS-style regex for complex patterns)
3. **Internalize Requirements**: Infer scope and purpose from conversation before asking.

## Metadata Fields

| Field         | Type    | Description                           |
| :------------ | :------ | :------------------------------------ |
| `description` | string  | Role of the rule in the picker.       |
| `globs`       | string  | Applied when matching files are open. |
| `alwaysApply` | boolean | If true, active in every session.     |

## Content Standards

- **Concise**: Keep under 50 lines.
- **Atomic**: One concern per rule.
- **Actionable**: Clear instructions with "Good/Bad" code examples.

## Example: TypeScript Standards

```markdown
---
description: TS error handling
globs: **/*.ts
---

# Error Handling

- Use structured logging with `logger.error`.
- Always wrap async calls in try/catch.
```

## Checklist

- [ ] Stored in `.agent/rules/` as `.md`.
- [ ] Valid YAML frontmatter.
- [ ] Concise, focused content.
- [ ] Actionable examples included.
