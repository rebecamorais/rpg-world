<!-- refs: 08_how_the_agent_uses_skills.md | 10_example_code_review_skill.md -->

# Best practices

## Best practices

### Keep skills focused

Each skill should do one thing well. If a skill becomes too complex, consider breaking it into multiple smaller skills.

### Write clear descriptions

The `description` in the frontmatter is what the agent uses to decide whether to use a skill. Make it as specific as possible about the scenarios where the skill is applicable.

### Use scripts as black boxes

If your skill includes scripts, encourage the agent to run them with `--help` first rather than reading the entire source code. This keeps the agent's context focused on the task.

### Include decision trees

For complex skills, add a section that helps the agent choose the right approach based on the situation.

---

## 🔗 Ver também

- [08_how_the_agent_uses_skills.md](08_how_the_agent_uses_skills.md)
- [10_example_code_review_skill.md](10_example_code_review_skill.md)
