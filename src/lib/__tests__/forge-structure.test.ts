import { describe, it } from "node:test";
import assert from "node:assert";
import { parseForgeStructure } from "../forge-structure.js";

describe("parseForgeStructure", () => {
  it("parses minimal valid structure", () => {
    const json = '{"agents":[],"skills":[],"commands":[],"hooks":[],"workflow":{"name":"W","description":"","sequentialOrder":[]}}';
    const result = parseForgeStructure(json);
    assert.deepStrictEqual(result.agents, []);
    assert.deepStrictEqual(result.skills, []);
    assert.strictEqual(result.workflow.name, "W");
  });

  it("parses structure with agents", () => {
    const json = JSON.stringify({
      agents: [{ name: "test-agent", model: "sonnet", roleSummary: "Test", description: "Use when testing" }],
      skills: [],
      commands: [],
      hooks: [],
      workflow: { name: "W", description: "", sequentialOrder: ["test-agent"] },
    });
    const result = parseForgeStructure(json);
    assert.strictEqual(result.agents.length, 1);
    assert.strictEqual(result.agents[0]!.name, "test-agent");
  });

  it("strips markdown code fences", () => {
    const inner = '{"agents":[],"skills":[],"commands":[],"hooks":[],"workflow":{"name":"W","description":"","sequentialOrder":[]}}';
    const result = parseForgeStructure("```json\n" + inner + "\n```");
    assert.deepStrictEqual(result.workflow.name, "W");
  });

  it("provides defaults for missing fields", () => {
    const result = parseForgeStructure('{"agents":[]}');
    assert.deepStrictEqual(result.skills, []);
    assert.strictEqual(result.workflow.name, "Workflow");
  });

  it("throws on invalid JSON", () => {
    assert.throws(
      () => parseForgeStructure("not json"),
      (err: Error) => /Failed to parse|No JSON/.test(err.message)
    );
  });
});
