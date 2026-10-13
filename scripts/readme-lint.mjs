// The README standard (johnmorrisdotca/.github, README-STANDARD.md) as a function: the README text, package.json and the
// pictures in docs/images go in, a list of faults comes out (empty when the README keeps the standard).
// The same file in every package; change it in johnmorrisdotca/.github/readme-standard and in every package at once.
//
//   import { lintReadme, readInputs } from "./readme-lint.mjs";
//   const faults = lintReadme(readInputs(root));
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** The `##` sections every README has, in order: [what it is called in messages, a pattern for the heading]. */
export const REQUIRED_SECTIONS = [
  ["In 30 seconds", /^(?:.+ )?in 30 seconds$/i],
  ["Who it is for", /^Who it is for$/],
  ["Features", /^Features$/],
  ["Use it in your project", /^Use it in your project$/],
  ["Examples", /^Examples$/],
  ["API", /^API$/],
  ["Theming", /^Theming$/],
  ["Limits", /^Limits$/],
  ["Accessibility", /^Accessibility$/],
  ["Browser support", /^Browser(?: and runtime)? support$/],
  ["Languages", /^Languages$/],
  ["Roadmap", /^Roadmap$/],
  ["Architecture", /^Architecture$/],
  ["The name", /^The name$/],
  ["Where it comes from, and where it is used", /^Where .*comes? from/],
  ["Development", /^Development$/],
  ["Contributing", /^Contributing$/],
  ["Changes", /^Changes$/],
  ["Licence", /^Licence$/],
];

/** `###` subsections that must be inside a given `##` section: [section's name, pattern for the subsection]. */
export const REQUIRED_SUBSECTIONS = [
  ["Features", /^What's in it$/],
  ["Use it in your project", /^Install$/],
  ["Where it comes from, and where it is used", /^The family$/],
];

export const LANGUAGES = new Set(["ts", "tsx", "js", "jsx", "mjs", "html", "sh", "json", "css", "vue", "svelte", "yaml", "diff", "text", "md"]);
export const FENCE_FLAGS = new Set(["no-run", "no-check"]);
export const BANNED = [
  "powerful", "blazing", "blazingly", "seamless", "seamlessly", "robust", "leverage", "leverages", "leveraging", "cutting-edge",
  "state-of-the-art", "best-in-class", "world-class", "revolutionary", "game-changing", "effortless", "effortlessly", "magic",
  "magical", "supercharge", "supercharged", "next-generation", "delightful", "awesome", "amazing",
];
export const BUDGET_DESK = 200 * 1024;
export const BUDGET_OTHER = 120 * 1024;
export const BUDGET_TOTAL = 2 * 1024 * 1024;
/** npm keeps and shows only the first 65,536 characters of a README: anything after is cut off, mid-sentence. */
export const BUDGET_README = 64_000;
export const MIN_EXAMPLE_BLOCKS = 6;
export const MIN_SUBJECTS = 4;
const NAME = /^([a-z0-9]+(?:-[a-z0-9]+)*)-(desk|phone)-(light|dark)\.(webp|png)$/;

/** Read what the lint needs from a package's folder. */
export function readInputs(root) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const images = join(root, "docs", "images");
  const pictures = existsSync(images) ? readdirSync(images).filter((file) => !file.startsWith(".")).map((file) => ({ file, bytes: statSync(join(images, file)).size })) : [];
  // The plain English words for what the package does ("SVG maps for JavaScript"), from docs/site.json, the documentation
  // site's file. A package without it is not yet held to the job rule.
  const site = join(root, "docs", "site.json");
  const job = existsSync(site) ? JSON.parse(readFileSync(site, "utf8")).job ?? null : null;
  return { readme: readFileSync(join(root, "README.md"), "utf8").replace(/\r\n/g, "\n"), pkg, pictures, job };
}

