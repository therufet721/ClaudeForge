import { describe, it } from "node:test";
import assert from "node:assert";
import { sanitizeName } from "../forge-writer.js";

describe("sanitizeName", () => {
  it("keeps valid kebab-case", () => {
    assert.strictEqual(sanitizeName("my-agent"), "my-agent");
  });

  it("replaces unsafe chars with hyphen", () => {
    assert.strictEqual(sanitizeName("foo bar"), "foo-bar");
    assert.strictEqual(sanitizeName("foo/bar"), "foo-bar");
  });

  it("collapses consecutive dots", () => {
    assert.strictEqual(sanitizeName("foo..bar"), "foo.bar");
  });

  it("strips leading dots and hyphens", () => {
    assert.strictEqual(sanitizeName(".hidden"), "hidden");
    assert.strictEqual(sanitizeName("-leading"), "leading");
  });

  it("caps length at 100", () => {
    const long = "a".repeat(150);
    assert.strictEqual(sanitizeName(long).length, 100);
  });

  it("throws when result is empty", () => {
    assert.throws(() => sanitizeName("..."), /Unsafe or empty/);
  });

  it("throws when result is only hyphens", () => {
    assert.throws(() => sanitizeName("---"), /Unsafe or empty/);
  });

  it("throws when input is empty after trim", () => {
    assert.throws(() => sanitizeName("   "), /Unsafe or empty/);
  });
});
