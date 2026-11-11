// check-standard.mjs: the family's must-have list for a package, as a check. The same file in every package repository (scripts/check-standard.mjs), copied unchanged
// from kazoku-ui's templates/; a repository never edits it. It reads files and runs nothing, so it is fast and runs in `pnpm test` and in CI.
//
//   node scripts/check-standard.mjs            print what is missing and exit 1, or print "ok" and exit 0
//
// The list is in spx-stats docs/package-work.md, "The must-have list": a first release is refused without every item, and an item that cannot apply to a package
// is named in package.json, with the reason, and a reviewer reads it:
//
//   "family": { "notApplicable": { "angular": "a data package with no element", "embed": "no view to frame" } }
//
// The items: demo, pages, homepage, embed, embed-panel, page-frame, family-files, docs-site, ja-guides, usage-tested, usage-in-ci, data-door, playwright-image, and the README's (or a guide's) usage for script-tag,
// esm, bundlers, react, vue, svelte, angular, iframe and typescript.
import console from "node:console";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** The day this file was last changed, in every repository at once. A test in each repository records the file's hash beside it. */
export const STANDARD_VERSION = "2026-11-11b";

const OWNER = "johnmorrisdotca";

/**
 * The SHA-256 of kazoku-ui's templates/data-door.ts (the data door of MODULES-831), line ends as "\n". A package that has src/data-door.ts must hold exactly that file; a kazoku-ui test keeps this
 * line equal to the template, so changing the template means changing this line, and then every package's copy of both files.
 */
export const DATA_DOOR_SHA256 = "b90af1f8e0f2ffc59485d5cc98995e54ee21fd98cd5ae027b90efe8c6673d5fa";

