// The family's must-have list for a package (spx-stats docs/package-work.md, "The must-have list"; kazoku-ui docs/package-standard.md), as a check that fails when an item is missing.
// scripts/check-standard.mjs is kazoku-ui's templates/check-standard.mjs (kazoku-ui 0.10.0), copied unchanged and held to one recorded hash.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STANDARD_VERSION, standardProblems } from "../scripts/check-standard.mjs";

const RECORDED = { version: "2026-11-02", sha256: "86924cfad66b2ef036f531a1eec35d23c90c6bffa059163ea82437a4e0b0d9e3" };

describe("the family's must-have list", () => {
  it("is kazoku-ui's check, byte for byte", () => {
    expect(STANDARD_VERSION).toBe(RECORDED.version);
    expect(createHash("sha256").update(readFileSync("scripts/check-standard.mjs")).digest("hex")).toBe(RECORDED.sha256);
  });

  it("has every item of the list for this package", () => {
    expect(standardProblems(".")).toEqual([]);
  });
});
