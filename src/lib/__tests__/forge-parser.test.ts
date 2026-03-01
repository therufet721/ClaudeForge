import { describe, it } from "node:test";
import assert from "node:assert";
import { parseForgeResponse } from "../forge-parser.js";

describe("parseForgeResponse", () => {
  it("parses response with agents", () => {
    const json = JSON.stringify({
      agents: [{ name: "a", persona: "p", model: "sonnet", inputContract: "i", outputContract: "o" }],
      skills: [],
      workflow: { name: "W", description: "" },
      commands: [],
      hooks: [],
    });
    const result = parseForgeResponse(json);
    assert.strictEqual(result.agents.length, 1);
    assert.strictEqual(result.agents[0]!.name, "a");
  });

  it("strips markdown code fences", () => {
    const inner = JSON.stringify({
      agents: [{ name: "x", persona: "p", model: "sonnet", inputContract: "i", outputContract: "o" }],
      skills: [],
      workflow: {},
      commands: [],
      hooks: [],
    });
    const result = parseForgeResponse("```\n" + inner + "\n```");
    assert.strictEqual(result.agents[0]!.name, "x");
  });

  it("throws when no agents key", () => {
    assert.throws(() => parseForgeResponse('{"skills":[]}'), /valid JSON/);
  });
});
