// docs-site.test.js: the documentation site's checks, in `pnpm check`. The same file in every package of the family
// (src/docs-site.test.js, or test/docs-site.test.js where a package keeps its tests there), copied unchanged beside
// scripts/docs-site.mjs and e2e/docs-site.demo.mjs, whose hashes it records. It reads files and builds nothing: the examples
// are run by `pnpm docs:check` and by the Pages workflow's `pnpm docs:site`, which need the package built.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";
import * as tsModule from "typescript";

const ts = tsModule.default?.createSourceFile ? tsModule.default : tsModule.createSourceFile ? tsModule : (await import("typescript-api")).default;

import { DOCS_SITE_VERSION, docsProblems, importLineOf, measureBundles, modelOf, navigationEntries, packageOf, sizeBadge } from "../scripts/docs-site.mjs";

import { readInputs } from "../scripts/readme-lint.mjs";

const read = (path) => readFileSync(resolve(path === "README.md" || path.startsWith(".github/") ? packageOf(".").repositoryRoot : ".", path), "utf8").replace(/\r\n/g, "\n");
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const pkg = JSON.parse(read("package.json"));

// The recorded hashes: the generator and its browser test are one text in every package. A change to either is made in
// every repository at once, with a new DOCS_SITE_VERSION and the new hashes here.
const RECORDED = {
  version: "2026-10-13-workspaces",
  "scripts/docs-site.mjs": "5953399a4b239c6f721b733ba007daba8335689dbdbf746135c8d166aa91dead",
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
    expect(readme).toContain(site.docsUrl);
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

describe("workspace packages and generated declaration entries", () => {
  const fixture = async (check) => {
    const repo = mkdtempSync(join(tmpdir(), "docs-workspace-"));
    const root = join(repo, "apps", "api");
    const put = (file, text) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); };
    const config = { repositoryRoot: "../..", job: "Fake REST API data for testing", entries: { "./types": { source: "dist/types.d.ts", generatedBy: "scripts/build.ts" }, "./server": { platform: "node" } } };
    put(join(root, "package.json"), JSON.stringify({ name: "@johnmorrisdotca/rest-in-pieces", description: "REST in Pieces — Fake REST API data for testing", homepage: "https://spxis.github.io/rest-in-pieces/", repository: { url: "git+https://github.com/spxis/rest-in-pieces.git" }, exports: { ".": { default: "./dist/index.js" }, "./types": { types: "./dist/types.d.ts" }, "./server": { default: "./dist/server.js" } } }));
    put(join(root, "docs/site.json"), JSON.stringify(config));
    put(join(repo, "README.md"), "Repository README\n");
    put(join(repo, "CHANGELOG.md"), "# Changes\n\n## Unreleased\n\n- Document the SDK.\n");
    put(join(root, "scripts/build.ts"), "// The authoritative declaration writer.\n");
    put(join(root, "src/index.ts"), '/** In-process test responses. */\n\n/** A stable response code.\n * @returns The successful response code.\n * @example\n * ```ts\n * import { responseCode } from "@johnmorrisdotca/rest-in-pieces";\n * console.log(responseCode());\n * ```\n */\nexport function responseCode(): number { return 200; }\n');
    put(join(root, "src/server.ts"), '/** Node path helpers. */\n\nimport { basename } from "node:path";\n\n/** The last part of a file path.\n * @param file The path to read.\n * @returns Its final file name.\n * @example\n * ```ts\n * import { fileName } from "@johnmorrisdotca/rest-in-pieces/server";\n * console.log(fileName("docs/a.txt"));\n * ```\n */\nexport function fileName(file: string): string { return basename(file); }\n');
    put(join(root, "dist/types.d.ts"), '/** Generated response declarations. */\n\n/** A response body.\n * @example\n * ```ts\n * import type { Result } from "@johnmorrisdotca/rest-in-pieces/types";\n * const body: Result = { ok: true };\n * console.log(body.ok);\n * ```\n */\nexport interface Result { ok: boolean; }\n');
    for (const section of ["tutorial", "how-to", "explanation", "troubleshooting", "upgrading"]) put(join(repo, `docs/guides/${section}.md`), `---\ntitle: ${section}\nsection: ${section}\norder: 1\ndescription: Read the SDK and its declarations.\n---\n\n## Read the API\n\n[Response](api:responseCode), [body](api:Result), [source](../../apps/api/src/index.ts), [changes](../../CHANGELOG.md).\n`);
    try { await check({ repo, root, config, put }); } finally { rmSync(repo, { recursive: true, force: true }); }
  };

  it("reads repository guides and README beside a nested SDK, with real source and writer paths", async () => {
    await fixture(({ repo, root }) => {
      const model = modelOf(root);
      expect(model.site.repositoryRoot).toBe(repo);
      expect(model.site.repoUrl).toBe("https://github.com/spxis/rest-in-pieces");
      expect(model.guides).toHaveLength(5);
      expect(model.guides[0].file).toMatch(/^docs\/guides\//);
      expect(model.reference.items.find((item) => item.name === "responseCode").file).toBe("apps/api/src/index.ts");
      expect(model.reference.items.find((item) => item.name === "Result")).toMatchObject({ file: "apps/api/scripts/build.ts", generated: true });
      expect(docsProblems(root, model)).toEqual([]);
      expect(readInputs(root)).toMatchObject({ readme: "Repository README\n", job: "Fake REST API data for testing" });
    });
  });

  it("documents type-only declarations without counting them as runtime bundles", async () => {
    await fixture(async ({ root }) => {
      const model = modelOf(root);
      expect(model.reference.entries.find((entry) => entry.key === "./types").names.map((item) => item.name)).toEqual(["Result"]);
      const sizes = (await measureBundles(root)).entries;
      expect(Object.keys(sizes)).toEqual([".", "./server"]);
      expect(sizes["./server"].minified).toBeGreaterThan(0);
    });
  });

  it("rejects explicit declaration paths outside the repository", async () => {
    await fixture(({ root, config, put }) => {
      config.entries["./types"].source = "../../../outside.d.ts";
      put(join(root, "docs/site.json"), JSON.stringify(config));
      expect(() => modelOf(root)).toThrow(/source for .\/types must exist inside the repository/);
      config.entries["./types"].source = "dist/types.d.ts";
      config.entries["./types"].generatedBy = "../../../outside.ts";
      put(join(root, "docs/site.json"), JSON.stringify(config));
      expect(() => modelOf(root)).toThrow(/generatedBy for .\/types must exist inside the repository/);
    });
  });
});
