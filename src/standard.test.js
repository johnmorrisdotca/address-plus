// The family's must-have list for a package (spx-stats docs/package-work.md, "The must-have list"; kazoku-ui docs/package-standard.md), as a check that fails when an item is missing.
// scripts/check-standard.mjs is kazoku-ui's templates/check-standard.mjs (kazoku-ui 0.10.0), copied unchanged and held to one recorded hash.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STANDARD_VERSION, standardProblems } from "../scripts/check-standard.mjs";

const RECORDED = { version: "2026-11-11b", sha256: "ecf0627e155de2b2c148e89d0722cac3b55f7d4a76e1fbfe1b52a008e50896bb" };

describe("the family's must-have list", () => {
  it("is kazoku-ui's check, byte for byte", () => {
    expect(STANDARD_VERSION).toBe(RECORDED.version);
    expect(createHash("sha256").update(readFileSync("scripts/check-standard.mjs")).digest("hex")).toBe(RECORDED.sha256);
  });

  it("has every item of the list for this package", () => {
    expect(standardProblems(".")).toEqual([]);
  });
});
