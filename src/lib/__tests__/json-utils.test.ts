import { describe, it } from "node:test";
import assert from "node:assert";
import { extractJson } from "../json-utils.js";

describe("extractJson", () => {
  it("extracts plain JSON object", () => {
    const text = '{"foo": "bar", "n": 42}';
    assert.strictEqual(extractJson(text), text);
  });

  it("extracts JSON from markdown code fence", () => {
    const json = '{"agents": []}';
    const text = "```json\n" + json + "\n```";
    assert.strictEqual(extractJson(text), json);
  });

  it("extracts first JSON when multiple exist", () => {
    const first = '{"a": 1}';
    const text = first + ' {"b": 2}';
    assert.strictEqual(extractJson(text), first);
  });

  it("skips braces inside strings", () => {
    const json = '{"msg": "hello { world }"}';
    assert.strictEqual(extractJson(json), json);
  });

  it("skips braces inside single-quoted strings", () => {
    const json = "{'agents': [], 'nested': {'x': 'a { b } c'}}";
    assert.strictEqual(extractJson(json), json);
  });

  it("throws when no JSON found", () => {
    assert.throws(() => extractJson("no json here"), /No JSON/);
  });

  it("throws when unbalanced", () => {
    assert.throws(() => extractJson('{"unbalanced'), /Unbalanced/);
  });
});
