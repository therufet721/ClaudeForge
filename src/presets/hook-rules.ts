/** Preset rules for generating Claude Code hook scripts. */
export const HOOK_RULES = `# Hook Script Rules

You are generating a shell script that a Claude Code hook will execute (.claude/hooks/name.sh). Output ONLY the raw script content. No code fences, no explanations.

## Claude Code Hook Events
Hooks run at these lifecycle points (configured in .claude/settings.json):
- PreToolUse — before a tool executes; non-zero exit BLOCKS the tool call
- PostToolUse — after a tool succeeds
- PostToolUseFailure — after a tool fails
- SessionStart — when a Claude Code session begins
- SessionEnd — when a session ends
- Stop — when Claude finishes responding
- Notification — when Claude sends a notification
- PermissionRequest — when permission is needed for an action

## Required Structure

\`\`\`
#!/usr/bin/env bash
# Hook: [event name] — [one line describing what this hook does]
# Triggered by: Claude Code [EventName] lifecycle event
#
# Exit 0: allow the operation to proceed
# Exit non-zero: block/reject the operation (PreToolUse only)

set -euo pipefail

# Read tool input from stdin (JSON) if needed
# INPUT=$(cat)

# ... script logic ...

echo "Hook completed successfully" >&2
exit 0
\`\`\`

## Rules
- Shebang: \`#!/usr/bin/env bash\` for bash, \`#!/bin/sh\` for POSIX shell.
- Header comment: name the hook event and purpose.
- Use \`set -euo pipefail\` so script exits on first error or unset variable.
- Exit 0 to allow; exit non-zero to block (only PreToolUse can block an operation).
- One hook, one responsibility. No unrelated logic.
- Print errors to stderr: \`echo "Error: ..." >&2\`.
- Tool input is available as JSON on stdin for PreToolUse/PostToolUse hooks.
- Output raw script content only.`;
