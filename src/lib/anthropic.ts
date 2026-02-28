import Anthropic from "@anthropic-ai/sdk";
import { getEffectiveApiKey } from "./config.js";

const TIMEOUT_MS = 120_000; // 2 minutes per call
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1_000;

/** Invalidate the cached client (call after changing the API key). */
export function resetAnthropicClient(): void {
  _client = null;
}

let _client: Anthropic | null = null;
let _clientKey: string | null = null;

export async function getAnthropicClient(): Promise<Anthropic> {
  const apiKey = await getEffectiveApiKey();
  if (!apiKey) {
    throw new Error(
      "Not authenticated. Run 'claudeforge auth' to add your API key."
    );
  }
  // Recreate client if the key changed (e.g. after claudeforge auth mid-session)
  if (!_client || _clientKey !== apiKey) {
    _client = new Anthropic({ apiKey });
    _clientKey = apiKey;
  }
  return _client;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Anthropic.RateLimitError) return true;
  if (err instanceof Anthropic.InternalServerError) return true;
  if (err instanceof Anthropic.APIConnectionError) return true;
  if (err instanceof Anthropic.APIConnectionTimeoutError) return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const client = await getAnthropicClient();
  const model = options.model ?? "claude-sonnet-4-6";

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await client.messages.create(
        {
          model,
          max_tokens: options.maxTokens ?? 8192,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        },
        { signal: controller.signal }
      );

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text in Claude response");
      }
      return textBlock.text;
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES - 1) throw err;
      const delay = RETRY_BASE_MS * 2 ** attempt;
      await sleep(delay);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}
