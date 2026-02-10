# Agent Rules Directory

This directory contains conditional, service-specific rules that supplement the main [AGENTS.md](../AGENTS.md) file.

## Structure

```
.agents/
├── README.md                 # This file
└── rules/
    ├── cursor-specific.mdc   # Tool-specific guidance for Cursor
    └── dashboard/            # Dashboard (apps/dashboard) specific rules
        └── design.mdc        # Design system tokens, components, a11y
```

## How Rules Are Loaded

### Cursor

- Symlinked via `.cursor/rules/` → `.agents/rules/`
- Cursor loads all `.mdc` files based on glob patterns

### Claude Code

- Symlinked via `.claude/rules/` → `.agents/rules/`
- Claude Code loads rules contextually

## Adding New Rules

### When to add a rule here vs AGENTS.md

| Belongs in AGENTS.md     | Belongs in `.agents/rules/`  |
| ------------------------ | ---------------------------- |
| ✅ Architecture overview | ✅ Detailed design tokens    |
| ✅ Commands & workflows  | ✅ Component import maps     |
| ✅ File conventions      | ✅ Service-specific patterns |
| ✅ Core code style       | ✅ Tool-specific hints       |
| ✅ Git workflow          | ✅ Glob-conditional guidance |

### Creating a new service-specific rule

1. Create directory: `.agents/rules/<service-name>/`
2. Add `.mdc` files with frontmatter:

```markdown
---
description: Brief description
globs:
  - "apps/<service>/**/*.{ts,tsx}"
alwaysApply: false
---

# Your rule content here
```

3. Symlink for both tools (if needed):

```bash
ln -sf ../../../.agents/rules/<service> .cursor/rules/<service>
ln -sf ../../../.agents/rules/<service> .claude/rules/<service>
```

## Current Rules

### cursor-specific.mdc

- **Applies**: Always
- **Purpose**: Tool-specific hints for Cursor (e.g., when to use sequential thinking MCP)

### dashboard/design.mdc

- **Applies**: When editing `apps/dashboard/**/*.{ts,tsx,mdx}`
- **Purpose**: Design system tokens, component patterns, accessibility requirements
- **Why separate**: 200+ lines of detailed reference that would bloat AGENTS.md
