---
name: create-subagent
description: Create specialized AI subagents (squads) in `.agent/subagents/`. Use for custom task-focused agents like code reviewers, debuggers, or lore experts.
---

# Creating Subagents

Subagents are AI specialists with custom system prompts for focused tasks.

## Storage Locations

| Scope   | Path                               |
| :------ | :--------------------------------- |
| Project | `.agent/subagents/`                |
| Global  | `~/.gemini/antigravity/subagents/` |

## File Format

Create a `.md` file with YAML frontmatter:

```markdown
---
name: code-reviewer
description: Reviews code for quality and security. Use after writing/modifying code.
---

You are a senior code reviewer... (System Prompt follows)
```

## Workflow

1. **Scope Selection**: Project-level for codebase-specific tools; User-level for general utility.
2. **Configuration**:
   - `name`: Lowercase and hyphens only.
   - `description`: CLEAR trigger criteria (AI uses this to delegate).
3. **Execution**: The body of the file becomes the **System Prompt**.

## Best Practices

- **Focus**: One subagent per specific responsibility.
- **Proactive**: Include "Use proactively..." in descriptions.
- **Concise Prompting**: Define clear checklists and output formats in the body.

## Troubleshooting

- Verify `.md` extension.
- Ensure valid YAML frontmatter.
- Check paths match Antigravity standards.
