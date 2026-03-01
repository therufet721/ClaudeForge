/**
 * Extract a balanced JSON object from text, correctly skipping braces inside strings.
 * Used when parsing Claude responses that may contain markdown or extra text.
 */
export function extractJson(text: string): string {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  if (start < 0) throw new Error("No JSON in response");

  let depth = 0;
  let inString = false;
  let escape = false;
  let quote: string | null = null;

  for (let i = start; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if ((c === '"' || c === "'") && !inString) {
      inString = true;
      quote = c;
      continue;
    }
    if (inString) {
      if (c === quote) inString = false;
      continue;
    }
    if (c === "{") {
      depth++;
      continue;
    }
    if (c === "}") {
      depth--;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  throw new Error("Unbalanced JSON in response");
}
