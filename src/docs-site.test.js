// docs-site.test.js: the documentation site's checks, in `pnpm check`. The same file in every package of the family
// (src/docs-site.test.js, or test/docs-site.test.js where a package keeps its tests there), copied unchanged beside
// scripts/docs-site.mjs and e2e/docs-site.demo.mjs, whose hashes it records. It reads files and builds nothing: the examples
// are run by `pnpm docs:check` and by the Pages workflow's `pnpm docs:site`, which need the package built.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";
import ts from "typescript";

import { DOCS_SITE_VERSION, docsProblems, importLineOf, navigationEntries, packageOf, sizeBadge } from "../scripts/docs-site.mjs";

const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const pkg = JSON.parse(read("package.json"));

// The recorded hashes: the generator and its browser test are one text in every package. A change to either is made in
// every repository at once, with a new DOCS_SITE_VERSION and the new hashes here.
const RECORDED = {
  version: "2026-10-13",
  "scripts/docs-site.mjs": "8ad0f05589e05b4f2769171d823f9c8e0a0abff915f17f7400760232282d774a",
  "e2e/docs-site.demo.mjs": "6119efc290d197bb2d90cdd8eaf9dc2364bc485973c4b6f0e6da64c543594564",
};

describe("the documentation site's shared files", () => {
  it("are the family's one text, byte for byte", () => {
    expect(DOCS_SITE_VERSION).toBe(RECORDED.version);
    for (const path of ["scripts/docs-site.mjs", "e2e/docs-site.demo.mjs"]) expect(sha(path), path).toBe(RECORDED[path]);
  });

  it("are wired in: the scripts, the dev dependencies, the Pages step and the ignored examples folder", () => {
    expect(pkg.scripts["docs:site"]).toBe("pnpm build && node scripts/docs-site.mjs build");
    expect(pkg.scripts["docs:check"]).toBe("pnpm build && node scripts/docs-site.mjs check");
    expect(pkg.scripts.size).toBe("node scripts/docs-site.mjs size");
    expect(pkg.scripts["test:demo"]).toMatch(/pnpm site && node scripts\/docs-site\.mjs build && playwright test/);
    for (const name of ["pagefind", "marked", "esbuild"]) expect(pkg.devDependencies?.[name], name).toBeDefined();
    for (const name of ["pagefind", "marked", "esbuild"]) expect(pkg.dependencies?.[name], `${name} is for building the docs, never a dependency of the package`).toBeUndefined();
    expect(read(".github/workflows/pages.yml")).toContain("      - run: pnpm site\n      - run: pnpm docs:site\n");
    expect(read(".gitignore")).toMatch(/^\.docs-examples\/$/m);
  });
});

describe("the docs", () => {
  it("have no problem: every export has a TSDoc summary, @param, @returns (saying what null means) and an @example that imports the package; every guide has its front matter and its links lead somewhere", () => {
    expect(docsProblems(".")).toEqual([]);
  });

  it("have docs/site.json with the job, the plain English words for what the package does", () => {
    const site = packageOf(".");
    expect(site.job, "docs/site.json has no job").toMatch(/\S/);
    expect(pkg.description).toContain(site.job);
  });
});

describe("the README's badges", () => {
  const readme = read("README.md");
  const site = packageOf(".");

  it("link to the documentation site", () => {
    expect(readme).toContain(`https://johnmorrisdotca.github.io/${site.id}/docs/`);
  });

  it("show the package's size, minified and gzipped, as docs/bundle-size.json records it and as it measures now", async () => {
    expect(existsSync("docs/bundle-size.json"), "run `pnpm size --write`").toBe(true);
    const recorded = JSON.parse(read("docs/bundle-size.json"));
    // Use the CLI's actual Node/module context instead of the test runner's transformed modules.
    const script = pathToFileURL(resolve("scripts/docs-site.mjs")).href;
    const code = `import { measureBundles } from ${JSON.stringify(script)}; console.log(JSON.stringify(await measureBundles(process.cwd())));`;
    const ran = await promisify(execFile)(process.execPath, ["--input-type=module", "-e", code], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30_000 });
    const measured = JSON.parse(ran.stdout);
    expect(Object.keys(measured.entries).sort()).toEqual(Object.keys(recorded.entries).sort());
    for (const [key, size] of Object.entries(measured.entries)) {
      // gzip's bytes move a little with the zlib a Node version carries; anything more is a change to record.
      const was = recorded.entries[key].gzip;
      expect(Math.abs(size.gzip - was), `${key} is ${size.gzip} bytes gzipped; docs/bundle-size.json says ${was}. Run \`pnpm size --write\` and update the badge.`).toBeLessThanOrEqual(Math.max(32, was * 0.01));
    }
    const whole = recorded.entries["."]?.gzip ?? Object.values(recorded.entries)[0].gzip;
    expect(readme).toContain(sizeBadge(site, whole));
  });

  it("say the package is published with npm provenance, which the Release workflow does", () => {
    expect(readme).toContain(`<a href="https://www.npmjs.com/package/${pkg.name}#provenance"><img alt="Published with npm provenance" src="https://img.shields.io/badge/npm-provenance-2f5d4a"></a>`);
    expect(read(".github/workflows/release.yml")).toContain("--provenance");
  });

  it("say how to install the package under a plain English name", () => {
    expect(readme).toMatch(/\n### Install under another name\n/);
    expect(readme).toContain(`@npm:${pkg.name}`);
  });
});


describe("large resource catalogues", () => {
  const core = [".", "./load", "./element", "./element/define"].map((key, at) => ({ key, slug: `core-${at}` }));
  const drawings = Array.from({ length: 904 }, (_, at) => ({ key: `./flags/flag-${at}`, slug: `flag-${at}` }));
  const facts = Array.from({ length: 200 }, (_, at) => ({ key: `./facts/place-${at}`, slug: `fact-${at}` }));

  it("keeps core navigation and the currently viewed drawing without repeating either catalogue", () => {
    const entries = [...core, ...drawings, ...facts];
    expect(navigationEntries(entries, "api/flag-703/svg.html")).toEqual([...core, drawings[703]]);
    expect(navigationEntries(entries, "api/fact-82/index.html")).toEqual([...core, facts[82]]);
    expect(navigationEntries(entries, "guides/getting-started.html")).toEqual(core);
    expect(entries).toHaveLength(1108);
  });

  it("keeps ordinary entry lists complete", () => {
    const entries = [...core, ...drawings.slice(0, 49)];
    expect(navigationEntries(entries, "index.html")).toEqual(entries);
  });
});


describe("generated import syntax", () => {
  it("parses default and named values and types as real TypeScript imports", () => {
    for (const [name, kind] of [["default", "const"], ["default", "type"], ["svg", "const"], ["Options", "type"]]) {
      const line = importLineOf({ name, kind, importPath: "@example/flags/jp" });
      const parsed = ts.createSourceFile("import.ts", line, ts.ScriptTarget.Latest, true);
      expect(parsed.parseDiagnostics).toEqual([]);
      const clause = parsed.statements[0].importClause;
      expect(clause.isTypeOnly).toBe(kind === "type");
      expect(name === "default" ? clause.name.text : clause.namedBindings.elements[0].name.text).toBe(name === "default" ? "value" : name);
    }
  });
});
