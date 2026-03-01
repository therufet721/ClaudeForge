import pc from "picocolors";

const BUILTIN_TEMPLATES = [
  { name: "pr-review-pipeline", desc: "Review PRs with security, coverage, and summary agents" },
  { name: "tdd-workflow", desc: "Write tests → implement → verify cycle" },
  { name: "deploy-pipeline", desc: "Test → build → stage → approve → promote" },
  { name: "incident-response", desc: "Detect → triage → fix → postmortem" },
  { name: "docs-generator", desc: "Read codebase → generate docs → update README" },
  { name: "code-migration", desc: "Analyze → plan → migrate → validate" },
  { name: "security-audit", desc: "Full OWASP scan across entire codebase" },
];

export async function templateCommand(
  action: string | undefined,
  name: string | undefined
) {
  const act = action ?? "list";

  if (act === "list") {
    console.log(pc.bold("\nAvailable templates\n"));
    for (const t of BUILTIN_TEMPLATES) {
      console.log(`  ${pc.cyan(t.name.padEnd(22))} ${t.desc}`);
    }
    console.log("\nInstall: " + pc.cyan("claudesmith template use <name>") + "\n");
    return;
  }

  if (act === "use" && name) {
    const template = BUILTIN_TEMPLATES.find((t) => t.name === name);
    const desc = template?.desc ?? name;
    if (template) {
      const { forgeCommand } = await import("./forge.js");
      console.log(pc.cyan(`\nInstalling template: ${name}\n`));
      await forgeCommand(desc, { output: "./.claude" });
    } else {
      console.log(pc.yellow(`\nUnknown template: ${name}`));
      console.log("Available: " + BUILTIN_TEMPLATES.map((t) => t.name).join(", "));
      console.log("Use: " + pc.cyan("claudesmith template use <name>") + "\n");
    }
    return;
  }

  if (act === "use" && !name) {
    console.log(pc.red("Error:") + " Specify a template name. Example: " + pc.cyan("claudesmith template use pr-review-pipeline") + "\n");
    return;
  }

  if (act === "publish") {
    console.log(pc.yellow("\nTemplate publishing coming soon.\n"));
    return;
  }

  console.log("Usage: claudesmith template [list|use|publish] [name]");
}