/** The usage every package's README (or a guide it links) shows, each as the words a reader would find it by. */
export const USAGE = {
  "script-tag": { label: "a plain HTML page with a script tag from a CDN (jsDelivr or unpkg)", find: /jsdelivr|unpkg/i },
  esm: { label: "an ES module import", find: /\bimport\b[^\n]*\bfrom\b\s*["']@johnmorrisdotca\//i },
  bundlers: { label: "a bundler (Vite or webpack)", find: /\b(vite|webpack)\b/i },
  react: { label: "React", find: /\breact\b/i },
  vue: { label: "Vue", find: /\bvue\b/i },
  svelte: { label: "Svelte", find: /\bsvelte\b/i },
  angular: { label: "Angular", find: /\bangular\b/i },
  iframe: { label: "an iframe of the embed page", find: /<iframe\b/i },
  typescript: { label: "TypeScript types", find: /\btypescript\b/i },
};

/** Every item of the list: its id and what it asks. */
export const ITEMS = {
  demo: "a demo page, demo/index.html",
  pages: "a GitHub Pages workflow, .github/workflows/pages.yml, that deploys it",
  homepage: `package.json's homepage is the demo (https://${OWNER}.github.io/<package>/) and the README links it`,
  embed: "an embed page, demo/embed.html (or demo/embed/index.html)",
  "embed-panel": "the demo's \"Put it in your page\" is kazoku-ui's <kazoku-embed-panel> (a package that draws nothing gives it the code tabs only)",
  "page-frame": "every demo page (not an embed or a test page) has kazoku-ui's <kazoku-page-header> (what the page is, a way home, the printable sheets) and <kazoku-page-credits>, and a <title>; an embed page has the credit line",
  "family-files": "the family's files, unedited: scripts/family-template.mjs (listing this package, with the kazoku-ui language picker and theme switch in the header), scripts/family-readme.mjs and demo/family.css",
  "docs-site": "a documentation site: scripts/docs-site.mjs, docs/site.json and at least one guide in docs/guides/",
  "ja-guides": "a Japanese twin in docs/guides/ja/ for every guide, one language to a page",
  "usage-tested": "every example run by a test: a test:usage script in package.json and an examples/ folder",
  "usage-in-ci": "that test run in CI (.github/workflows/ci.yml names test:usage)",
  "data-door": "src/data-door.ts, when the package has one, is kazoku-ui's templates/data-door.ts unchanged (a package without it takes outside data in no way yet)",
  "playwright-image": "every workflow that runs in Microsoft's Playwright image (mcr.microsoft.com/playwright:vX.Y.Z) names the version of @playwright/test the lockfile has, whose browsers the image carries",
  ...Object.fromEntries(Object.entries(USAGE).map(([id, one]) => [id, `the README or a guide shows ${one.label}`])),
};

const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const at = (root, ...parts) => join(root, ...parts);

/** The guides (English), as their files. */
const guidesOf = (root) => (existsSync(at(root, "docs", "guides")) ? readdirSync(at(root, "docs", "guides")).filter((name) => name.endsWith(".md")) : []);

/** A workflow's text with its comments taken out: lines that are a comment, and a comment at the end of a line. */
const withoutComments = (text) =>
  text
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .map((line) => line.replace(/\s+#.*$/, ""))
    .join("\n");

/**
 * Every @playwright/test the lockfile pins, each with where (the importer or catalog it is under), the text as written
 * and its version (null where the text is no version: link:, workspace:). Reads the specifier-and-version form (pnpm 6
 * and later, catalogs too) and the older one-line form ('@playwright/test': 1.40.0).
 */
const playwrightPins = (lock) => {
  const lines = lock.split("\n");
  const pins = [];
  let where = ".";
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = /^ {2}([^\s].*?):\s*$/.exec(line);
    if (heading) where = heading[1].replace(/^'|'$/g, "");
    const inline = /^\s+'?@playwright\/test'?:\s+(\S.*)$/.exec(line);
    if (inline) pins.push({ where, raw: inline[1].trim() });
    else if (/^\s+'?@playwright\/test'?:\s*$/.test(line)) {
      for (let next = index + 1; next < Math.min(lines.length, index + 4); next += 1) {
        const version = /^\s+version:\s+(\S+)/.exec(lines[next]);
        if (version) {
          pins.push({ where, raw: version[1] });
          break;
        }
      }
    }
  }
  return pins.map((pin) => ({ ...pin, version: /^'?([0-9]+\.[0-9]+\.[0-9]+)/.exec(pin.raw)?.[1] ?? null }));
};

/**
 * What is missing from the package in `root`: [{ item, say }], and what is exempt: [{ item, reason }].
 * @param {string} root
 */
export function standardOf(root = ".") {
  const pkg = JSON.parse(read(at(root, "package.json")));
  const id = String(pkg.name).replace(/^@[^/]+\//, "");
  const exempt = pkg.family?.notApplicable ?? {};
  const missing = [];
  const exempted = [];
  const need = (item, ok, say) => {
    if (ok) return;
    const reason = exempt[item];
    if (typeof reason === "string" && reason.trim().length >= 12) exempted.push({ item, reason: reason.trim() });
    else missing.push({ item, say: typeof reason === "string" ? `${say} (package.json's family.notApplicable names it with a reason too short to read: say why)` : say });
  };
  for (const item of Object.keys(exempt)) if (!(item in ITEMS)) missing.push({ item, say: `package.json's family.notApplicable names "${item}", which is not on the list (${Object.keys(ITEMS).join(", ")})` });

  need("demo", existsSync(at(root, "demo", "index.html")), "add demo/index.html, made with the family's header and footer");
  const pages = at(root, ".github", "workflows", "pages.yml");
  need("pages", existsSync(pages) && /deploy-pages/.test(read(pages)), "add .github/workflows/pages.yml (copy kazoku-ui's) and switch Pages on: gh api -X POST repos/" + OWNER + "/" + id + "/pages -f build_type=workflow");
  const readme = existsSync(at(root, "README.md")) ? read(at(root, "README.md")) : "";
  const home = `https://${OWNER}.github.io/${id}/`;
  need("homepage", String(pkg.homepage ?? "").replace(/\/?$/, "/") === home && readme.includes(home), `set "homepage": "${home}" in package.json, link it from the README, and set it on the repository: gh repo edit ${OWNER}/${id} --homepage ${home}`);
  need("embed", existsSync(at(root, "demo", "embed.html")) || existsSync(at(root, "demo", "embed", "index.html")), "add demo/embed.html: a page made to sit in an iframe, drawing what its address says");

  const pages_ = existsSync(at(root, "demo")) ? readdirSync(at(root, "demo")).filter((name) => name.endsWith(".html")) : [];
  need("embed-panel", pages_.some((name) => /<kazoku-embed-panel\b/.test(read(at(root, "demo", name)))), "put kazoku-ui's <kazoku-embed-panel> in the demo (import \"@johnmorrisdotca/kazoku-ui/embed-panel/define\"), filled with the package's own choices and code; docs/embed-panel-survey.md and the kazoku-ui guide \"embed-panel\" say how");

  // Every page of the demo says what it is and credits its data (kazoku-ui's page-frame part). A page a build makes from a source file may hold the placeholders <!--frame:head-->, <!--frame:header-->
  // and <!--frame:credits--> (the family template's <!--family:head--> counts for the head), which the build replaces with pageHeadHtml, pageHeaderHtml and pageCreditsHtml.
  const framed = pages_.filter((name) => !/(^|[-_.])(test|check)\./.test(name));
  const unframed = framed.flatMap((name) => {
    const html = read(at(root, "demo", name));
    const embed = /^embed(-3d|-page)?\.html$|-embed\.html$/.test(name);
    const lacks = [];
    if (!/<title>[^<]*\S[^<]*<\/title>|<!--(frame|family):head-->/.test(html)) lacks.push("a <title>");
    if (!embed && !/<kazoku-page-header\b|<!--frame:header-->/.test(html)) lacks.push("<kazoku-page-header>");
    if (!/<kazoku-page-credits\b|<!--frame:credits-->/.test(html)) lacks.push("<kazoku-page-credits>");
    return lacks.length > 0 ? [`${name} (${lacks.join(", ")})`] : [];
  });
  need("page-frame", unframed.length === 0, `give every demo page the page frame (import "@johnmorrisdotca/kazoku-ui/page-frame/define"; kazoku-ui's guide "page-frame" says how): ${unframed.join("; ")}`);

  const template = existsSync(at(root, "scripts", "family-template.mjs")) ? read(at(root, "scripts", "family-template.mjs")) : "";
  need(
    "family-files",
    template !== "" && existsSync(at(root, "scripts", "family-readme.mjs")) && existsSync(at(root, "demo", "family.css")) && template.includes(`id: "${id}"`) && template.includes("<kazoku-language-picker") && template.includes("<kazoku-theme-switch"),
    `copy scripts/family-template.mjs, scripts/family-readme.mjs and demo/family.css from a package on the current template (the header has <kazoku-language-picker> and <kazoku-theme-switch>), and make sure the template lists "${id}"`,
  );

  const guides = guidesOf(root);
  need("docs-site", existsSync(at(root, "scripts", "docs-site.mjs")) && existsSync(at(root, "docs", "site.json")) && guides.length > 0, "add scripts/docs-site.mjs (the family's), docs/site.json and the guides in docs/guides/ (see chikyu-earth)");
  const twins = guides.filter((name) => !existsSync(at(root, "docs", "guides", "ja", name)));
  need("ja-guides", guides.length > 0 && twins.length === 0, twins.length > 0 ? `write the Japanese twins of ${twins.join(", ")} in docs/guides/ja/` : "write the guides, each with its Japanese twin in docs/guides/ja/");

  const scripts = pkg.scripts ?? {};
  need("usage-tested", typeof scripts["test:usage"] === "string" && existsSync(at(root, "examples")), 'add an examples/ folder and a "test:usage" script that runs every example (see chikyu-earth\'s scripts/check-usage.ts)');
  const ci = at(root, ".github", "workflows", "ci.yml");
  need("usage-in-ci", existsSync(ci) && /test:usage/.test(read(ci)), "run pnpm test:usage in .github/workflows/ci.yml");

  const door = at(root, "src", "data-door.ts");
  need("data-door", !existsSync(door) || createHash("sha256").update(read(door)).digest("hex") === DATA_DOOR_SHA256, "src/data-door.ts differs from kazoku-ui's templates/data-door.ts: copy the template again, unchanged (the data door is the same file in every package)");

  // A workflow that runs in Microsoft's Playwright image gets that version's browsers only: an image older or newer than
  // the lockfile's @playwright/test fails with "Executable doesn't exist" before a test runs. Only .github/workflows is
  // read, with its comments taken out; a tag that is not a whole version (${{ }}, latest, v1.64) is not checked.
  const pins = playwrightPins(existsSync(at(root, "pnpm-lock.yaml")) ? read(at(root, "pnpm-lock.yaml")) : "");
  const workflows = existsSync(at(root, ".github", "workflows")) ? readdirSync(at(root, ".github", "workflows")).filter((name) => /\.ya?ml$/.test(name)) : [];
  const images = workflows.flatMap((name) =>
    [...withoutComments(read(at(root, ".github", "workflows", name))).matchAll(/mcr\.microsoft\.com\/playwright:v([0-9]+\.[0-9]+\.[0-9]+)(-[a-z0-9]+)?/g)].map((match) => ({
      name,
      version: match[1],
      suffix: match[2] ?? "-noble",
    })),
  );
  const imageProblems = images.flatMap((image) => {
    if (pins.length === 0) return [`${image.name} runs in Microsoft's Playwright image (v${image.version}), but pnpm-lock.yaml names no @playwright/test: add it as a dev dependency, or run elsewhere`];
    return pins.flatMap((pin) => {
      if (pin.version === null) return [`pnpm-lock.yaml gives @playwright/test for ${pin.where} as "${pin.raw}", not a version this check can read: check ${image.name}'s image (v${image.version}) against it by hand`];
      if (pin.version === image.version) return [];
      return [`set ${image.name}'s image to mcr.microsoft.com/playwright:v${pin.version}${image.suffix}, the @playwright/test of ${pin.where} in pnpm-lock.yaml (now v${image.version}${image.suffix})`];
    });
  });
  need("playwright-image", imageProblems.length === 0, [...new Set(imageProblems)].join("; "));

  const words = [readme, ...guides.map((name) => read(at(root, "docs", "guides", name)))].join("\n");
  for (const [item, one] of Object.entries(USAGE)) need(item, one.find.test(words), `show ${one.label} in the README or a guide, as a copy-paste example that a test runs`);
  return { id, missing, exempt: exempted };
}

/** The problems as lines of text, for a test or a person. */
export const standardProblems = (root = ".") => standardOf(root).missing.map((one) => `${one.item}: ${one.say}`);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = standardOf(process.argv[2] ?? ".");
  for (const one of result.exempt) console.log(`n/a  ${one.item}: ${one.reason}`);
  if (result.missing.length === 0) console.log(`ok   ${result.id} has every item of the family's list`);
  else {
    console.log(`${result.id} is missing ${result.missing.length} item${result.missing.length === 1 ? "" : "s"} of the family's must-have list (spx-stats docs/package-work.md):`);
    for (const one of result.missing) console.log(`- ${one.item}: ${one.say}`);
    process.exit(1);
  }
}