/** The README split into its fenced blocks and the prose between them: [{ type: "code", info, body, line } | { type: "prose", text, line }]. */
export function parts(readme) {
  const out = [];
  let prose = [];
  let proseFrom = 1;
  let code = null;
  readme.split("\n").forEach((text, index) => {
    const line = index + 1;
    const fence = /^(\s*)(`{3,}|~{3,})\s*(.*)$/.exec(text);
    if (code) {
      if (fence && fence[2][0] === code.mark[0] && fence[2].length >= code.mark.length && fence[3] === "") {
        out.push({ type: "code", info: code.info, body: code.body.join("\n"), line: code.line, indent: code.indent });
        code = null;
        proseFrom = line + 1;
      } else code.body.push(code.indent && text.startsWith(code.indent) ? text.slice(code.indent.length) : text);
      return;
    }
    if (fence) {
      if (prose.length) out.push({ type: "prose", text: prose.join("\n"), line: proseFrom });
      prose = [];
      code = { mark: fence[2], info: fence[3].trim(), body: [], line, indent: fence[1] };
      return;
    }
    if (!prose.length) proseFrom = line;
    prose.push(text);
  });
  if (prose.length) out.push({ type: "prose", text: prose.join("\n"), line: proseFrom });
  if (code) out.push({ type: "code", info: code.info, body: code.body.join("\n"), line: code.line, unclosed: true });
  return out;
}

/** The README's `##` sections: [{ title, level, body, line }], with `###` ones listed after their parent as { parent }. */
export function headings(readme) {
  const found = [];
  let inCode = false;
  readme.split("\n").forEach((text, index) => {
    if (/^\s*(```|~~~)/.test(text)) inCode = !inCode;
    if (inCode) return;
    const match = /^(#{1,6}) (.+?)\s*$/.exec(text);
    if (match) found.push({ level: match[1].length, title: match[2], line: index + 1 });
  });
  return found;
}

/** The text of the section that starts at heading `at` of `all`, to the next heading of the same or a higher level. */
export function sectionText(readme, all, at) {
  const lines = readme.split("\n");
  const end = all.slice(at + 1).find((next) => next.level <= all[at].level);
  return lines.slice(all[at].line, end ? end.line - 1 : undefined).join("\n");
}

const imageUrls = (readme) => {
  const found = [];
  for (const match of readme.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    found.push({ kind: "img", tag, src: /\ssrc="([^"]*)"/.exec(tag)?.[1], alt: /\salt="([^"]*)"/.exec(tag)?.[1], width: /\swidth="(\d+)"/.exec(tag)?.[1], at: match.index });
  }
  for (const match of readme.matchAll(/<source\b[^>]*>/gi)) {
    found.push({ kind: "source", tag: match[0], src: /\ssrcset="([^"]*)"/.exec(match[0])?.[1], media: /\smedia="([^"]*)"/.exec(match[0])?.[1], at: match.index });
  }
  for (const match of readme.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) found.push({ kind: "markdown", tag: match[0], src: match[2], alt: match[1], at: match.index });
  return found;
};

const isBadge = (src) => /^https:\/\/(img\.shields\.io|github\.com\/[^/]+\/[^/]+\/actions\/workflows\/[^/]+\/badge\.svg)/.test(src ?? "");

/** Every fault in the README, as sentences that say where and what. */
export function lintReadme({ readme, pkg, pictures, minSubjects = MIN_SUBJECTS, apiUrl, job = null }) {
  const faults = [];
  const fault = (message) => faults.push(message);
  const repo = pkg.name.split("/")[1];
  const prefix = `https://raw.githubusercontent.com/johnmorrisdotca/${repo}/main/docs/images/`;
  const all = headings(readme);
  const lines = readme.split("\n");

  if (readme.length > BUDGET_README) fault(`The README is ${readme.length.toLocaleString("en-US")} characters; npm shows only the first 65,536 and cuts the rest off, so the budget is ${BUDGET_README.toLocaleString("en-US")}. Move reference material to a file under docs/ and link it.`);

  // The title: one h1, the first thing in the README.
  const firstLine = lines.find((line) => line.trim() !== "") ?? "";
  if (!/^(# |<h1[ >])/.test(firstLine)) fault("The README does not start with its title (a `#` heading or an `<h1>`).");
  const h1s = parts(readme).filter((part) => part.type === "prose").reduce((sum, part) => sum + part.text.split("\n").filter((line) => /^# /.test(line) || /<h1[ >]/.test(line)).length, 0);
  if (h1s !== 1) fault(`The README has ${h1s} top-level titles; it has one.`);

  // The English job beside the Japanese name, wherever a search engine reads: "<Name> <kanji> — <job>".
  if (typeof job === "string" && job.trim() !== "") {
    const title = firstLine.replace(/<[^>]+>/g, "").replace(/^#\s*/, "").trim();
    if (!title.includes(job)) fault(`The title is "${title}"; it carries the job from docs/site.json beside the name: "<Name> <kanji> — ${job}".`);
    if (!String(pkg.description ?? "").includes(job)) fault(`package.json's description does not carry the job from docs/site.json, "${job}"; npm and GitHub show the description, so it says what the package does in plain English.`);
  }

  // The required sections, in order, none empty.
  const twos = all.filter((heading) => heading.level === 2);
  let from = 0;
  for (const [name, pattern] of REQUIRED_SECTIONS) {
    const at = twos.findIndex((heading, index) => index >= from && pattern.test(heading.title));
    if (at < 0) {
      fault(twos.some((heading) => pattern.test(heading.title)) ? `"## ${name}" is out of order: it comes after a section it must come before.` : `There is no "## ${name}" section.`);
      continue;
    }
    from = at + 1;
    const body = sectionText(readme, all, all.indexOf(twos[at])).trim();
    if (body.length < 40) fault(`"## ${twos[at].title}" is empty or nearly: say something, even "nothing here uses a network".`);
  }
  for (const [parent, pattern] of REQUIRED_SUBSECTIONS) {
    const at = all.findIndex((heading) => heading.level === 2 && REQUIRED_SECTIONS.find(([name]) => name === parent)?.[1].test(heading.title));
    if (at < 0) continue;
    const end = all.slice(at + 1).findIndex((heading) => heading.level <= 2);
    const inside = all.slice(at + 1, end < 0 ? undefined : at + 1 + end).filter((heading) => heading.level === 3);
    if (!inside.some((heading) => pattern.test(heading.title))) fault(`"## ${all[at].title}" has no "### ${pattern.source.replace(/^\^|\$$/g, "").replace(/\\/g, "")}" under it.`);
  }
  // Headings: unique, sentence-like, no skipped levels.
  const seen = new Map();
  let level = 1;
  for (const heading of all) {
    if (heading.level > level + 1) fault(`Line ${heading.line}: "${heading.title}" skips a heading level.`);
    level = heading.level;
    if (/[.:]$/.test(heading.title)) fault(`Line ${heading.line}: the heading "${heading.title}" ends with a full stop or a colon.`);
    if (/\p{Extended_Pictographic}/u.test(heading.title)) fault(`Line ${heading.line}: the heading "${heading.title}" has an emoji.`);
    if (/\[[^\]]*\]\(/.test(heading.title)) fault(`Line ${heading.line}: the heading "${heading.title}" has a link in it.`);
    const key = heading.title.toLowerCase();
    if (seen.has(key)) fault(`Line ${heading.line}: the heading "${heading.title}" is also on line ${seen.get(key)}; anchors would clash.`);
    else seen.set(key, heading.line);
  }

  // Fenced blocks.
  const blocks = parts(readme).filter((part) => part.type === "code");
  for (const block of blocks) {
    if (block.unclosed) fault(`Line ${block.line}: a fenced block is never closed.`);
    const [language, ...flags] = block.info.split(/\s+/).filter(Boolean);
    if (!language) fault(`Line ${block.line}: a fenced block has no language (use ts, js, html, sh, json, css, text, ...).`);
    else if (!LANGUAGES.has(language)) fault(`Line ${block.line}: "${language}" is not a language the standard lists (${[...LANGUAGES].join(", ")}).`);
    for (const flag of flags) if (!FENCE_FLAGS.has(flag)) fault(`Line ${block.line}: "${flag}" is not a fence flag (no-run, no-check).`);
  }
  const examplesAt = all.findIndex((heading) => heading.level === 2 && heading.title === "Examples");
  if (examplesAt >= 0) {
    const text = sectionText(readme, all, examplesAt);
    const count = parts(text).filter((part) => part.type === "code").length;
    if (count < MIN_EXAMPLE_BLOCKS) fault(`"## Examples" has ${count} code blocks; it has at least ${MIN_EXAMPLE_BLOCKS}.`);
    if (!/^### /m.test(text)) fault('"## Examples" has no "###" examples under it.');
  }
  // What the package exports decides which examples must be there.
  const exported = Object.keys(pkg.exports ?? {});
  const flagged = (language) => blocks.some((block) => block.info.split(/\s+/)[0] === language);
  if (exported.some((key) => /^\.\/element[/-]define$/.test(key))) {
    for (const language of ["jsx", "vue", "svelte"]) if (!flagged(language) && !(language === "jsx" && flagged("tsx"))) fault(`The package defines an element, and the README has no ${language} example of using it.`);
    if (!blocks.some((block) => /element[/-]define/.test(block.body))) fault("The package defines an element, and no example imports its `element/define` entry.");
  }
  for (const name of Object.keys(typeof pkg.bin === "string" ? { [repo]: pkg.bin } : (pkg.bin ?? {}))) {
    if (!blocks.some((block) => block.info.split(/\s+/)[0] === "sh" && block.body.includes(name))) fault(`The package has a command, "${name}", and no sh example runs it.`);
  }
  if (!readme.includes(`npm install ${pkg.name}`)) fault(`The README does not say \`npm install ${pkg.name}\`.`);

  // Tables: every row as wide as its header.
  const proseOnly = parts(readme).filter((part) => part.type === "prose");
  for (const part of proseOnly) {
    const rows = part.text.split("\n").map((text, index) => ({ text, line: part.line + index }));
    let width = null;
    for (const { text, line } of rows) {
      if (!/^\s*\|/.test(text)) { width = null; continue; }
      const cells = text.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).length;
      if (width === null) width = cells;
      else if (cells !== width) fault(`Line ${line}: a table row has ${cells} cells where its header has ${width}.`);
    }
  }

  // Tone, outside code.
  for (const part of proseOnly) {
    const withoutHtml = part.text.replace(/<[^>]+>/g, " ").replace(/\(https?:[^)]*\)/g, "()").replace(/`[^`]*`/g, "``");
    for (const word of BANNED) {
      const at = new RegExp(`(?<![\\w-])${word.replace(/-/g, "[- ]")}(?![\\w-])`, "i").exec(withoutHtml);
      if (at) fault(`Prose near line ${part.line} uses "${at[0]}", a marketing word; say what it does and give the number.`);
    }
    for (const [index, text] of withoutHtml.split("\n").entries()) {
      if (/^\s*!\[/.test(text)) continue;
      if (/[\p{L}\p{N})"'”]!(?=\s|$)/u.test(text.replace(/!\[/g, ""))) fault(`Prose line ${part.line + index} has an exclamation mark.`);
    }
  }

  // Pictures.
  const byFile = new Map(pictures.map((picture) => [picture.file, picture]));
  const referenced = new Set();
  const alts = new Map();
  const found = imageUrls(readme).filter((image) => !isBadge(image.src));
  const hero = readme.indexOf("\n## ");
  for (const image of found) {
    const label = `${image.kind} ${(image.src ?? "(no src)").split("/").pop()}`;
    if (!image.src) { fault(`An ${label} has no source.`); continue; }
    if (!image.src.startsWith(prefix)) { fault(`The picture ${image.src} is not ${prefix}<file>: pictures are named by absolute URL, from this repository's docs/images.`); continue; }
    const file = image.src.slice(prefix.length);
    referenced.add(file);
    const picture = byFile.get(file);
    if (!picture) fault(`The README shows ${file}, and docs/images/${file} does not exist.`);
    if (image.kind === "img") {
      if (!image.alt || image.alt.trim().length < 20) fault(`${file} has no alt text, or less than a sentence of it: say what is drawn.`);
      else if (alts.has(image.alt)) fault(`${file} has the same alt text as ${alts.get(image.alt)}; each is described by itself.`);
      else alts.set(image.alt, file);
      if (!image.width) fault(`${file} has no width attribute.`);
    }
  }
  const named = [];
  for (const picture of pictures) {
    const match = NAME.exec(picture.file);
    if (!match) { fault(`docs/images/${picture.file} is not named <subject>-<desk|phone>-<light|dark>.<webp|png>.`); continue; }
    named.push({ subject: match[1], view: match[2], scheme: match[3], ...picture });
    if (!referenced.has(picture.file)) fault(`docs/images/${picture.file} is not used in the README.`);
    const twin = picture.file.replace(/-(light|dark)\./, (_, scheme) => `-${scheme === "light" ? "dark" : "light"}.`);
    if (!byFile.has(twin)) fault(`docs/images/${picture.file} has no ${match[3] === "light" ? "dark" : "light"} twin (${twin}).`);
    const budget = match[2] === "desk" ? BUDGET_DESK : BUDGET_OTHER;
    if (picture.bytes > budget) fault(`docs/images/${picture.file} is ${Math.round(picture.bytes / 1024)} KB; the budget for it is ${budget / 1024} KB.`);
  }
  const total = pictures.reduce((sum, picture) => sum + picture.bytes, 0);
  if (total > BUDGET_TOTAL) fault(`The pictures come to ${(total / 1048576).toFixed(2)} MB; the budget is ${BUDGET_TOTAL / 1048576} MB.`);
  // Each light image is the img of a picture with its dark twin as a dark source, and a caption follows.
  for (const match of readme.matchAll(/<picture>([\s\S]*?)<\/picture>/g)) {
    const inner = match[1];
    const src = /<img\b[^>]*\ssrc="([^"]*)"/.exec(inner)?.[1] ?? "";
    const dark = /<source\b[^>]*media="\(prefers-color-scheme: dark\)"[^>]*\ssrcset="([^"]*)"/.exec(inner)?.[1] ?? /<source\b[^>]*\ssrcset="([^"]*)"[^>]*media="\(prefers-color-scheme: dark\)"/.exec(inner)?.[1];
    if (!src.startsWith(prefix)) continue;
    if (!/-light\./.test(src)) fault(`${src.split("/").pop()} is the img of a <picture> and is not the light file.`);
    else if (dark !== src.replace("-light.", "-dark.")) fault(`${src.split("/").pop()} has no dark source with its twin's address.`);
    const after = readme.slice(match.index + match[0].length, match.index + match[0].length + 700);
    const caption = after.split(/<\/p>|<\/td>|<picture>|\n\n/)[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (caption.length < 10) fault(`${src.split("/").pop()} has no caption under it (an <em> of what to look at).`);
  }
  for (const image of found) {
    if (image.kind === "img" && image.src?.startsWith(prefix) && !new RegExp(`<picture>[\\s\\S]*?${image.src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?</picture>`).test(readme)) fault(`${image.src.split("/").pop()} is not inside a <picture> with its dark twin.`);
  }
  if (hero > 0) {
    const before = readme.slice(0, hero);
    if (!/<picture>[\s\S]*hero-desk-light\./.test(before)) fault("The hero picture (hero-desk-light/dark) is not between the links and the first section.");
  }
  const subjects = new Set(named.map((picture) => picture.subject));
  if (subjects.size < minSubjects + 1) fault(`The pictures show ${subjects.size - (subjects.has("hero") ? 1 : 0)} subjects besides the hero; there are at least ${minSubjects} (a picture for each game or feature).`);
  if (!subjects.has("hero")) fault("There is no hero picture (docs/images/hero-desk-light.webp and its twins).");
  for (const view of ["desk", "phone"]) if (subjects.has("hero") && !named.some((picture) => picture.subject === "hero" && picture.view === view)) fault(`The hero has no ${view} picture.`);

  // The API section and the full reference.
  const api = apiUrl ?? `https://johnmorrisdotca.github.io/${repo}/api.html`;
  const apiAt = all.findIndex((heading) => heading.level === 2 && heading.title === "API");
  if (apiAt >= 0 && !sectionText(readme, all, apiAt).includes(api)) fault(`"## API" does not link the full reference (${api}).`);

  // Version pins in CDN addresses are the package's major.
  const major = String(pkg.version).split(".")[0];
  for (const match of readme.matchAll(new RegExp(`${pkg.name.replace("/", "\\/")}@([\\w.-]+)`, "g"))) if (match[1] !== major) fault(`A CDN address pins ${pkg.name}@${match[1]}; the package is at ${pkg.version}, so the pin is @${major}.`);

  // Pictures are never in the tarball.
  for (const entry of pkg.files ?? []) if (/^(\.\/)?docs\b/.test(entry)) fault(`package.json's "files" lists ${entry}: pictures and docs are not shipped.`);
  return faults;
}
