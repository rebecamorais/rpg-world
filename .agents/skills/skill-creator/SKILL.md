---
name: skill-creator
description: Create or organize Agent Skills in `.agent/skills/`. Use when the user wants new functionality, automation, or specialized reviewers (RPG or general).
---

# Skill Creator

Authoring tool for modular, documented Agent Skills.

## Workflow

1. **Discovery**: Identify Name (lowercase-hyphen), Purpose, RPG System (if any), and Input/Output formats.
2. **Structure**:
   - `SKILL.md` (Required)
   - `scripts/` (Optional - automation)
   - `references/` (Optional - lore/detailed docs)
3. **Implementation**:
   - Write YAML frontmatter (Description is key!).
   - Keep instructions clear and imperative.
   - Use **Progressive Disclosure**: Detailed guidelines in [references/guidelines.md](references/guidelines.md).

## Storage Locations

| Type    | Path                                       |
| :------ | :----------------------------------------- |
| Project | `.agent/skills/skill-name/`                |
| Global  | `~/.gemini/antigravity/skills/skill-name/` |

## Templates

- **Lore Reviewer**: For RPG campaign lore. See [references/lore-reviewer-template.md](references/lore-reviewer-template.md).
- **Automation**: Focus on system tools (JSON to Markdown, etc.).

## Principles

- **Explain the "Why"**: Rationale improves generalization.
- **Atomic Scripts**: Avoid reinventing the wheel; use `scripts/` for common tasks.
- **Reference Depth**: Keep links one level deep from `SKILL.md`.

## Checklist

- [ ] Description is third-person and specific.
- [ ] `SKILL.md` body is < 500 lines.
- [ ] Consistent terminology.
- [ ] Valid YAML frontmatter.
- [ ] Verified file paths.
