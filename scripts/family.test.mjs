import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { familyBlockOf, familyReadmeBlock } from "./family-readme.mjs";
import { FAMILY, FAMILY_GROUPS, FAMILY_TEMPLATE_VERSION, familyFooter } from "./family-template.mjs";
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
describe("the shared family list", () => {
  it("pins the shared template and README writer", () => {
    expect(FAMILY_TEMPLATE_VERSION).toBe("2026-11-11");
    expect(sha("scripts/family-template.mjs")).toBe("3683ae7db0afb26ce3bfe2a48eec421d999c06eadef8f4148c0de96292094edc");
    expect(sha("scripts/family-readme.mjs")).toBe("dfd4c27b70fe5d7d5f82724180cc739812f0dd13d209c41c053dbdc61bf90188");
  });
  it("lists every member once, grouped and alphabetical", () => {
    expect(FAMILY).toHaveLength(41);
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
