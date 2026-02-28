/** Preset rules for generating skill script files. */
export const SCRIPT_RULES = `# Skill Script Rules

You are generating a script file for a skill (e.g. Python, Node, shell). Output ONLY the raw script content. No code fences, no explanations.

## Required Structure

\`\`\`
# Python example:
\"\"\"
Purpose: [what it does]
Input: [args, stdin, or file paths]
Output: [format: JSON, markdown, etc.]
\"\"\"
import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="...")
    parser.add_argument("paths", nargs="*", help="...")
    args = parser.parse_args()
    # ... logic with try/except, clear error messages ...
    # Output to stdout in specified format

if __name__ == "__main__":
    sys.exit(main() or 0)
\`\`\`

## Rules
- Docstring/header: purpose, input format, output format.
- Use argparse (Python) or clear CLI args. No magic numbers or hardcoded paths.
- Error handling: try/except, exit non-zero on failure, print errors to stderr.
- Output: clear, parseable format (JSON, markdown, or structured text).
- 30+ lines for substantial scripts. Production-quality.
- Output raw script content only.`;
