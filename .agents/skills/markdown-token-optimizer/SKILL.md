---
name: markdown-token-optimizer
description: Analyzes markdown files for token efficiency in Antigravity. Use when files are too large, verbose, or token heavy.
---

# Token Optimizer

Analyzes markdown to reduce token consumption without losing clarity.

## Workflow

1. **Count**: Calculate tokens (~4 chars = 1 token).
2. **Scan**: Identify emojis, verbosity, duplication, and large blocks.
3. **Suggest**: Provide a table with location, issue, fix, and savings.
4. **Summarize**: Report current/potential totals and top recommendations.

## Guidelines

- **Suggest Only**: No automatic modifications.
- **Clarity First**: Never sacrifice meaning for size.
- **Targets**: `SKILL.md` < 500 tokens; `references/` < 1000 tokens.

## References

- [Optimization Techniques](references/OPTIMIZATION-PATTERNS.md)
- [Antipatterns/Bloat](references/ANTI-PATTERNS.md)
