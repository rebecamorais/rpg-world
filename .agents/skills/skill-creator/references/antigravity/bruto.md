Title: Google Antigravity
Source: https://antigravity.google/docs/skills

---

# Agent Skills

Skills are reusable capabilities that you can give to the agent to extend its functionality. This guide explains how to create, manage, and use skills.

## What are skills?

Skills are encapsulated units of logic and instructions that the agent can discover and execute to perform specific tasks. Skills can be:

- **Workspace Skills**: Located within a specific project's `.agent/skills` directory.
- **Global Skills**: Shared across all projects and environments.

## Where skills live

The agent looks for skills in the `.agent/skills` directory at the root of your project. Each skill is its own subdirectory within this folder.

```text
.agent/
└── skills/
    ├── my-first-skill/
    │   ├── SKILL.md
    │   └── script.py
    └── other-skill/
        └── SKILL.md
```

## Creating a skill

To create a new skill, follow these steps:

1. Create a new directory in `.agent/skills/`.
2. Create a `SKILL.md` file in that directory.
3. (Optional) Add any supporting scripts or files.

### The SKILL.md file

The `SKILL.md` file is the heart of a skill. It contains the instructions for the agent on how and when to use the skill. It must start with a YAML frontmatter block.

```markdown
---
name: my-first-skill
description: A brief description of what this skill does.
---

# My First Skill

Detailed instructions for the agent on how to use this skill go here.
```

### Frontmatter fields

- **name**: A unique, URL-friendly name for the skill (required).
- **description**: A clear, concise description of when the agent should use this skill (required).

## Skill folder structure

While `SKILL.md` is required, you can include any other files the skill needs:

- **Scripts**: Python, Shell, or other scripts the agent can run.
- **Templates**: Configuration files or templates the skill uses.
- **Documentation**: Additional guides or references.

## How the agent uses skills

1. **Discovery**: When the agent encounters a task, it searches for relevant skills based on their descriptions.
2. **Selection**: The agent selects the best-fitting skill for the current situation.
3. **Execution**: The agent follows the instructions in `SKILL.md` and runs any necessary scripts.
4. **Learning**: The agent can adapt its use of skills based on project context.

## Best practices

### Keep skills focused

Each skill should do one thing well. If a skill becomes too complex, consider breaking it into multiple smaller skills.

### Write clear descriptions

The `description` in the frontmatter is what the agent uses to decide whether to use a skill. Make it as specific as possible about the scenarios where the skill is applicable.

### Use scripts as black boxes

If your skill includes scripts, encourage the agent to run them with `--help` first rather than reading the entire source code. This keeps the agent's context focused on the task.

### Include decision trees

For complex skills, add a section that helps the agent choose the right approach based on the situation.

## Example: A code review skill

Here's a simple skill that helps the agent review code:

```markdown
---
name: code-review
description: Reviews code changes for bugs, style issues, and best practices. Use when reviewing PRs or checking code quality.
---

# Code Review Skill

When reviewing code, follow these steps:

## Review checklist

1. **Correctness**: Does the code do what it's supposed to?
2. **Edge cases**: Are error conditions handled?
3. **Style**: Does it follow project conventions?
4. **Performance**: Are there obvious inefficiencies?

## How to provide feedback

- Be specific about what needs to change
- Explain why, not just what
- Suggest alternatives when possible
```
