import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * kazoku-ui's check-standard (item embed-panel) asks that a demo page hold <kazoku-embed-panel>; this holds the
 * builder's own: the panel is its code section, defined by its script and bundled by the site's build.
 */
describe("the embed panel", () => {
  it("is the builder's code section, defined by the builder's script", () => {
    const page = readFileSync("demo/builder.html", "utf8");
    expect(page).toMatch(/<kazoku-embed-panel\b[^>]*id="bld-embed"/);
    expect(page).not.toMatch(/id="bld-(code|formats|copy)"/);
    expect(readFileSync("demo/builder.js", "utf8")).toContain('import "./kazoku-embed-panel.js";');
    expect(readFileSync("scripts/site.mjs", "utf8")).toContain("@johnmorrisdotca/kazoku-ui/embed-panel/define");
  });
});
