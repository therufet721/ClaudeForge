/**
 * Detects repo structure and tech stack so Claude has clear context about the project.
 */
import { existsSync } from "fs";
import { readFile, readdir } from "fs/promises";
import { join, resolve } from "path";

export interface ProjectContext {
  root: string;
  name: string;
  languages: string[];
  frameworks: string[];
  packageManager: string | null;
  runtime: string | null;
  tools: string[];
  structure: string[];
  configs: Record<string, string>;
}

const ROOT = resolve(".");

async function safeReadJson<T>(path: string): Promise<T | null> {
  try {
    if (!existsSync(path)) return null;
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function safeRead(path: string): Promise<string | null> {
  try {
    if (!existsSync(path)) return null;
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

async function listTopLevelDirs(): Promise<string[]> {
  try {
    const entries = await readdir(ROOT, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
  } catch {
    return [];
  }
}

export async function detectProjectContext(): Promise<ProjectContext> {
  const languages: string[] = [];
  const frameworks: string[] = [];
  let packageManager: string | null = null;
  let runtime: string | null = null;
  const tools: string[] = [];
  const structure: string[] = [];
  const configs: Record<string, string> = {};
  let name = "project";

  const dirs = await listTopLevelDirs();
  structure.push(...dirs.sort());

  // Node / JS / TS
  const pkg = await safeReadJson<{ name?: string; type?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    join(ROOT, "package.json")
  );
  if (pkg) {
    languages.push("JavaScript");
    name = pkg.name ?? name;
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const depKeys = Object.keys(deps);

    if (depKeys.some((k) => k === "typescript" || k.startsWith("@types/"))) languages.push("TypeScript");
    if (depKeys.includes("react")) frameworks.push("React");
    if (depKeys.includes("vue") || depKeys.includes("vue3")) frameworks.push("Vue");
    if (depKeys.includes("next")) frameworks.push("Next.js");
    if (depKeys.includes("nuxt") || depKeys.includes("nuxt3")) frameworks.push("Nuxt");
    if (depKeys.includes("svelte") || depKeys.includes("sveltekit")) frameworks.push("Svelte");
    if (depKeys.includes("express") || depKeys.includes("fastify") || depKeys.includes("koa")) frameworks.push("Node.js (backend)");
    if (depKeys.includes("vite")) tools.push("Vite");
    if (depKeys.includes("webpack")) tools.push("Webpack");
    if (depKeys.includes("tailwindcss")) tools.push("Tailwind CSS");
    if (depKeys.includes("jest") || depKeys.includes("vitest")) tools.push("Testing (Jest/Vitest)");
    if (depKeys.includes("eslint")) tools.push("ESLint");
    if (depKeys.includes("prettier")) tools.push("Prettier");

    runtime = "Node.js";
    if (existsSync(join(ROOT, "package-lock.json"))) packageManager = "npm";
    else if (existsSync(join(ROOT, "yarn.lock"))) packageManager = "yarn";
    else if (existsSync(join(ROOT, "pnpm-lock.yaml"))) packageManager = "pnpm";
    else if (existsSync(join(ROOT, "bun.lockb"))) packageManager = "bun";
  }

  // Python
  if (existsSync(join(ROOT, "requirements.txt")) || existsSync(join(ROOT, "pyproject.toml")) || existsSync(join(ROOT, "setup.py"))) {
    if (!languages.includes("Python")) languages.push("Python");
    if (existsSync(join(ROOT, "pyproject.toml"))) tools.push("Poetry/PDM");
    const req = await safeRead(join(ROOT, "requirements.txt"));
    if (req) {
      if (req.includes("django")) frameworks.push("Django");
      if (req.includes("flask")) frameworks.push("Flask");
      if (req.includes("fastapi")) frameworks.push("FastAPI");
    }
  }

  // Rust
  if (existsSync(join(ROOT, "Cargo.toml"))) {
    languages.push("Rust");
    tools.push("Cargo");
  }

  // Go
  if (existsSync(join(ROOT, "go.mod"))) {
    languages.push("Go");
    tools.push("Go modules");
  }

  // Ruby
  if (existsSync(join(ROOT, "Gemfile"))) {
    languages.push("Ruby");
    if (existsSync(join(ROOT, "config.ru"))) frameworks.push("Rails");
  }

  // Docker
  if (existsSync(join(ROOT, "Dockerfile"))) tools.push("Docker");
  if (existsSync(join(ROOT, "docker-compose.yml")) || existsSync(join(ROOT, "compose.yaml"))) tools.push("Docker Compose");

  // Config snippets (truncated for context)
  const tsconfig = await safeRead(join(ROOT, "tsconfig.json"));
  if (tsconfig) configs["tsconfig"] = tsconfig.slice(0, 500);

  const viteConfig =
    (await safeRead(join(ROOT, "vite.config.ts"))) ??
    (await safeRead(join(ROOT, "vite.config.js"))) ??
    (await safeRead(join(ROOT, "vite.config.mjs")));
  if (viteConfig) configs["vite"] = viteConfig.slice(0, 400);

  return {
    root: ROOT,
    name,
    languages: [...new Set(languages)],
    frameworks: [...new Set(frameworks)],
    packageManager,
    runtime,
    tools: [...new Set(tools)],
    structure,
    configs,
  };
}

export function formatProjectContext(ctx: ProjectContext, maxChars = 3000): string {
  const parts: string[] = [];
  parts.push(`## Project: ${ctx.name}`);
  parts.push(`Root: ${ctx.root}`);
  if (ctx.languages.length) parts.push(`Languages: ${ctx.languages.join(", ")}`);
  if (ctx.frameworks.length) parts.push(`Frameworks: ${ctx.frameworks.join(", ")}`);
  if (ctx.packageManager) parts.push(`Package manager: ${ctx.packageManager}`);
  if (ctx.runtime) parts.push(`Runtime: ${ctx.runtime}`);
  if (ctx.tools.length) parts.push(`Tools: ${ctx.tools.join(", ")}`);
  parts.push(`Top-level dirs: ${ctx.structure.join(", ") || "(none)"}`);
  if (Object.keys(ctx.configs).length) {
    parts.push("");
    parts.push("Relevant config snippets:");
    for (const [k, v] of Object.entries(ctx.configs)) {
      parts.push(`\n### ${k}\n\`\`\`\n${v}\n\`\`\``);
    }
  }
  let out = parts.join("\n");
  if (out.length > maxChars) out = out.slice(0, maxChars) + "\n[...truncated]";
  return out;
}
