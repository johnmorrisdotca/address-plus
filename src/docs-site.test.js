// docs-site.test.js: the documentation site's checks, in `pnpm check`. The same file in every package of the family
// (src/docs-site.test.js, or test/docs-site.test.js where a package keeps its tests there), copied unchanged beside
// scripts/docs-site.mjs and e2e/docs-site.demo.mjs, whose hashes it records. It reads files and builds nothing: the examples
// are run by `pnpm docs:check` and by the Pages workflow's `pnpm docs:site`, which need the package built.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { DOCS_SITE_VERSION, docsProblems, measureBundles, packageOf, sizeBadge } from "../scripts/docs-site.mjs";

const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const pkg = JSON.parse(read("package.json"));

// The recorded hashes: the generator and its browser test are one text in every package. A change to either is made in
// every repository at once, with a new DOCS_SITE_VERSION and the new hashes here.
const RECORDED = {
  version: "2026-10-12",
  "scripts/docs-site.mjs": "b77b24e1b3ea74e1ca7d3d86a84ac7100401658b4101ceb5dfb8324d9d94fed8",
  "e2e/docs-site.demo.mjs": "ac9b9cc9708f720c91a7cf3faa302fede6fbde5468d1cf5255078b46ba665060",
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
    const measured = await measureBundles(".");
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
