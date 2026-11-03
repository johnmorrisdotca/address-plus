import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { familyBlockOf, familyReadmeBlock } from "./family-readme.mjs";
import { FAMILY, FAMILY_GROUPS, FAMILY_TEMPLATE_VERSION, familyFooter } from "./family-template.mjs";
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
describe("the shared family list", () => {
  it("pins the shared template and README writer", () => {
    expect(FAMILY_TEMPLATE_VERSION).toBe("2026-11-02b");
    expect(sha("scripts/family-template.mjs")).toBe("ba62baad076a3d2821c793fa2bf73184ea9b5d1b40721b0987b7cc459a27960d");
    expect(sha("scripts/family-readme.mjs")).toBe("ea87c4b45eaaa14cbd40eb40d9eccb38dbe7d45855f9eb0f1c75a4e3b0596306");
  });
  it("lists every member once, grouped and alphabetical", () => {
    expect(FAMILY).toHaveLength(33);
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
