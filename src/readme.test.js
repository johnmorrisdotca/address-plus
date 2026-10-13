// The README, held to the family's README standard (johnmorrisdotca/.github, README-STANDARD.md): its sections, its examples'
// languages, its pictures and their files, its tables and its tone. The rules are in scripts/readme-lint.mjs, the same file in
// every package. A fault names the line and what to do.
import { describe, expect, it } from "vitest";

import { lintReadme, readInputs, REQUIRED_SECTIONS } from "../scripts/readme-lint.mjs";

describe("the README keeps the family's standard", () => {
  it("has no fault", () => {
    expect(lintReadme(readInputs("."))).toEqual([]);
  });

  it("lists the sections in the order the standard gives", () => {
    expect(REQUIRED_SECTIONS.map(([name]) => name)).toEqual([
      "In 30 seconds", "Who it is for", "Features", "Use it in your project", "Examples", "API", "Theming", "Limits", "Accessibility",
      "Browser support", "Languages", "Roadmap", "Architecture", "The name", "Where it comes from, and where it is used", "Development",
      "Contributing", "Changes", "Licence",
    ]);
  });
});

describe("the standard's checks catch what they are for", () => {
  const pkg = { name: "@johnmorrisdotca/sample", version: "2.1.0", files: ["dist", "README.md"] };
  const raw = "https://raw.githubusercontent.com/johnmorrisdotca/sample/main/docs/images/";
  const ok = (name) => ({ file: name, bytes: 1000 });
  const faultsFor = (readme, pictures = []) => lintReadme({ readme, pkg, pictures, minSubjects: 0 });

  it("refuses a fenced block with no language, and a language that is not listed", () => {
    expect(faultsFor("# T\n\n```\nx\n```\n\n```pascal\nx\n```\n").join("\n")).toMatch(/no language[\s\S]*pascal/);
  });

  it("refuses a picture that is not this repository's docs/images, has no alt text, or has no dark twin", () => {
    const readme = `# T\n\n<picture><img src="docs/a.webp" alt="x" width="1"></picture>\n\n<picture><source media="(prefers-color-scheme: dark)" srcset="${raw}z-desk-dark.webp"><img src="${raw}z-desk-light.webp" alt="" width="1"></picture>\n`;
    const faults = faultsFor(readme, [ok("z-desk-light.webp")]).join("\n");
    expect(faults).toMatch(/not https:\/\/raw\.githubusercontent\.com\/johnmorrisdotca\/sample\/main\/docs\/images\//);
    expect(faults).toMatch(/no alt text/);
    expect(faults).toMatch(/has no dark twin/);
    expect(faults).toMatch(/docs\/images\/z-desk-dark\.webp does not exist/);
  });

  it("refuses a picture over its budget, an unused file and a badly named one", () => {
    const faults = faultsFor("# T\n", [{ file: "big-desk-light.webp", bytes: 300 * 1024 }, { file: "big-desk-dark.webp", bytes: 1000 }, { file: "photo.jpg", bytes: 10 }]).join("\n");
    expect(faults).toMatch(/big-desk-light\.webp is 300 KB; the budget for it is 200 KB/);
    expect(faults).toMatch(/big-desk-dark\.webp is not used/);
    expect(faults).toMatch(/photo\.jpg is not named/);
  });

  it("refuses marketing words and exclamation marks in prose but not in code", () => {
    const faults = faultsFor("# T\n\nA powerful, seamless library. It works!\n\n```ts\nconst powerful = !x; // magic!\n```\n").join("\n");
    expect(faults).toMatch(/"powerful"/);
    expect(faults).toMatch(/"seamless"/);
    expect(faults).toMatch(/exclamation mark/);
    expect(faults).not.toMatch(/"magic"/);
  });

  it("refuses a table row of the wrong width, a skipped heading level and a stale version pin", () => {
    const faults = faultsFor("# T\n\n| a | b |\n| - | - |\n| 1 |\n\n## A\n\n#### Skips\n\nUse `@johnmorrisdotca/sample@1` from the CDN.\n").join("\n");
    expect(faults).toMatch(/1 cells where its header has 2/);
    expect(faults).toMatch(/skips a heading level/);
    expect(faults).toMatch(/@johnmorrisdotca\/sample@1; the package is at 2\.1\.0, so the pin is @2/);
  });

  it("refuses a README longer than npm will show", () => {
    expect(faultsFor(`# T\n\n${"word ".repeat(13_000)}\n`).join("\n")).toMatch(/npm shows only the first 65,536/);
  });

  it("refuses a title or a description without the English job, when docs/site.json names one", () => {
    const named = { ...pkg, description: "Sample サンプル — tiles for JavaScript: things." };
    expect(lintReadme({ readme: "# Sample サンプル — tiles for JavaScript\n", pkg: named, pictures: [], minSubjects: 0, job: "tiles for JavaScript" }).join("\n")).not.toMatch(/job/);
    const faults = lintReadme({ readme: "# Sample サンプル\n", pkg, pictures: [], minSubjects: 0, job: "tiles for JavaScript" }).join("\n");
    expect(faults).toMatch(/The title is "Sample サンプル"; it carries the job/);
    expect(faults).toMatch(/description does not carry the job/);
  });

  it("refuses a package whose files ship the pictures", () => {
    expect(lintReadme({ readme: "# T\n", pkg: { ...pkg, files: ["dist", "docs"] }, pictures: [], minSubjects: 0 }).join("\n")).toMatch(/"files" lists docs/);
  });
});
