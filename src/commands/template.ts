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
    console.log("\nInstall: " + pc.cyan("claudeforge template use <name>") + "\n");
    return;
  }

  if (act === "use" && name) {
    console.log(pc.yellow("\nTemplate registry coming soon."));
    console.log("For now, use: " + pc.cyan(`claudeforge forge "${BUILTIN_TEMPLATES.find((t) => t.name === name)?.desc ?? name}"`) + "\n");
    return;
  }

  if (act === "publish") {
    console.log(pc.yellow("\nTemplate publishing coming soon.\n"));
    return;
  }

  console.log("Usage: claudeforge template [list|use|publish] [name]");
}
