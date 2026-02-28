# ClaudeForge 🔨

> **One command. Complete `.claude` folder. Production-ready AI agent orchestration.**

ClaudeForge is a CLI tool that takes a plain-English description of what you want your AI system to do — and generates a fully wired, ready-to-run `.claude` folder with agents, skills, orchestration logic, templates, hooks, and a `CLAUDE.md` registry. Powered by Claude AI itself.

## Installation

```bash
npm install -g claudeforge
```

Or run from source:

```bash
cd ClaudeForge
npm install
npm run build
npm link
```

## Quick Start

1. **Authenticate** with your Anthropic API key:

```bash
claudeforge auth
```

2. **Generate** your agent system:

```bash
claudeforge forge "a PR review system with security, coverage, and summary agents"
```

Or run interactively:

```bash
claudeforge forge
```

## Commands

| Command | Description |
|---------|-------------|
| `claudeforge auth` | Authenticate with Anthropic (API key) |
| `claudeforge forge [description]` | Generate complete .claude from description |
| `claudeforge add <type> [desc]` | Add agent, skill, command, or hook |
| `claudeforge visualize` | Show orchestration as terminal diagram |
| `claudeforge doctor` | Scan and fix issues in .claude |
| `claudeforge template list` | Browse community templates |
| `claudeforge run [input]` | Test orchestration (v1.1) |

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
