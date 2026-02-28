import { readFile, writeFile, mkdir, chmod } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

export interface ClaudeforgeConfig {
  auth?: {
    apiKey?: string;
  };
  defaults?: {
    model: string;
  };
  registry?: {
    url: string;
    publish_public: boolean;
  };
}

const DEFAULT_CONFIG: ClaudeforgeConfig = {
  defaults: {
    model: "claude-sonnet-4-6",
  },
  registry: {
    url: "https://registry.claudeforge.dev",
    publish_public: false,
  },
};

function getConfigDir(): string {
  const home = homedir();
  return join(home, ".claudeforge");
}

function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

export async function loadConfig(): Promise<ClaudeforgeConfig> {
  try {
    const path = getConfigPath();
    const data = await readFile(path, "utf-8");
    const parsed = JSON.parse(data) as ClaudeforgeConfig;
    // Deep merge so a partial stored config (e.g. only "model") doesn't wipe nested defaults.
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      defaults: { ...DEFAULT_CONFIG.defaults!, ...parsed.defaults },
      registry: { ...DEFAULT_CONFIG.registry!, ...parsed.registry },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: ClaudeforgeConfig): Promise<void> {
  const dir = getConfigDir();
  await mkdir(dir, { recursive: true });
  // Restrict directory to owner only — prevents other users listing the config dir
  await chmod(dir, 0o700);
  const path = getConfigPath();
  await writeFile(path, JSON.stringify(config, null, 2), "utf-8");
  // Restrict to owner read/write only — protects the stored API key
  await chmod(path, 0o600);
}

export function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

export async function getStoredApiKey(): Promise<string | undefined> {
  const config = await loadConfig();
  return config.auth?.apiKey;
}

export async function setApiKey(apiKey: string): Promise<void> {
  const config = await loadConfig();
  config.auth = {
    apiKey,
  };
  await saveConfig(config);
}

export async function clearAuth(): Promise<void> {
  const config = await loadConfig();
  delete config.auth;
  await saveConfig(config);
}

export async function isAuthenticated(): Promise<boolean> {
  const envKey = getApiKey();
  if (envKey) return true;

  const storedKey = await getStoredApiKey();
  return !!storedKey;
}

export async function getEffectiveApiKey(): Promise<string | undefined> {
  return getApiKey() ?? (await getStoredApiKey());
}
