import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { familyBlockOf, familyReadmeBlock } from "./family-readme.mjs";
import { FAMILY, FAMILY_GROUPS, FAMILY_TEMPLATE_VERSION, familyFooter } from "./family-template.mjs";
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
describe("the shared family list", () => {
  it("pins the shared template and README writer", () => {
    expect(FAMILY_TEMPLATE_VERSION).toBe("2026-10-09-embed-builder");
    expect(sha("scripts/family-template.mjs")).toBe("d7cd8c1cf8c1e4a919b074fdc43574fc8e9f1f39c285d10a11d7d75a98852f67");
    expect(sha("scripts/family-readme.mjs")).toBe("f0bb3adff1a917f672c1b6a323e7ee068bd8b43294cdfb55f31c90112971bcf1");
  });
  it("lists every member once, grouped and alphabetical", () => {
    expect(FAMILY).toHaveLength(28);
    expect(FAMILY_GROUPS.flatMap((group) => group.members)).toEqual(FAMILY.map((one) => one.id));
    expect(new Set(FAMILY.map((one) => one.id)).size).toBe(FAMILY.length);
    for (const group of FAMILY_GROUPS) expect(group.members).toEqual([...group.members].sort());
    expect(familyFooter({ id: "address-plus" })).toContain('href="https://spxis.github.io/rest-in-pieces/"');
    expect(familyFooter({ id: "address-plus" }).match(/aria-current="page"/g)).toHaveLength(1);
  });
  it("keeps the README list generated from the shared template", () => {
    expect(familyBlockOf(readFileSync("README.md", "utf8"))).toBe(familyReadmeBlock("address-plus"));
  });
});
