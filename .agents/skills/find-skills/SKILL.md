---
name: find-skills
description: Discover and install agent skills via `npx skills`. Use when the user asks "how do I do X" or "find a skill for Y".
---

# Finding Skills

Use the Skills CLI (`npx skills`) to extend agent capabilities with modular packages.

## Skills CLI Commands

| Command                   | Action                                                        |
| :------------------------ | :------------------------------------------------------------ |
| `npx skills find [query]` | Search for skills by keyword.                                 |
| `npx skills add <pkg>`    | Install (e.g., `npx skills add anthropics/skills@pdf-utils`). |
| `npx skills check`        | Check for updates.                                            |
| `npx skills update`       | Update all installed skills.                                  |

## Recommended Workflow

1. **Search**: Run `npx skills find [query]` or browse [skills.sh](https://skills.sh/).
2. **Evaluate**:
   - **Installs**: Prefer >1k installs.
   - **Source**: Trusted authors (vercel-labs, anthropics, microsoft).
   - **Stars**: Check GitHub reputation.
3. **Install**: Use `npx skills add <owner/repo@skill> -g -y` for global install.

## Common Categories

- **Web**: react, tailwind, nextjs
- **Testing**: jest, playwright
- **Quality**: code-review, lint
- **Design**: ui, ux, theme
- **Productivity**: git, workflow

## Tips

- Be specific: "react testing" > "testing".
- If no skill found, offer to assist directly or create a new skill with `skill-creator`.
