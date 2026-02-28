import prompts from "prompts";
import pc from "picocolors";
import { setApiKey, loadConfig } from "../lib/config.js";
import { resetAnthropicClient } from "../lib/anthropic.js";

export async function authCommand(options: { status?: boolean }) {
  if (options.status) {
    const config = await loadConfig();
    const envKey = process.env.ANTHROPIC_API_KEY;
    const storedKey = config.auth?.apiKey;

    console.log(pc.bold("\nClaudeForge Auth Status\n"));
    if (envKey) {
      console.log(pc.green("✓") + " ANTHROPIC_API_KEY (env) — active");
    }
    if (storedKey) {
      const masked = storedKey.slice(0, 12) + "..." + storedKey.slice(-4);
      console.log(pc.green("✓") + " Stored API key — " + masked);
    }
    if (!envKey && !storedKey) {
      console.log(pc.red("✗") + " Not authenticated");
      console.log("\nRun " + pc.cyan("claudeforge auth") + " to add your API key.");
    }
    console.log();
    return;
  }

  console.log(pc.bold("\nClaudeForge Authentication\n"));
  console.log("Get your API key from: " + pc.cyan("https://console.anthropic.com/account/keys"));
  const { apiKey } = await prompts({
    type: "password",
    name: "apiKey",
    message: "Paste your API key:",
    validate: (v: unknown) =>
      typeof v === "string" && v.startsWith("sk-ant-") ? true : "Key must start with sk-ant-",
  });

  if (!apiKey || typeof apiKey !== "string") return;

  await setApiKey(apiKey);
  resetAnthropicClient(); // force new client with the new key this session
  console.log(pc.green("\n✓") + " API key stored in ~/.claudeforge/config.json");
  console.log(pc.gray("  (ANTHROPIC_API_KEY env var overrides this)\n"));
}
