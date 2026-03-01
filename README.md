# ClaudeSmith 🔨

> **Generate production-ready `.claude` folders from plain English.** Agents, skills, orchestration — one command.

ClaudeSmith is a CLI that takes a plain-English description of what you want your AI system to do and generates a fully wired `.claude` folder with agents, skills, orchestration logic, templates, hooks, and a `CLAUDE.md` registry. Powered by Claude AI.

## Installation

```bash
npm install -g claudesmith
```

Or run from source:

```bash
cd claudesmith
npm install
npm run build
npm link
```

## Quick Start

1. **Authenticate** with your Anthropic API key:

```bash
claudesmith auth
```

2. **Generate** your agent system:

```bash
claudesmith forge "a PR review system with security, coverage, and summary agents"
```

Or run interactively:

```bash
claudesmith forge
```

3. **Use Claude Code** to run your agents — they delegate based on the `description` field in each agent.

## Commands

| Command | Description |
|---------|-------------|
| `claudesmith auth` | Authenticate with Anthropic (API key) |
| `claudesmith forge [description]` | Generate complete .claude from description |
| `claudesmith add <type> [desc]` | Add agent, skill, command, or hook |
| `claudesmith visualize` | Show orchestration as terminal diagram |
| `claudesmith doctor` | Scan .claude for issues and suggest fixes |
| `claudesmith template list` | Browse built-in templates |
| `claudesmith template use <name>` | Install a template (e.g. pr-review-pipeline) |

## Options

### forge

- `-f, --from <file>` — Read description from file
- `-o, --output <path>` — Target directory (default: ./.claude)
- `--dry-run` — Show what would be generated
- `--model <model>` — Claude model

### add

- `-t, --to <agent>` — Attach skill to this agent

## Environment

- `ANTHROPIC_API_KEY` — Overrides stored API key if set

## License

MIT
