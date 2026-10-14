// docs-site.mjs: the documentation site every johnmorrisdotca package publishes beside its demo, at
// https://johnmorrisdotca.github.io/<package>/docs/. Copied unchanged into each repository (scripts/docs-site.mjs), like
// family-template.mjs; a package never edits it. `src/docs-site.test.js` (the same file everywhere) holds every copy to one
// recorded hash, beside DOCS_SITE_VERSION, the day this text was last changed.
//
// A package writes words, never HTML:
//
//   - its doc comments (TSDoc) on every public export: a summary, `@param` for each parameter, `@returns` (saying what
//     null or undefined means, when the function can return one), and at least one `@example` holding a fenced block
//     that imports the package by its name, as a reader would;
//   - its guides, as Markdown under docs/guides/ (English) and docs/guides/ja/ (Japanese, the same file names), each
//     opening with front matter:
//
//       ---
//       title: Getting started
//       section: tutorial          (tutorial, how-to, explanation, troubleshooting or upgrading)
//       order: 1                   (its place in its section; optional)
//       description: One sentence for the contents, the search results and llms.txt.
//       ---
//
//     A guide has `##` and `###` headings (its title is the page's one `#`), names a fenced block's language, links to
//     another guide by its file (`other.md#a-heading`), to an export by `api:name` (or `api:entry.name` where two entry
//     points export different things under one name), to an entry point by `entry:slug` (`entry:main` for the package's
//     own), and to a file of the repository by its relative path. `CHANGELOG.md` becomes the Changelog page;
//   - docs/site.json: { "job": "Japanese text tools for JavaScript", "icon": "<data: URI>", "pitch": { "en", "ja" },
//     "name": { "en", "ja" }, "entries": { "./wareki": { "en": "Era years", "ja": "和暦" } } }. Only "job" is required: the
//     plain English words for what the package does, which every title a search engine reads carries beside the Japanese
//     name, "<Name> <kanji> — <job>" (the docs' <title> and og:title, llms.txt; and, by the README standard, the npm
//     description, the GitHub description, the README's title and the social preview). The rest is the header's lines
//     and the entry points' titles.
//
// What it makes, under site/ (the folder the Pages workflow publishes), after the demo is built:
//
//   site/docs/index.html                     the home: what the package is, its entry points, the guides
//   site/docs/guides/<slug>.html             one page per guide, from docs/guides/<slug>.md
//   site/docs/api/<entry>/index.html         one page per entry point ("main" is the package's own name)
//   site/docs/api/<entry>/<export>.html      one page per public export: signature, parameters, what it returns and
//                                            what null means, members, every example with the output it printed when
//                                            the site was built, "View source" and "Edit on GitHub"
//   site/docs/changelog.html, search.html    the changelog, rendered; search (Pagefind, built here, run in the browser)
//   site/docs/ja/…                           the same pages in Japanese (the reference's descriptions stay English)
//   site/docs/**/*.md                        each page as Markdown, for tools and language models
//   site/api.html                            the old one-page reference, kept as an index with its old anchors
//   site/llms.txt, site/llms-full.txt        the site for language models (llmstxt.org)
//
//   node scripts/docs-site.mjs build         run the examples, write the pages, index them for search (after `pnpm build`)
//   node scripts/docs-site.mjs check         the same checks and the examples, writing nothing
//   node scripts/docs-site.mjs size [--write]  measure every entry point, minified and gzipped (docs/bundle-size.json)
//
// Every example runs when the site is built: TypeScript is type-checked (strict, against the built package), then each
// block runs in Node and what it prints is shown under it. A block that fails stops the build. Fence flags as in the
// README standard: `ts no-run` is type-checked and not run, `ts no-check` is shown and neither.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { dirname, join, posix, relative, resolve } from "node:path";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import { Marked } from "marked";
import ts from "typescript";

import { FAMILY, FAMILY_PITCH, FAMILY_SCRIPT, FAMILY_WORDS, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

/** The day this file was last changed, in every repository at once. A test records the file's hash beside it. */
export const DOCS_SITE_VERSION = "2026-10-13";

const OWNER = "johnmorrisdotca";
/** The kinds of guide, in the order the contents list them (Diátaxis, with troubleshooting and upgrading of their own). */
export const GUIDE_SECTIONS = ["tutorial", "how-to", "explanation", "troubleshooting", "upgrading"];
const LANGS = ["en", "ja"];
const CODE_LANGUAGES = new Set(["ts", "tsx", "js", "jsx", "mjs", "html", "sh", "json", "css", "vue", "svelte", "yaml", "diff", "text", "md"]);
const RUNNABLE = new Set(["ts", "js", "mjs"]);

/** The words the docs say themselves, in both languages. `{name}` and the other braces are filled in. */
export const DOCS_WORDS = {
  en: {
    skip: "Skip to the content", demo: "Demo", docsPill: "Docs", home: "Overview", menu: "Contents", sideLabel: "Documentation", siteLabel: "Site",
    search: "Search", searchLabel: "Search the documentation", searchPlaceholder: "Search the docs", searchTitle: "Search",
    searchIntro: "Every guide and every page of the reference. The index is built with the site and searched in your browser: nothing you type is sent anywhere.",
    searchNoScript: "Search runs in your browser and needs JavaScript. Every page is also listed in the contents.",
    searchNone: "Nothing matches “{q}”.", searchCount: "{n} pages match “{q}”.", searchOne: "One page matches “{q}”.", searchFailed: "The search index could not be loaded.",
    guides: "Guides", reference: "Reference", tutorial: "Getting started", "how-to": "How-to", explanation: "Explanation",
    troubleshooting: "Troubleshooting & FAQ", upgrading: "Upgrading", changelog: "Changelog",
    entryPoints: "Entry points", exports: "Exports", parameters: "Parameters", returns: "Returns", members: "Members", examples: "Examples",
    example: "Example", output: "What it prints (run when this page was built)", remarks: "Remarks", seeAlso: "See also", deprecated: "Deprecated",
    definition: "Definition", nameCol: "Name", typeCol: "Type", descriptionCol: "Description", kindCol: "Kind", summaryCol: "What it is", sizeCol: "Size",
    optional: "optional", kind_function: "function", kind_type: "type", kind_const: "constant", kind_class: "class", kind_namespace: "namespace", kind_enum: "enum",
    importLine: "Import it", alsoFrom: "Also exported from", viewSource: "View source", edit: "Edit on GitHub", madeFrom: "Made from the source of {name} {version}.",
    size: "{size} minified and gzipped, with everything it imports (measured with esbuild)",
    install: "Install", startHere: "Start here", homeTitle: "{name} documentation", onThisPage: "On this page", previous: "Previous", next: "Next",
    apiIndex: "Every export on one page", llms: "The docs for language models", allExports: "{n} exports",
    englishOnly: "", untranslated: "",
    foot: "Made from the package's own source, its doc comments and its guides.", nameLink: "About the name", apiTitle: "{name} API: every export",
    apiIntro: "Every export of every entry point, each with its own page. This page keeps the addresses the old one-page reference had.",
    notFoundHeading: "",
  },
  ja: {
    skip: "本文へ移動", demo: "デモ", docsPill: "ドキュメント", home: "概要", menu: "目次", sideLabel: "ドキュメント", siteLabel: "サイト",
    search: "検索", searchLabel: "ドキュメントを検索", searchPlaceholder: "ドキュメントを検索", searchTitle: "検索",
    searchIntro: "すべてのガイドとリファレンスの全ページから探します。索引はサイトと一緒に作られ、検索はブラウザーの中で行われます。入力した言葉はどこにも送られません。",
    searchNoScript: "検索はブラウザーの中で動くため、JavaScript が必要です。すべてのページは目次からも開けます。",
    searchNone: "「{q}」に一致するページはありません。", searchCount: "「{q}」に一致するページが {n}件あります。", searchOne: "「{q}」に一致するページが 1件あります。", searchFailed: "検索の索引を読み込めませんでした。",
    guides: "ガイド", reference: "リファレンス", tutorial: "はじめに", "how-to": "やり方", explanation: "解説",
    troubleshooting: "困ったとき・よくある質問", upgrading: "アップグレード", changelog: "変更履歴",
    entryPoints: "エントリーポイント", exports: "エクスポート", parameters: "引数", returns: "戻り値", members: "メンバー", examples: "例",
    example: "例", output: "出力（このページを作ったときに実行した結果）", remarks: "補足", seeAlso: "関連項目", deprecated: "非推奨",
    definition: "定義", nameCol: "名前", typeCol: "型", descriptionCol: "説明", kindCol: "種類", summaryCol: "概要", sizeCol: "サイズ",
    optional: "省略可", kind_function: "関数", kind_type: "型", kind_const: "定数", kind_class: "クラス", kind_namespace: "名前空間", kind_enum: "列挙型",
    importLine: "インポート", alsoFrom: "ほかのエクスポート元", viewSource: "ソースを見る", edit: "GitHub で編集", madeFrom: "{name} {version} のソースから作成しました。",
    size: "最小化と gzip 圧縮をしたサイズは {size}（読み込むものをすべて含み、esbuild で計測）",
    install: "インストール", startHere: "最初に読む", homeTitle: "{name} ドキュメント", onThisPage: "このページの内容", previous: "前へ", next: "次へ",
    apiIndex: "すべてのエクスポートを1ページで", llms: "言語モデル向けのドキュメント", allExports: "エクスポート {n}個",
    englishOnly: "リファレンスの説明と例は英語です。見出しと目次は日本語です。", untranslated: "このガイドはまだ日本語に訳されていないため、英語で表示しています。",
    foot: "パッケージ自身のソース、ドキュメントコメント、ガイドから作っています。", nameLink: "名前について（英語）", apiTitle: "{name} API：すべてのエクスポート",
    apiIntro: "すべてのエントリーポイントのすべてのエクスポートです。それぞれに専用のページがあります。このページは、以前の1ページ版リファレンスのURLをそのまま残しています。",
    notFoundHeading: "",
  },
};

// ---------------------------------------------------------------------------------------------------------------------
// 1. Small helpers.

export const escapeHtml = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fill = (text, values) => String(text).replace(/\{(\w+)\}/g, (all, key) => (key in values ? String(values[key]) : all));
const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const toPosix = (path) => path.split("\\").join("/");
/** The address of `to` from the page at `from`, both relative to the docs folder. */
const hrefFrom = (from, to) => {
  const [path, hash] = to.split("#");
  const target = path === "" ? posix.basename(from) : posix.relative(posix.dirname(from), path) || posix.basename(path);
  return `${target}${hash ? `#${hash}` : ""}`;
};
/** A heading's id, the way GitHub makes them: lower case, punctuation dropped, spaces as hyphens. Japanese is kept. */
export const slugOf = (text) => text.toLowerCase().trim().replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s+/g, "-");
const firstSentence = (text) => {
  const paragraph = String(text).trim().split(/\n\s*\n/)[0].replace(/\s+/g, " ");
  const match = /^(.+?[.?!])(\s|$)/.exec(paragraph);
  return (match ? match[1] : paragraph).trim();
};
const sizeText = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;

// ---------------------------------------------------------------------------------------------------------------------
// 2. The package: package.json, the family's lines on it, and docs/site.json.

/** What the site knows about the package in `root`. */
export function packageOf(root) {
  const pkg = JSON.parse(read(join(root, "package.json")));
  const id = pkg.name.replace(/^@[^/]+\//, "");
  const member = FAMILY.find((one) => one.id === id);
  const configFile = join(root, "docs", "site.json");
  const config = existsSync(configFile) ? JSON.parse(read(configFile)) : {};
  const name = member?.name ?? config.title ?? id;
  const kana = member?.kana ?? config.kana ?? "";
  const pitchEn = config.pitch?.en ?? (FAMILY_PITCH[id] ? FAMILY_PITCH[id][0].toUpperCase() + FAMILY_PITCH[id].slice(1) + "." : pkg.description);
  const repoUrl = `https://github.com/${OWNER}/${id}`;
  const siteUrl = (pkg.homepage ?? `https://${OWNER}.github.io/${id}/`).replace(/\/?$/, "/");
  const sizesFile = join(root, "docs", "bundle-size.json");
  const sizes = existsSync(sizesFile) ? JSON.parse(read(sizesFile)) : null;
  const inFamily = member !== undefined;
  const job = typeof config.job === "string" && config.job.trim() !== "" ? config.job.trim() : null;
  return {
    root, pkg, id, name, kana, inFamily, job, headline: `${name}${kana ? ` ${kana}` : ""}${job ? ` — ${job}` : ""}`, repoUrl, siteUrl, docsUrl: `${siteUrl}docs/`, sizes,
    icon: config.icon ?? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3C/svg%3E",
    pitch: { en: pitchEn, ja: config.pitch?.ja ?? pitchEn },
    nameLine: { en: config.name?.en ?? "", ja: config.name?.ja ?? "" },
    entryTitles: config.entries ?? {},
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// 3. The reference, read from the source with the TypeScript compiler the package is built with.

/** The entry points in package.json's exports that are built from a source file: [{ key, importPath, slug, file }]. */
function entryPointsOf(site) {
  const { root, pkg } = site;
  return Object.entries(pkg.exports ?? { ".": { default: pkg.main } })
    .map(([key, entry]) => [key, typeof entry === "string" ? entry : entry.default ?? entry.import])
    .filter(([key, target]) => !key.includes("*") && typeof target === "string" && target.startsWith("./dist/") && target.endsWith(".js"))
    .map(([key, target]) => {
      const base = resolve(root, target.replace("./dist/", "src/").replace(/\.js$/, ""));
      const file = [".ts", ".tsx", ".mts"].map((ext) => base + ext).find((path) => existsSync(path));
      return { key, importPath: key === "." ? pkg.name : `${pkg.name}/${key.slice(2)}`, slug: key === "." ? "main" : key.slice(2).replace(/\//g, "-"), file, target };
    });
}

/** The comment at the top of a file, when it is about the file rather than the first thing in it. */
function moduleDocOf(sourceFile) {
  const text = sourceFile.getFullText();
  const ranges = ts.getLeadingCommentRanges(text, 0) ?? [];
  const first = ranges.find((range) => text.slice(range.pos, range.pos + 3) === "/**");
  if (!first) return "";
  const comment = text.slice(first.pos, first.end);
  const after = text.slice(first.end, first.end + 400);
  const statement = sourceFile.statements[0];
  const aboutFile = /@packageDocumentation|@module/.test(comment) || /^\s*\n\s*\n/.test(after) || /^\s*\/[/*]/.test(after) ||
    (statement && (ts.isExportDeclaration(statement) || ts.isImportDeclaration(statement)));
  if (!aboutFile) return "";
  return comment.replace(/^\/\*\*\s?/, "").replace(/\*\/$/, "").split("\n").map((line) => line.replace(/^\s*\* ?/, "")).filter((line) => !/^@(packageDocumentation|module)\b/.test(line.trim())).join("\n").trim();
}

/** Display parts as Markdown: `{@link name}` and `{@link name | text}` become links to the export. */
function markdownOf(parts = []) {
  let out = "";
  for (let at = 0; at < parts.length; at += 1) {
    const part = parts[at];
    if (part.kind === "link" && part.text.startsWith("{@link")) {
      let target = "";
      let label = "";
      for (at += 1; at < parts.length && !(parts[at].kind === "link" && parts[at].text === "}"); at += 1) {
        if (parts[at].kind === "linkName") target += parts[at].text;
        else if (parts[at].kind === "linkText") label += parts[at].text;
        else target += parts[at].text;
      }
      target = target.trim();
      label = label.replace(/^\s*\|\s*/, "").trim();
      out += /^https?:/.test(target) ? `[${label || target}](${target})` : `[${label ? label : `\`${target}\``}](api:${target})`;
    } else out += part.text;
  }
  return out.trim();
}

/** An @example's text: an optional title, then a fenced block. */
function exampleOf(text) {
  const fence = /```([^\n]*)\n([\s\S]*?)\n?```/.exec(text);
  if (!fence) return { title: text.trim(), info: "", lang: "", flags: [], code: "", fenced: false };
  const [lang = "", ...flags] = fence[1].trim().split(/\s+/);
  return { title: text.slice(0, fence.index).trim(), info: fence[1].trim(), lang, flags, code: fence[2].replace(/\s+$/, ""), fenced: true };
}

const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
const FORMAT = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const unwrap = (node) => (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression?.(node) || ts.isParenthesizedExpression(node)) ? unwrap(node.expression) : node);

/** The members of an object type, a const object, an interface or a class: [{ name, type, optional, doc }]. */
function membersOf(checker, type, declaration, { skipPrivate = false } = {}) {
  return checker.getPropertiesOfType(type)
    .filter((property) => !property.name.startsWith("__") && !(skipPrivate && property.valueDeclaration && ts.getCombinedModifierFlags(property.valueDeclaration) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) && !property.name.startsWith("#"))
    .map((property) => {
      const memberType = checker.getTypeOfSymbolAtLocation(property, declaration);
      const calls = memberType.getCallSignatures();
      return {
        name: property.name,
        type: calls.length > 0 && property.flags & ts.SymbolFlags.Method ? calls.map((call) => checker.signatureToString(call, declaration, FORMAT)).join("\n") : checker.typeToString(memberType, declaration, FORMAT),
        optional: Boolean(property.flags & ts.SymbolFlags.Optional),
        doc: markdownOf(property.getDocumentationComment(checker)),
      };
    });
}

/**
 * The reference: every entry point and every export, each export once, filed under the first entry point that exports
 * it other than the package's own (`main`), which lists everything it exports and links to the export's page.
 */
export function referenceOf(site) {
  const { root } = site;
  const found = entryPointsOf(site);
  const entries = found.filter((entry) => entry.file !== undefined);
  const configFile = join(root, "tsconfig.json");
  const parsed = existsSync(configFile) ? ts.getParsedCommandLineOfConfigFile(configFile, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} }) : null;
  const program = ts.createProgram(entries.map((entry) => entry.file), { ...(parsed?.options ?? { strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, allowImportingTsExtensions: true }), noEmit: true });
  const checker = program.getTypeChecker();
  const items = new Map();
  const ordered = [...entries.filter((entry) => entry.key !== "."), ...entries.filter((entry) => entry.key === ".")];
  for (const entry of ordered) {
    const sourceFile = program.getSourceFile(entry.file);
    entry.doc = moduleDocOf(sourceFile);
    entry.title = { en: site.entryTitles[entry.key]?.en ?? (entry.key === "." ? site.name : `/${entry.key.slice(2)}`), ja: site.entryTitles[entry.key]?.ja ?? site.entryTitles[entry.key]?.en ?? (entry.key === "." ? site.name : `/${entry.key.slice(2)}`) };
    entry.names = [];
    const module = checker.getSymbolAtLocation(sourceFile);
    for (const symbol of module ? checker.getExportsOfModule(module) : []) {
      const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
      const declaration = target.declarations?.[0] ?? target.valueDeclaration;
      const id = declaration ? `${declaration.getSourceFile().fileName}:${declaration.pos}:${symbol.name}` : `${entry.key}:${symbol.name}`;
      entry.names.push({ name: symbol.name, id });
      if (items.has(id)) {
        items.get(id).alsoIn.push(entry.importPath);
        continue;
      }
      items.set(id, describe(checker, symbol, target, declaration, entry, site));
    }
    entry.names.sort((a, b) => a.name.localeCompare(b.name, "en"));
  }
  // Two exports whose page names differ only in case would be one file on a case-insensitive disk.
  for (const entry of entries) {
    const taken = new Set();
    for (const item of [...items.values()].filter((one) => one.entry === entry.key)) {
      let file = item.name;
      while (taken.has(file.toLowerCase())) file += "-";
      taken.add(file.toLowerCase());
      item.page = `api/${entry.slug}/${file}.html`;
    }
  }
  return { entries: entries.sort((a, b) => (a.key === "." ? 1 : b.key === "." ? -1 : 0)), items: [...items.values()], unread: found.filter((entry) => entry.file === undefined) };
}

/** One export, described from its declaration and its doc comment. */
function describe(checker, symbol, target, declaration, entry, site) {
  const sourceFile = declaration?.getSourceFile();
  const statement = declaration && ts.isVariableDeclaration(declaration) ? declaration.parent.parent : declaration;
  const line = sourceFile ? sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1 : 0;
  const tags = target.getJsDocTags(checker);
  const tagText = (tag) => markdownOf(tag.text ?? []);
  const item = {
    name: symbol.name, entry: entry.key, entrySlug: entry.slug, importPath: entry.importPath, alsoIn: [],
    file: sourceFile ? toPosix(relative(site.root, sourceFile.fileName)) : "", line,
    summary: markdownOf(target.getDocumentationComment(checker)),
    remarks: tags.filter((tag) => tag.name === "remarks").map(tagText).join("\n\n"),
    deprecated: tags.find((tag) => tag.name === "deprecated") ? tagText(tags.find((tag) => tag.name === "deprecated")) || " " : null,
    see: tags.filter((tag) => tag.name === "see").map(tagText),
    examples: tags.filter((tag) => tag.name === "example").map((tag) => exampleOf(markdownOf(tag.text ?? []))),
    paramDocs: tags.filter((tag) => tag.name === "param").map((tag) => {
      const parts = tag.text ?? [];
      const nameIndex = parts.findIndex((part) => part.kind === "parameterName");
      const name = nameIndex >= 0 ? parts[nameIndex].text : "";
      return { name, doc: markdownOf(parts.slice(nameIndex + 1)).replace(/^-\s*/, "") };
    }),
    returnsDoc: tags.find((tag) => tag.name === "returns" || tag.name === "return") ? tagText(tags.find((tag) => tag.name === "returns" || tag.name === "return")).replace(/^-\s*/, "") : null,
    kind: "const", signature: "", params: [], returns: null, members: [],
  };
  if (!declaration) return item;
  const type = checker.getTypeOfSymbolAtLocation(target, declaration);
  const declarationName = symbol.name === "default" ? (declaration.name && ts.isIdentifier(declaration.name) ? declaration.name.text : "value") : symbol.name;
  if (target.flags & ts.SymbolFlags.Module) {
    item.kind = "namespace";
    item.signature = importLineOf(item);
    item.members = checker.getExportsOfModule(target).map((member) => ({ name: member.name, type: "", optional: false, doc: "" }));
  } else if (target.flags & ts.SymbolFlags.Class) {
    item.kind = "class";
    const constructs = type.getConstructSignatures();
    item.signature = [`class ${declarationName}`, ...constructs.map((call) => `new ${declarationName}${checker.signatureToString(call, declaration, FORMAT)}`)].join("\n");
    item.members = membersOf(checker, checker.getDeclaredTypeOfSymbol(target), declaration, { skipPrivate: true });
    const construct = constructs[0];
    if (construct) item.params = paramsOf(checker, construct, item);
  } else if (target.flags & ts.SymbolFlags.Enum) {
    item.kind = "enum";
    item.signature = printer.printNode(ts.EmitHint.Unspecified, declaration, sourceFile);
    item.members = (target.exports ? [...target.exports.values()] : []).map((member) => ({ name: member.name, type: "", optional: false, doc: markdownOf(member.getDocumentationComment(checker)) }));
  } else if (target.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)) {
    item.kind = "type";
    item.signature = printer.printNode(ts.EmitHint.Unspecified, declaration, sourceFile).replace(/^export /, "");
    const declared = checker.getDeclaredTypeOfSymbol(target);
    if (!(declared.flags & ts.TypeFlags.Union) && declared.getCallSignatures().length === 0 && (declared.flags & ts.TypeFlags.Object || declared.flags & ts.TypeFlags.Intersection)) item.members = membersOf(checker, declared, declaration);
  } else if (type.getCallSignatures().length > 0) {
    item.kind = "function";
    const calls = type.getCallSignatures();
    item.signature = calls.map((call) => `function ${declarationName}${checker.signatureToString(call, declaration, FORMAT)}`).join("\n");
    item.params = paramsOf(checker, calls[calls.length - 1], item);
    const returnType = checker.getReturnTypeOfSignature(calls[calls.length - 1]);
    item.returns = { type: checker.typeToString(returnType, declaration, FORMAT), doc: item.returnsDoc ?? "", nullable: /\b(null|undefined)\b/.test(checker.typeToString(returnType, declaration, FORMAT)), void: Boolean(returnType.flags & ts.TypeFlags.Void) };
  } else {
    item.kind = "const";
    const typeText = checker.typeToString(type, declaration, FORMAT);
    const initializer = ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined;
    const printed = initializer ? printer.printNode(ts.EmitHint.Expression, initializer, sourceFile) : "";
    item.signature = `const ${declarationName}: ${typeText}${printed && printed.length <= 1600 ? ` = ${printed}` : ""}`;
    if (initializer && ts.isObjectLiteralExpression(unwrap(initializer))) item.members = membersOf(checker, type, declaration);
  }
  return item;
}

/** A signature's parameters, each with its type and its @param words; a destructured one takes the name its @param gives. */
function paramsOf(checker, call, item) {
  return call.getParameters().map((parameter, index) => {
    const node = parameter.valueDeclaration;
    const pattern = node && ts.isParameter(node) && !ts.isIdentifier(node.name);
    const named = item.paramDocs.find((doc) => doc.name === parameter.name);
    const name = pattern ? (item.paramDocs[index]?.name || "options") : parameter.name;
    const doc = named ?? (pattern ? item.paramDocs[index] : undefined);
    return {
      name: `${node && ts.isParameter(node) && node.dotDotDotToken ? "..." : ""}${name}`,
      type: checker.typeToString(checker.getTypeOfSymbolAtLocation(parameter, node ?? item), node, FORMAT),
      optional: Boolean(node && ts.isParameter(node) && (node.questionToken || node.initializer)),
      doc: doc?.doc ?? "",
      documented: doc !== undefined && doc.doc.trim() !== "",
      raw: parameter.name,
    };
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// 4. The guides.

const parseFrontMatter = (text) => {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) return { data: null, body: text };
  const data = {};
  for (const line of match[1].split("\n")) {
    const pair = /^([\w-]+):\s*(.*)$/.exec(line);
    if (pair) data[pair[1]] = pair[2].replace(/^"(.*)"$/, "$1").trim();
  }
  return { data, body: text.slice(match[0].length) };
};

/** Every guide: [{ slug, lang, file, title, section, order, description, body }]. */
export function guidesOf(site) {
  const guides = [];
  for (const lang of LANGS) {
    const folder = join(site.root, "docs", "guides", ...(lang === "en" ? [] : [lang]));
    if (!existsSync(folder)) continue;
    for (const file of readdirSync(folder).filter((name) => name.endsWith(".md")).sort()) {
      const { data, body } = parseFrontMatter(read(join(folder, file)));
      guides.push({ slug: file.replace(/\.md$/, ""), lang, file: toPosix(relative(site.root, join(folder, file))), title: data?.title ?? "", section: data?.section ?? "", order: Number(data?.order ?? 99), description: data?.description ?? "", body, frontMatter: data !== null });
    }
  }
  const rank = (guide) => [GUIDE_SECTIONS.indexOf(guide.section), guide.order, guide.slug];
  return guides.sort((a, b) => { const [x, y] = [rank(a), rank(b)]; return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2]); });
}

// ---------------------------------------------------------------------------------------------------------------------
// 5. Markdown, rendered with its links resolved: guides, doc comments and the changelog all go through here.

/** A small highlighter for the languages the examples are in: comments, strings, numbers and keywords. */
const KEYWORDS = new Set("import export from const let var function return if else for of in while do new await async class extends type interface as typeof keyof readonly true false null undefined void this throw try catch finally switch case break continue default yield satisfies".split(" "));
export function highlight(code, lang) {
  if (!["ts", "tsx", "js", "jsx", "mjs", "json", "vue", "svelte"].includes(lang)) return escapeHtml(code);
  const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?\b)|([A-Za-z_$][\w$]*)/g;
  let out = "";
  let last = 0;
  for (const match of code.matchAll(pattern)) {
    out += escapeHtml(code.slice(last, match.index));
    const [whole, comment, string, number, word] = match;
    if (comment) out += `<span class="tk-c">${escapeHtml(whole)}</span>`;
    else if (string) out += `<span class="tk-s">${escapeHtml(whole)}</span>`;
    else if (number) out += `<span class="tk-n">${escapeHtml(whole)}</span>`;
    else if (word && KEYWORDS.has(word)) out += `<span class="tk-k">${escapeHtml(whole)}</span>`;
    else out += escapeHtml(whole);
    last = match.index + whole.length;
  }
  return out + escapeHtml(code.slice(last));
}

/**
 * Markdown as HTML. `resolve(href)` answers a link's address or null when it leads nowhere (which `problems` collects);
 * `code(name)` answers the page an export's name in backticks links to, or null. Raw HTML is shown as text: a package
 * writes words, never markup. Headings get ids; `headingOffset` moves them down (a doc comment's ## under a page's ##).
 */
export function renderMarkdown(markdown, { resolve: resolveHref = (href) => href, code: codeLink = () => null, headingOffset = 0, ids = new Map(), headings = [], outputs = new Map() } = {}) {
  const idFor = (text) => {
    const base = slugOf(text) || "section";
    const count = ids.get(base) ?? 0;
    ids.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
  let block = 0;
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }) {
        const id = idFor(text.replace(/`/g, ""));
        const level = Math.min(6, depth + headingOffset);
        headings.push({ level, id, text: text.replace(/`/g, "") });
        return `<h${level} id="${escapeHtml(id)}">${this.parser.parseInline(tokens)}</h${level}>\n`;
      },
      link({ href, title, tokens }) {
        const target = resolveHref(href);
        const inner = this.parser.parseInline(tokens);
        if (target === null) return inner;
        const external = /^https?:/.test(target);
        return `<a href="${escapeHtml(target)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external ? ` rel="noopener"` : ""}>${inner}</a>`;
      },
      codespan({ text }) {
        const page = codeLink(text.replace(/\(\)$/, ""));
        const code = `<code>${escapeHtml(text)}</code>`;
        return page ? `<a href="${escapeHtml(page)}">${code}</a>` : code;
      },
      code({ text, lang = "" }) {
        const [language] = (lang ?? "").split(/\s+/);
        const output = outputs.get(block);
        block += 1;
        return `<div class="docs-code"><pre data-lang="${escapeHtml(language)}"><code>${highlight(text, language)}</code></pre>${output ? `<pre class="docs-output" aria-label="output"><code>${escapeHtml(output)}</code></pre>` : ""}</div>\n`;
      },
      html({ text }) {
        return escapeHtml(text);
      },
      table(token) {
        return `<div class="fam-table-box">${defaultTable.call(this, token)}</div>\n`;
      },
    },
  });
  return marked.parse(markdown);
}
/** marked's own table, wrapped so that a wide table scrolls inside its box and never the page. */
function defaultTable(token) {
  let header = "";
  for (const cell of token.header) header += `<th${cell.align ? ` style="text-align:${cell.align}"` : ""}>${this.parser.parseInline(cell.tokens)}</th>`;
  let body = "";
  for (const row of token.rows) body += `<tr>${row.map((cell) => `<td${cell.align ? ` style="text-align:${cell.align}"` : ""}>${this.parser.parseInline(cell.tokens)}</td>`).join("")}</tr>\n`;
  return `<table>\n<thead><tr>${header}</tr></thead>\n<tbody>${body}</tbody></table>`;
}

/** The fenced blocks of a Markdown text, in order: [{ info, lang, flags, code, line }]. */
export function fencesOf(markdown) {
  const out = [];
  let open = null;
  markdown.split("\n").forEach((text, index) => {
    const fence = /^(\s*)(`{3,}|~{3,})\s*(.*)$/.exec(text);
    if (open) {
      if (fence && fence[2][0] === open.mark[0] && fence[2].length >= open.mark.length && fence[3] === "") {
        const [lang = "", ...flags] = open.info.split(/\s+/);
        out.push({ info: open.info, lang, flags, code: open.body.join("\n"), line: open.line });
        open = null;
      } else open.body.push(open.indent && text.startsWith(open.indent) ? text.slice(open.indent.length) : text);
      return;
    }
    if (fence) open = { mark: fence[2], info: fence[3].trim(), body: [], line: index + 1, indent: fence[1] };
  });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// 6. The model: every page, with its address, its language, its words and the links it may use.

/** Everything the pages are made of, and the links between them. */
export function modelOf(root) {
  const site = packageOf(root);
  const reference = referenceOf(site);
  const guides = guidesOf(site);
  const byName = new Map();
  for (const item of reference.items) byName.set(item.name, [...(byName.get(item.name) ?? []), item]);
  const english = guides.filter((guide) => guide.lang === "en");
  return { site, reference, guides, english, byName };
}

/** The page an `api:` or `entry:` link, or an export's name in backticks, leads to, relative to the docs folder; null if none. */
function referenceTarget(model, href) {
  if (href.startsWith("entry:")) {
    const slug = href.slice(6);
    return model.reference.entries.some((entry) => entry.slug === slug) ? `api/${slug}/index.html` : null;
  }
  const name = href.replace(/^api:/, "");
  const dot = name.indexOf(".");
  if (dot > 0) {
    const [slug, export_] = [name.slice(0, dot), name.slice(dot + 1)];
    const entry = model.reference.entries.find((one) => one.slug === slug);
    const found = entry?.names.find((one) => one.name === export_);
    const item = found && model.reference.items.find((one) => (model.byName.get(export_) ?? []).includes(one) && (one.entry === entry.key || one.alsoIn.includes(entry.importPath)));
    return item?.page ?? null;
  }
  const found = model.byName.get(name) ?? [];
  return found.length === 1 ? found[0].page : null;
}

/** A guide's link, resolved: an address relative to the page `from`, or null with a problem recorded. */
function guideLink(model, guide, href, from, problems, anchorsOf) {
  const where = `${guide.file}: the link to "${href}"`;
  if (/^(https?:|mailto:)/.test(href)) return href;
  if (href.startsWith("api:") || href.startsWith("entry:")) {
    const page = referenceTarget(model, href);
    if (page === null) problems.push(`${where} names no export or entry point${href.startsWith("api:") && (model.byName.get(href.slice(4)) ?? []).length > 1 ? " (two entry points export it: write api:<entry>.<name>)" : ""}.`);
    return page === null ? null : hrefFrom(from, pagePath(guide.lang, page));
  }
  const [path, hash] = href.split("#");
  if (path === "") {
    if (hash && !anchorsOf(guide).has(hash)) problems.push(`${where} names no heading on this page.`);
    return `#${hash ?? ""}`;
  }
  const absolute = posix.normalize(posix.join(posix.dirname(guide.file), path));
  const english = guide.lang === "en" ? absolute : absolute.replace(`docs/guides/${guide.lang}/`, "docs/guides/");
  const target = model.english.find((one) => one.file === english || one.file === absolute);
  if (target) {
    const twin = model.guides.find((one) => one.slug === target.slug && one.lang === guide.lang) ?? target;
    if (hash && !anchorsOf(twin).has(hash)) problems.push(`${where} names no heading in ${twin.file}.`);
    return hrefFrom(from, pagePath(guide.lang, `guides/${target.slug}.html`)) + (hash ? `#${hash}` : "");
  }
  if (posix.basename(absolute) === "CHANGELOG.md" && existsSync(join(model.site.root, absolute))) return hrefFrom(from, pagePath(guide.lang, "changelog.html"));
  if (existsSync(join(model.site.root, absolute)) && !absolute.startsWith("..")) {
    const kind = statSync(join(model.site.root, absolute)).isDirectory() ? "tree" : "blob";
    return `${model.site.repoUrl}/${kind}/main/${absolute}${hash ? `#${hash}` : ""}`;
  }
  problems.push(`${where} leads to nothing: ${absolute} is not a guide or a file of the repository.`);
  return null;
}

/** An address relative to the docs folder, in a language: "guides/x.html" in Japanese is "ja/guides/x.html". */
const pagePath = (lang, path) => (lang === "en" ? path : `${lang}/${path}`);

// ---------------------------------------------------------------------------------------------------------------------
// 7. The checks: what `pnpm check` (through src/docs-site.test.js) and the build both refuse.

/** Everything wrong with a package's docs, as sentences naming the file and what to do; empty when nothing is. */
export function docsProblems(root, model = modelOf(root)) {
  const problems = [];
  const { site, reference, guides } = model;
  for (const entry of reference.unread) problems.push(`package.json exports ${entry.importPath} from ${entry.target}, and no source file src/${entry.target.slice(7).replace(/\.js$/, ".ts")} (or .tsx, .mts) is there to read its docs from.`);
  for (const item of reference.items) {
    const where = `${item.file}:${item.line} ${item.name} (${item.importPath})`;
    if (item.kind === "namespace") continue;
    if (item.summary.trim() === "") problems.push(`${where} has no TSDoc summary: write a doc comment saying what it is.`);
    if (item.examples.length === 0) problems.push(`${where} has no @example: add one with a fenced block that imports ${item.importPath} and runs.`);
    item.examples.forEach((example, index) => {
      if (!example.fenced) problems.push(`${where} @example ${index + 1} has no fenced block.`);
      else if (!CODE_LANGUAGES.has(example.lang)) problems.push(`${where} @example ${index + 1} names no language its fence may use (${example.lang || "none"}).`);
      else if (RUNNABLE.has(example.lang) && !example.flags.includes("no-check") && !example.code.includes(`from "${site.pkg.name}`)) problems.push(`${where} @example ${index + 1} does not import the package by its name ("${site.pkg.name}…"), as a reader would.`);
    });
    if (item.kind === "function" || item.kind === "class") {
      for (const param of item.params) if (!param.documented) problems.push(`${where} has no @param for its parameter ${param.name}.`);
      for (const doc of item.paramDocs) if (!item.params.some((param) => param.name.replace(/^\.\.\./, "") === doc.name || param.raw === doc.name)) problems.push(`${where} documents a parameter ${doc.name} it does not have.`);
    }
    if (item.kind === "function" && !item.returns.void) {
      if (!item.returnsDoc) problems.push(`${where} has no @returns: say what it gives back.`);
      else if (item.returns.nullable && !/\b(null|undefined)\b/.test(item.returnsDoc)) problems.push(`${where} can return ${item.returns.type}, and its @returns does not say what null (or undefined) means.`);
    }
  }
  if (site.job === null) problems.push(`docs/site.json has no "job": the plain English words for what ${site.name} does, which every title carries beside the Japanese name ("${site.name}${site.kana ? ` ${site.kana}` : ""} — <job>").`);
  else if (!site.pkg.description?.includes(site.job)) problems.push(`package.json's description does not carry the job, "${site.job}": npm and GitHub show it, so it reads "${site.headline}…".`);
  const sections = new Set(guides.filter((guide) => guide.lang === "en").map((guide) => guide.section));
  for (const section of GUIDE_SECTIONS) if (!sections.has(section)) problems.push(`docs/guides/ has no guide whose section is ${section}: the site has a place for one (see docs/ROLLOUT.md).`);
  for (const guide of guides) {
    if (!guide.frontMatter) { problems.push(`${guide.file} has no front matter (---, title, section, description, ---).`); continue; }
    if (!guide.title) problems.push(`${guide.file} has no title in its front matter.`);
    if (!guide.description) problems.push(`${guide.file} has no description in its front matter.`);
    if (!GUIDE_SECTIONS.includes(guide.section)) problems.push(`${guide.file} has section "${guide.section}"; it must be one of ${GUIDE_SECTIONS.join(", ")}.`);
    if (guide.lang !== "en" && !model.english.some((one) => one.slug === guide.slug)) problems.push(`${guide.file} has no English guide of the same name in docs/guides/.`);
    let previous = 1;
    let inCode = false;
    guide.body.split("\n").forEach((text, index) => {
      if (/^\s*(```|~~~)/.test(text)) inCode = !inCode;
      const heading = !inCode && /^(#{1,6}) /.exec(text);
      if (!heading) return;
      const level = heading[1].length;
      if (level === 1) problems.push(`${guide.file}:${index + 1} is a # heading; the title is the page's one, so a guide starts at ##.`);
      else if (level > previous + 1) problems.push(`${guide.file}:${index + 1} skips a heading level (${"#".repeat(previous)} to ${heading[1]}).`);
      previous = level;
    });
    for (const fence of fencesOf(guide.body)) if (!CODE_LANGUAGES.has(fence.lang)) problems.push(`${guide.file}:${fence.line} is a fenced block with ${fence.lang ? `the language "${fence.lang}", which is not listed` : "no language"}.`);
  }
  // Every link of every guide, and every link of every doc comment, rendered once to find the ones that lead nowhere.
  const anchors = new Map();
  const anchorsOf = (guide) => {
    if (!anchors.has(guide.file)) {
      const headings = [];
      renderMarkdown(guide.body, { headings, resolve: () => null });
      anchors.set(guide.file, new Set(headings.map((heading) => heading.id)));
    }
    return anchors.get(guide.file);
  };
  for (const guide of guides) renderMarkdown(guide.body, { resolve: (href) => guideLink(model, guide, href, pagePath(guide.lang, `guides/${guide.slug}.html`), problems, anchorsOf) });
  for (const item of reference.items) {
    const texts = [item.summary, item.remarks, item.returnsDoc ?? "", ...item.see, ...item.paramDocs.map((doc) => doc.doc), ...item.members.map((member) => member.doc)];
    for (const text of texts) renderMarkdown(text, { resolve: (href) => {
      if (/^(https?:|mailto:|#)/.test(href)) return href;
      if (referenceTarget(model, href) === null) problems.push(`${item.file}:${item.line} ${item.name}: {@link ${href.replace(/^api:/, "")}} names no export.`);
      return href;
    } });
  }
  return problems;
}

// ---------------------------------------------------------------------------------------------------------------------
// 8. The examples: every runnable block of every doc comment and every guide, type-checked and run against the built
//    package, in a folder inside the package so that it imports itself by its own name.

/** Every block to run: [{ id, origin, lang, flags, code }]. */
function examplesOf(model) {
  const blocks = [];
  for (const item of model.reference.items) item.examples.forEach((example, index) => blocks.push({ key: `item:${item.page}:${index}`, origin: `${item.file}:${item.line} ${item.name} @example ${index + 1}`, ...example }));
  for (const guide of model.guides) fencesOf(guide.body).forEach((fence, index) => blocks.push({ key: `guide:${guide.file}:${index}`, origin: `${guide.file}:${fence.line}`, ...fence }));
  return blocks.filter((block) => RUNNABLE.has(block.lang) && !block.flags.includes("no-check"));
}

/** Run the examples. Resolves to Map(key → what it printed); rejects naming every block that failed. */
export async function runExamples(model, { log = () => {} } = {}) {
  const { root } = model.site;
  if (!existsSync(join(root, "dist"))) throw new Error("dist/ is not built: run `pnpm build` first (`pnpm docs:site` does)");
  const work = join(root, ".docs-examples");
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const blocks = examplesOf(model).map((block, index) => ({ ...block, file: join(work, `example-${index}.${block.lang === "ts" ? "ts" : "mjs"}`) }));
  for (const block of blocks) writeFileSync(block.file, `${block.code}\nexport {};\n`);
  const failures = [];
  const typed = blocks.filter((block) => block.lang === "ts");
  if (typed.length > 0) {
    writeFileSync(join(work, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["dom", "dom.iterable", "es2023"], module: "esnext", moduleResolution: "bundler", strict: true, noEmit: true, skipLibCheck: true, types: [] }, include: typed.map((block) => posix.basename(toPosix(block.file))) }));
    const checked = spawnSync(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", join(work, "tsconfig.json")], { cwd: root, encoding: "utf8" });
    if (checked.status !== 0) {
      const named = (checked.stdout + checked.stderr).replace(/\.docs-examples[\\/]example-(\d+)\.ts\((\d+),(\d+)\)/g, (all, at, row, column) => `${blocks[Number(at)].origin}, line ${row} of the block, column ${column}`);
      failures.push(`The examples' TypeScript does not type-check:\n${named.trim()}`);
    } else log(`ok   ${typed.length} TypeScript examples type-check`);
  }
  const outputs = new Map();
  const queue = blocks.filter((block) => !block.flags.includes("no-run"));
  const runOne = (block) => new Promise((done) => {
    const child = spawn(process.execPath, [block.file], { cwd: root, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" } });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill(), 60_000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => {
      clearTimeout(timer);
      if (status !== 0) failures.push(`${block.origin} did not run:\n${(stderr || stdout).trim().split("\n").slice(0, 12).join("\n")}`);
      else outputs.set(block.key, stdout.replace(/\s+$/, ""));
      done();
    });
  });
  const workers = Array.from({ length: Math.max(1, Math.min(8, availableParallelism())) }, async () => { while (queue.length > 0) await runOne(queue.shift()); });
  await Promise.all(workers);
  rmSync(work, { recursive: true, force: true });
  if (failures.length > 0) throw new Error(`${failures.length} example${failures.length === 1 ? "" : "s"} failed:\n\n${failures.join("\n\n")}`);
  log(`ok   ${blocks.length - (blocks.length - outputs.size - typed.filter((block) => block.flags.includes("no-run")).length)} examples ran`);
  return outputs;
}

// ---------------------------------------------------------------------------------------------------------------------
// 9. The bundle sizes: each entry point bundled and minified with esbuild, then gzipped, as a reader's bundler would.

/** { esbuild, entries: { ".": { minified, gzip }, … } } for the package in `root`. */
export async function measureBundles(root) {
  const site = packageOf(root);
  const esbuild = await import("esbuild");
  const entries = {};
  for (const entry of entryPointsOf(site).filter((one) => one.file !== undefined)) {
    const built = await esbuild.build({ entryPoints: [entry.file], bundle: true, minify: true, format: "esm", platform: "neutral", target: "es2020", write: false, logLevel: "silent", loader: { ".css": "text", ".svg": "text", ".txt": "text" }, mainFields: ["module", "main"] });
    const bytes = built.outputFiles[0].contents;
    entries[entry.key] = { minified: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
  }
  return { measured: `esbuild ${esbuild.version}, bundled, minified, ES2020, gzip level 9`, entries };
}

/** The README badge for the package's whole size, as the standard writes it. */
export function sizeBadge(site, gzip) {
  const text = sizeText(gzip);
  return `<a href="${site.docsUrl}api/main/index.html"><img alt="${text} minified and gzipped" src="https://img.shields.io/badge/min%2Bgzip-${encodeURIComponent(text)}-2f5d4a"></a>`;
}

// ---------------------------------------------------------------------------------------------------------------------
// 10. The pages.

/** The stylesheet of the docs, written beside the pages as docs.css. It uses the family's variables. */
export const DOCS_CSS = `/* The documentation site: made by scripts/docs-site.mjs, over the family's family.css. */
.docs-page { max-width: 1240px; margin: 0 auto; padding: 20px 16px 40px; }
.docs-page > * { min-width: 0; max-width: 100%; }
.docs-page .intro { min-height: 0; }
.docs-page [data-help-switch] { display: none; }
.docs-skip { position: absolute; left: 16px; top: -100px; z-index: 20; background: var(--surface); color: var(--ink); border: 2px solid var(--accent); border-radius: 10px; padding: 10px 14px; font-weight: 600; }
.docs-skip:focus { top: 8px; }
.docs-brand { margin: 0; font-size: 1.8rem; font-weight: 700; letter-spacing: -.01em; color: var(--ink); }
header p.docs-brand { color: var(--ink); margin: 0; }
.docs-brand a { text-decoration: none; }
.docs-brand span { font-size: 1rem; color: var(--muted); margin-left: 6px; font-weight: 500; }
header .lang a { font-size: .9rem; font-weight: 600; color: var(--muted); border: 0; border-radius: 999px; min-width: 44px; min-height: 44px; padding: 0 14px; display: inline-flex; align-items: center; text-decoration: none; }
header .lang a[aria-current="true"] { background: var(--ink); color: var(--page); }
.docs-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: start; }
@media (min-width: 960px) { .docs-layout { grid-template-columns: 270px minmax(0, 1fr); gap: 36px; } }
.docs-menu > summary { min-height: 44px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; border: 1px solid var(--rule); border-radius: 12px; padding: 0 14px; background: var(--surface); list-style: none; }
.docs-menu > summary::-webkit-details-marker { display: none; }
.docs-menu > summary::before { content: "☰"; }
@media (min-width: 960px) {
  .docs-menu { position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow-y: auto; overscroll-behavior: contain; }
  .docs-menu > summary { display: none; }
}
nav.docs-side { display: block; font-size: .92rem; padding: 10px 2px 4px; }
nav.docs-side a { display: flex; align-items: center; min-height: 36px; border: 0; border-radius: 8px; padding: 4px 10px; font-weight: 400; font-size: inherit; text-decoration: none; color: inherit; overflow-wrap: anywhere; }
nav.docs-side a:hover { background: color-mix(in srgb, var(--ink) 7%, transparent); border: 0; }
nav.docs-side a[aria-current="page"] { background: var(--felt); color: var(--felt-ink); font-weight: 600; }
nav.docs-side h2 { font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 18px 10px 4px; font-weight: 600; }
nav.docs-side ul { list-style: none; margin: 0; padding: 0; }
nav.docs-side ul ul { padding-left: 12px; border-left: 1px solid var(--rule); margin-left: 12px; }
nav.docs-side details > summary { min-height: 36px; display: flex; align-items: center; gap: 6px; padding: 4px 10px; cursor: pointer; border-radius: 8px; list-style: none; overflow-wrap: anywhere; }
nav.docs-side details > summary::-webkit-details-marker { display: none; }
nav.docs-side details > summary::before { content: "▸"; color: var(--muted); }
nav.docs-side details[open] > summary::before { content: "▾"; }
nav.docs-side details > summary code, nav.docs-side a code { font-size: .82rem; }
nav.docs-side .docs-entry-code { color: var(--muted); font-family: var(--mono); font-size: .78rem; margin-left: auto; padding-left: 6px; white-space: nowrap; }
.docs-search { display: flex; gap: 6px; align-items: center; margin: 4px 0 0; }
.docs-search input { flex: 1 1 auto; width: 100%; }
.docs-search button, .docs-search-big button { white-space: nowrap; flex: none; }
.docs-content { min-width: 0; line-height: 1.6; max-width: 80ch; }
.docs-layout > main.docs-content { margin: 0; padding: 0 0 20px; width: 100%; }
.docs-page > main.docs-content { margin: 0 auto; padding: 0 0 20px; }
.docs-content > * { max-width: 100%; }
.docs-content h1 { font-size: 1.9rem; line-height: 1.2; margin: 6px 0 10px; overflow-wrap: anywhere; letter-spacing: -.01em; }
.docs-content h2 { font-size: 1.3rem; margin: 36px 0 8px; padding-top: 18px; border-top: 1px solid var(--rule); overflow-wrap: anywhere; }
.docs-content h3 { font-size: 1.08rem; margin: 26px 0 6px; overflow-wrap: anywhere; }
.docs-content h4 { font-size: 1rem; margin: 20px 0 6px; }
.docs-content p, .docs-content ul, .docs-content ol { margin: 0 0 14px; overflow-wrap: anywhere; }
.docs-content li { margin: 3px 0; }
.docs-content a { color: inherit; text-underline-offset: 2px; }
.docs-content a:hover { color: var(--accent); }
.docs-content :not(pre) > code, .docs-content a > code { font-size: .88em; background: color-mix(in srgb, var(--ink) 7%, transparent); border-radius: 5px; padding: 1px 5px; overflow-wrap: anywhere; }
.docs-content blockquote { margin: 0 0 14px; padding: 8px 14px; border-left: 4px solid var(--felt); background: var(--surface); border-radius: 0 10px 10px 0; }
.docs-content blockquote > :last-child { margin-bottom: 0; }
.docs-content .fam-table-box { margin: 0 0 16px; }
.docs-content table code { white-space: normal; overflow-wrap: break-word; }
.docs-content td, .docs-content th { overflow-wrap: break-word; }
.docs-content h1 code { background: none; padding: 0; font-size: 1em; }
.docs-code { margin: 0 0 16px; display: grid; gap: 0; }
.docs-code pre { margin: 0; }
.docs-code pre + pre { border-top-left-radius: 0; border-top-right-radius: 0; }
.docs-code pre:has(+ pre) { border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom-style: dashed; }
.docs-output { background: color-mix(in srgb, var(--ink) 4%, var(--surface)); color: var(--ink); }
.docs-output::before { content: attr(aria-label); display: none; }
.docs-crumbs { font-size: .85rem; color: var(--muted); margin: 0 0 4px; display: flex; flex-wrap: wrap; gap: 4px 8px; }
.docs-crumbs a { color: inherit; }
.docs-lead { font-size: 1.08rem; color: var(--ink); }
.docs-kind { font-family: var(--font); font-size: .78rem; vertical-align: middle; margin-left: 8px; }
.docs-signature { margin: 0 0 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.docs-import { margin: 0 0 6px; }
.docs-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 26px 0 0; padding-top: 14px; border-top: 1px solid var(--rule); font-size: .85rem; color: var(--muted); }
.docs-meta a, .docs-meta span { color: inherit; display: inline-flex; align-items: center; min-height: 44px; }
.docs-note { border: 1px solid var(--rule); border-left: 4px solid var(--gold); background: var(--surface); border-radius: 10px; padding: 10px 14px; margin: 0 0 16px; font-size: .92rem; }
.docs-cards { list-style: none; margin: 0 0 18px; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); gap: 10px; }
.docs-cards a { display: grid; gap: 4px; height: 100%; border: 1px solid var(--rule); border-radius: 14px; padding: 12px 14px; text-decoration: none; background: var(--surface); }
.docs-cards a:hover { border-color: var(--ink); color: inherit; }
.docs-cards b { font-size: 1rem; }
.docs-cards span { color: var(--muted); font-size: .88rem; line-height: 1.45; }
.docs-toc { border: 1px solid var(--rule); border-radius: 12px; padding: 8px 14px; margin: 0 0 16px; background: var(--surface); font-size: .9rem; }
.docs-toc ul { margin: 6px 0 4px; padding-left: 18px; }
.docs-pager { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 10px; margin: 30px 0 0; }
.docs-pager a { border: 1px solid var(--rule); border-radius: 12px; padding: 10px 14px; text-decoration: none; display: grid; gap: 2px; min-height: 44px; }
.docs-pager a:hover { border-color: var(--ink); }
.docs-pager span { font-size: .78rem; color: var(--muted); }
.docs-pager a[rel="next"] { text-align: right; }
.docs-results { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 10px; }
.docs-results li { border: 1px solid var(--rule); border-radius: 12px; padding: 10px 14px; background: var(--surface); }
.docs-results a { font-weight: 600; }
.docs-results p { margin: 4px 0 0; font-size: .9rem; color: var(--muted); }
.docs-results mark { background: color-mix(in srgb, var(--gold) 45%, transparent); color: inherit; border-radius: 3px; }
.docs-results .docs-where { font-size: .75rem; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); margin: 0 0 2px; }
.docs-search-big { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 8px; }
.docs-search-big input { flex: 1 1 220px; }
.tk-c { color: var(--muted); font-style: italic; }
.tk-s { color: #2f6b45; }
.tk-k { color: #a33b25; font-weight: 600; }
.tk-n { color: #6a4bb0; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .tk-s { color: #7fcf98; } :root:not([data-theme="light"]) .tk-k { color: #f08a6c; } :root:not([data-theme="light"]) .tk-n { color: #c2a8ff; } }
:root[data-theme="dark"] .tk-s { color: #7fcf98; }
:root[data-theme="dark"] .tk-k { color: #f08a6c; }
:root[data-theme="dark"] .tk-n { color: #c2a8ff; }
`;

/** The script every page carries: the language links remember the choice, the menu folds on a phone, and / focuses search. */
const docsScript = (id) => `(function docsPage() {
  document.querySelectorAll("header .lang a[data-lang]").forEach(function (link) {
    link.addEventListener("click", function () { try { localStorage.setItem(${JSON.stringify(`${id}.page.lang`)}, link.dataset.lang); } catch (error) { /* Not remembered; still followed. */ } });
  });
  var menu = document.querySelector(".docs-menu");
  if (menu !== null && !matchMedia("(min-width: 960px)").matches) menu.open = false;
  document.addEventListener("keydown", function (event) {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    var box = document.getElementById("docs-q") || document.getElementById("docs-side-q");
    if (box === null) return;
    if (menu !== null) menu.open = true;
    event.preventDefault();
    box.focus();
  });
})();`;

/** The search page's own script: Pagefind's index, loaded on first use, results drawn as a list. */
const searchScript = (words) => `(function docsSearch() {
  var root = new URL("./", location.href);
  var form = document.getElementById("docs-search-form");
  var box = document.getElementById("docs-q");
  var list = document.getElementById("docs-results");
  var status = document.getElementById("docs-status");
  var WORDS = ${JSON.stringify({ none: words.searchNone, count: words.searchCount, one: words.searchOne, failed: words.searchFailed })};
  var say = function (text, values) { return text.replace(/\\{(\\w+)\\}/g, function (all, key) { return key in values ? values[key] : all; }); };
  var loaded = null;
  var load = function () {
    if (loaded === null) loaded = import(new URL(${JSON.stringify("pagefind/pagefind.js")}, new URL(document.documentElement.dataset.docsRoot, location.href)).href).then(function (pagefind) {
      return pagefind.options({ baseUrl: new URL(document.documentElement.dataset.docsRoot, location.href).pathname }).then(function () { return pagefind; });
    });
    return loaded;
  };
  var turn = 0;
  var run = function (query) {
    var mine = (turn += 1);
    var url = new URL(location.href);
    if (query) url.searchParams.set("q", query); else url.searchParams.delete("q");
    history.replaceState(history.state, "", url.pathname + url.search);
    if (!query) { list.replaceChildren(); status.textContent = ""; return; }
    load().then(function (pagefind) { return pagefind.search(query); }).then(function (found) {
      return Promise.all(found.results.slice(0, 30).map(function (result) { return result.data(); })).then(function (pages) { return { total: found.results.length, pages: pages }; });
    }).then(function (answer) {
      if (mine !== turn) return;
      status.textContent = answer.total === 0 ? say(WORDS.none, { q: query }) : answer.total === 1 ? say(WORDS.one, { q: query }) : say(WORDS.count, { q: query, n: answer.total });
      list.replaceChildren.apply(list, answer.pages.map(function (page) {
        var item = document.createElement("li");
        if (page.meta.section) { var where = document.createElement("p"); where.className = "docs-where"; where.textContent = page.meta.section; item.appendChild(where); }
        var link = document.createElement("a");
        link.href = page.url;
        link.textContent = page.meta.title || page.url;
        item.appendChild(link);
        var excerpt = document.createElement("p");
        // Pagefind's excerpt is the page's own text, escaped, with <mark> around what matched.
        excerpt.innerHTML = page.excerpt;
        item.appendChild(excerpt);
        return item;
      }));
    }).catch(function () { if (mine === turn) status.textContent = WORDS.failed; });
  };
  var timer = null;
  box.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { run(box.value.trim()); }, 160); });
  form.addEventListener("submit", function (event) { event.preventDefault(); run(box.value.trim()); });
  var asked = new URLSearchParams(location.search).get("q");
  if (asked) { box.value = asked; run(asked.trim()); }
  document.getElementById("docs-noscript").hidden = true;
  form.hidden = false;
})();`;

/** The header, footer and language links of one page, from the family's template, with the words filled in here. */
function frame(model, page, words, content) {
  const { site } = model;
  const lang = page.lang;
  const all = { ...FAMILY_WORDS[lang], ...words, pitch: site.pitch[lang], name: site.nameLine[lang], foot: words.foot };
  const say = (html) => html
    .replace(/<(\w+)([^>]*?) data-say="(\w+)"([^>]*)><\/\1>/g, (whole, tag, before, key, after) => `<${tag}${before}${after}>${escapeHtml(all[key] ?? "")}</${tag}>`)
    .replace(/ data-say-label="(\w+)"/g, (whole, key) => ` aria-label="${escapeHtml(all[key] ?? "")}"`)
    .replace(/ data-say-title="(\w+)"/g, (whole, key) => ` title="${escapeHtml(all[key] ?? "")}"`);
  const home = hrefFrom(pagePath(lang, page.path), pagePath(lang, "index.html"));
  const demo = posix.relative(posix.dirname(`docs/${pagePath(lang, page.path)}`), "index.html") + (lang === "ja" ? "?lang=ja" : "");
  const twins = Object.fromEntries(LANGS.map((other) => [other, hrefFrom(pagePath(lang, page.path), pagePath(other, page.path))]));
  let header = site.inFamily ? familyHeader({ id: site.id, links: [{ href: demo, say: "demo" }] }) : `<header><div class="intro"><h1>${escapeHtml(site.name)}${site.kana ? `<span lang="ja">${escapeHtml(site.kana)}</span>` : ""}</h1><p data-say="pitch"></p></div><nav><div class="lang" role="group" aria-label="Language / 言語"><button type="button" data-lang="en" lang="en">English</button><button type="button" data-lang="ja" lang="ja">日本語</button></div><a href="${escapeHtml(site.siteUrl)}" data-say="demo"></a><a href="${site.repoUrl}">GitHub</a><a href="https://www.npmjs.com/package/${site.pkg.name}">npm</a></nav></header>`;
  header = say(header)
    .replace(/<h1>([\s\S]*?)<\/h1>/, (whole, inner) => `<p class="docs-brand"><a href="${home}">${inner}</a></p>`)
    .replace("<nav>", `<nav aria-label="${escapeHtml(words.siteLabel)}">`)
    .replace(/<button type="button" data-lang="(\w+)" lang="\w+">([^<]*)<\/button>/g, (whole, code, label) => `<a href="${escapeHtml(twins[code])}" data-lang="${code}" lang="${code}" hreflang="${code}"${code === lang ? ` aria-current="true"` : ""}>${label}</a>`);
  const footer = site.inFamily ? say(familyFooter({ id: site.id })) : `<footer><span>${escapeHtml(words.foot)}</span><span><code>npm install ${escapeHtml(site.pkg.name)}</code> · MIT © John Morris</span></footer>`;
  const unreviewed = lang === "ja" && site.inFamily ? familyUnreviewed({ id: site.id }).replace(" hidden>", ">") : "";
  const englishRoot = hrefFrom(pagePath(lang, page.path), "index.html").replace(/index\.html$/, "") || "./";
  const title = page.path === "index.html" ? site.headline : `${page.title} · ${site.headline}`;
  return `<!doctype html>
<html lang="${lang}" data-docs-root="${escapeHtml(englishRoot)}">
  <head>
    ${familyHeadFor(site, { title, description: page.description || site.pitch[lang], ogTitle: site.headline })}
    <link rel="icon" href="${site.icon}" />
    ${LANGS.map((other) => `<link rel="alternate" hreflang="${other}" href="${escapeHtml(site.docsUrl + pagePath(other, page.path))}" />`).join("\n    ")}
    <link rel="stylesheet" href="${englishRoot}family.css" />
    <link rel="stylesheet" href="${englishRoot}docs.css" />
  </head>
  <body>
    <a class="docs-skip" href="#content">${escapeHtml(words.skip)}</a>
    <div class="docs-page">
      ${header}
      <div class="docs-layout">
        <details class="docs-menu" open>
          <summary>${escapeHtml(words.menu)}</summary>
          ${sidebar(model, page, words)}
        </details>
        <main id="content" class="docs-content" tabindex="-1"${page.indexed === false ? "" : ` data-pagefind-body`}>
          ${page.section ? `<span hidden data-pagefind-meta="section">${escapeHtml(page.section)}</span>` : ""}
          ${content}
          ${unreviewed}
        </main>
      </div>
      ${footer}
    </div>
    <script>${site.inFamily ? FAMILY_SCRIPT : ""}${docsScript(site.id)}</script>${page.script ? `\n    <script>${page.script}</script>` : ""}
  </body>
</html>
`;
}

const familyHeadFor = (site, { title, description, ogTitle = title }) => (site.inFamily ? familyHead({ id: site.id, title, description, ogTitle }) : [`<meta charset="utf-8" />`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`, `<title>${escapeHtml(title)}</title>`, `<meta name="description" content="${escapeHtml(description)}" />`, `<meta name="theme-color" content="#2f5d4a" />`, `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`, `<meta property="og:description" content="${escapeHtml(description)}" />`].join("\n    "));

/** The contents: the overview, the reference by entry point, then the guides by kind, then the changelog. */
/** Keep large sibling resource catalogues on the entry index, with the current resource open beside core entries. */
export function navigationEntries(entries, currentPath) {
  const parentOf = (entry) => entry.key.slice(0, entry.key.lastIndexOf("/"));
  const counts = new Map();
  for (const entry of entries) {
    const parent = parentOf(entry);
    if (parent !== "." && parent !== "") counts.set(parent, (counts.get(parent) ?? 0) + 1);
  }
  return entries.filter((entry) => (counts.get(parentOf(entry)) ?? 0) < 50 || currentPath.startsWith(`api/${entry.slug}/`));
}

function sidebar(model, page, words) {
  const lang = page.lang;
  const from = pagePath(lang, page.path);
  const link = (path, label, extra = "") => `<a href="${escapeHtml(hrefFrom(from, pagePath(lang, path)))}"${path === page.path ? ` aria-current="page"` : ""}>${label}${extra}</a>`;
  const visible = navigationEntries(model.reference.entries, page.path);
  const catalogue = visible.length < model.reference.entries.length ? `<li>${link("index.html#reference", escapeHtml(words.entryPoints))}</li>` : "";
  const entries = visible.map((entry) => {
    const items = model.reference.items.filter((item) => item.entry === entry.key).sort((a, b) => a.name.localeCompare(b.name, "en"));
    const open = page.path.startsWith(`api/${entry.slug}/`);
    const code = entry.key === "." ? "" : `<span class="docs-entry-code">${escapeHtml(`/${entry.key.slice(2)}`)}</span>`;
    return `<li><details${open ? " open" : ""}><summary>${escapeHtml(entry.title[lang])}${code}</summary><ul>
            <li>${link(`api/${entry.slug}/index.html`, escapeHtml(words.home))}</li>
            ${items.map((item) => `<li>${link(item.page, `<code>${escapeHtml(item.name)}</code>`)}</li>`).join("\n            ")}
          </ul></details></li>`;
  }).join("\n          ");
  const guides = GUIDE_SECTIONS.map((section) => {
    const list = model.english.filter((guide) => guide.section === section);
    if (list.length === 0) return "";
    const label = (guide) => escapeHtml((model.guides.find((one) => one.slug === guide.slug && one.lang === lang) ?? guide).title);
    if (list.length === 1 && section !== "how-to" && section !== "explanation") return `<li>${link(`guides/${list[0].slug}.html`, label(list[0]))}</li>`;
    return `<li><h3 class="fam-sr">${escapeHtml(words[section])}</h3><details${list.some((guide) => page.path === `guides/${guide.slug}.html`) || section === "how-to" ? " open" : ""}><summary>${escapeHtml(words[section])}</summary><ul>${list.map((guide) => `<li>${link(`guides/${guide.slug}.html`, label(guide))}</li>`).join("")}</ul></details></li>`;
  }).join("\n          ");
  return `<nav class="docs-side" aria-label="${escapeHtml(words.sideLabel)}">
        <form class="docs-search" role="search" action="${escapeHtml(hrefFrom(from, pagePath(lang, "search.html")))}">
          <label class="fam-sr" for="docs-side-q">${escapeHtml(words.searchLabel)}</label>
          <input id="docs-side-q" class="fam-field" type="search" name="q" placeholder="${escapeHtml(words.searchPlaceholder)}" autocomplete="off" />
          <button class="fam-button" type="submit">${escapeHtml(words.search)}</button>
        </form>
        <ul>
          <li>${link("index.html", escapeHtml(words.home))}</li>
        </ul>
        <h2>${escapeHtml(words.reference)}</h2>
        <ul>
          ${catalogue}
          ${entries}
        </ul>
        <h2>${escapeHtml(words.guides)}</h2>
        <ul>
          ${guides}
          <li>${link("changelog.html", escapeHtml(words.changelog))}</li>
        </ul>
      </nav>`.replace(/<li><h3 class="fam-sr">[^<]*<\/h3>/g, "<li>");
}

/** Renders a doc comment's Markdown on an API page: links to exports go to their pages, from this page. */
function docMarkdown(model, page, text, options = {}) {
  const from = pagePath(page.lang, page.path);
  return renderMarkdown(text, {
    ...options,
    resolve: (href) => {
      if (/^(https?:|mailto:|#)/.test(href)) return href;
      const target = referenceTarget(model, href);
      return target === null ? null : hrefFrom(from, pagePath(page.lang, target));
    },
    code: (name) => {
      const target = referenceTarget(model, name);
      return target === null || target === page.path ? null : hrefFrom(from, pagePath(page.lang, target));
    },
  });
}

const kindBadge = (words, kind) => `<span class="fam-badge docs-kind" data-pagefind-ignore>${escapeHtml(words[`kind_${kind}`] ?? kind)}</span>`;

/** One export's page. */
/** A valid TypeScript import for named, type-only and default public exports. */
export function importLineOf(item) {
  const binding = item.name === "default" ? "value" : `{ ${item.name} }`;
  return `import ${item.kind === "type" ? "type " : ""}${binding} from "${item.importPath}";`;
}

function itemPage(model, item, lang, outputs) {
  const words = DOCS_WORDS[lang];
  const page = { lang, path: item.page, title: item.name, description: firstSentence(item.summary).replace(/`/g, ""), section: words.reference };
  const entry = model.reference.entries.find((one) => one.key === item.entry);
  const md = (text, options) => docMarkdown(model, page, text, options);
  const english = lang === "en" ? "" : ` lang="en"`;
  const parts = [];
  parts.push(`<p class="docs-crumbs" data-pagefind-ignore><a href="${hrefFrom(pagePath(lang, page.path), pagePath(lang, `api/${entry.slug}/index.html`))}">${escapeHtml(words.reference)} · ${escapeHtml(entry.title[lang])}</a></p>`);
  parts.push(`<h1 data-pagefind-weight="10"><code data-pagefind-meta="title">${escapeHtml(item.name)}</code>${kindBadge(words, item.kind)}</h1>`);
  if (lang !== "en" && words.englishOnly) parts.push(`<p class="docs-note">${escapeHtml(words.englishOnly)}</p>`);
  if (item.deprecated !== null) parts.push(`<div class="docs-note"${english}><strong>${escapeHtml(words.deprecated)}.</strong> ${md(item.deprecated)}</div>`);
  parts.push(`<div class="docs-lead"${english}>${md(item.summary)}</div>`);
  parts.push(`<p class="fam-fine docs-import" data-pagefind-ignore>${escapeHtml(words.importLine)}</p><pre class="docs-signature"><code>${highlight(importLineOf(item), "ts")}</code></pre>`);
  if (item.alsoIn.length > 0) parts.push(`<p class="fam-fine">${escapeHtml(words.alsoFrom)}: ${item.alsoIn.map((path) => `<code>${escapeHtml(path)}</code>`).join(", ")}</p>`);
  parts.push(`<h2 id="definition">${escapeHtml(words.definition)}</h2><pre class="docs-signature"><code>${highlight(item.signature, "ts")}</code></pre>`);
  if (item.params.length > 0) {
    parts.push(`<h2 id="parameters">${escapeHtml(words.parameters)}</h2><div class="fam-table-box"><table><thead><tr><th>${escapeHtml(words.nameCol)}</th><th>${escapeHtml(words.typeCol)}</th><th>${escapeHtml(words.descriptionCol)}</th></tr></thead><tbody>${item.params.map((param) => `<tr><td><code>${escapeHtml(param.name)}</code>${param.optional ? ` <span class="fam-muted">(${escapeHtml(words.optional)})</span>` : ""}</td><td><code>${escapeHtml(param.type)}</code></td><td${english}>${md(param.doc)}</td></tr>`).join("")}</tbody></table></div>`);
  }
  if (item.returns && !item.returns.void) parts.push(`<h2 id="returns">${escapeHtml(words.returns)}</h2><p><code>${escapeHtml(item.returns.type)}</code></p><div${english}>${md(item.returns.doc)}</div>`);
  if (item.members.length > 0) {
    parts.push(`<h2 id="members">${escapeHtml(words.members)}</h2><div class="fam-table-box"><table><thead><tr><th>${escapeHtml(words.nameCol)}</th>${item.kind === "namespace" ? "" : `<th>${escapeHtml(words.typeCol)}</th><th>${escapeHtml(words.descriptionCol)}</th>`}</tr></thead><tbody>${item.members.map((member) => {
      if (item.kind === "namespace") { const target = referenceTarget(model, member.name); return `<tr><td>${target ? `<a href="${hrefFrom(pagePath(lang, page.path), pagePath(lang, target))}"><code>${escapeHtml(member.name)}</code></a>` : `<code>${escapeHtml(member.name)}</code>`}</td></tr>`; }
      return `<tr><td><code>${escapeHtml(member.name)}</code>${member.optional ? ` <span class="fam-muted">(${escapeHtml(words.optional)})</span>` : ""}</td><td><code>${escapeHtml(member.type)}</code></td><td${english}>${md(member.doc)}</td></tr>`;
    }).join("")}</tbody></table></div>`);
  }
  if (item.remarks) parts.push(`<h2 id="remarks">${escapeHtml(words.remarks)}</h2><div${english}>${md(item.remarks, { headingOffset: 1 })}</div>`);
  if (item.examples.length > 0) {
    parts.push(`<h2 id="examples">${escapeHtml(words.examples)}</h2>`);
    item.examples.forEach((example, index) => {
      if (item.examples.length > 1 || example.title) parts.push(`<h3 id="example-${index + 1}">${escapeHtml(words.example)} ${index + 1}${example.title ? `: <span${english}>${escapeHtml(example.title.replace(/[.:]$/, ""))}</span>` : ""}</h3>`);
      const output = outputs.get(`item:${item.page}:${index}`);
      parts.push(`<div class="docs-code"><pre data-lang="${escapeHtml(example.lang)}"><code>${highlight(example.code, example.lang)}</code></pre>${output ? `<pre class="docs-output" aria-label="${escapeHtml(words.output)}"><code>${escapeHtml(output)}</code></pre>` : ""}</div>${output ? `<p class="fam-fine">${escapeHtml(words.output)}</p>` : ""}`);
    });
  }
  if (item.see.length > 0) parts.push(`<h2 id="see-also">${escapeHtml(words.seeAlso)}</h2><ul${english}>${item.see.map((text) => `<li>${md(text).replace(/^<p>|<\/p>\n?$/g, "")}</li>`).join("")}</ul>`);
  parts.push(metaLine(model, words, { source: `${model.site.repoUrl}/blob/main/${item.file}#L${item.line}`, edit: `${model.site.repoUrl}/edit/main/${item.file}#L${item.line}` }));
  return { ...page, html: frame(model, page, words, parts.join("\n          ")), markdown: itemMarkdown(model, item, outputs) };
}

const metaLine = (model, words, { source, edit }) => `<p class="docs-meta">${source ? `<a href="${escapeHtml(source)}" rel="noopener">${escapeHtml(words.viewSource)}</a>` : ""}${edit ? `<a href="${escapeHtml(edit)}" rel="noopener">${escapeHtml(words.edit)}</a>` : ""}<span>${escapeHtml(fill(words.madeFrom, { name: model.site.pkg.name, version: model.site.pkg.version }))}</span></p>`;

/** An export as Markdown, for llms-full.txt and the .md twin of its page. */
function itemMarkdown(model, item, outputs) {
  const lines = [`# ${item.name}`, "", `${item.kind} · \`${importLineOf(item)}\``, "", item.summary, "", "```ts", item.signature, "```", ""];
  if (item.params.length > 0) lines.push("## Parameters", "", ...item.params.map((param) => `- \`${param.name}\`${param.optional ? " (optional)" : ""}: \`${param.type}\`. ${param.doc}`), "");
  if (item.returns && !item.returns.void) lines.push("## Returns", "", `\`${item.returns.type}\`. ${item.returns.doc}`, "");
  if (item.members.length > 0) lines.push("## Members", "", ...item.members.map((member) => `- \`${member.name}\`${member.optional ? " (optional)" : ""}${member.type ? `: \`${member.type}\`` : ""}${member.doc ? `. ${member.doc}` : ""}`), "");
  if (item.remarks) lines.push("## Remarks", "", item.remarks, "");
  item.examples.forEach((example, index) => {
    lines.push(`## Example${item.examples.length > 1 ? ` ${index + 1}` : ""}${example.title ? `: ${example.title}` : ""}`, "", `\`\`\`${example.lang}`, example.code, "```", "");
    const output = outputs.get(`item:${item.page}:${index}`);
    if (output) lines.push("Prints:", "", "```text", output, "```", "");
  });
  return lines.join("\n").replace(/\(api:([\w.]+)\)/g, (whole, name) => { const target = referenceTarget(model, `api:${name}`); return target ? `(${model.site.docsUrl}${target.replace(/\.html$/, ".md")})` : whole; });
}

/** An entry point's page: what it holds, its size, and every export with its first sentence. */
function entryPage(model, entry, lang) {
  const words = DOCS_WORDS[lang];
  const page = { lang, path: `api/${entry.slug}/index.html`, title: `${entry.title[lang]}${entry.key === "." ? "" : ` (${entry.importPath.replace(model.site.pkg.name, "")})`}`, description: firstSentence(entry.doc), section: words.reference };
  const english = lang === "en" ? "" : ` lang="en"`;
  const items = entry.names.map((one) => ({ one, item: model.reference.items.find((item) => item.page && (item.name === one.name) && (item.entry === entry.key || item.alsoIn.includes(entry.importPath))) })).filter(({ item }) => item);
  const size = model.site.sizes?.entries?.[entry.key];
  const from = pagePath(lang, page.path);
  const parts = [
    `<p class="docs-crumbs" data-pagefind-ignore><span>${escapeHtml(words.reference)}</span></p>`,
    `<h1>${escapeHtml(entry.title[lang])}</h1>`,
    `<pre class="docs-signature"><code>${highlight(`import { … } from "${entry.importPath}";`, "ts")}</code></pre>`,
    size ? `<p class="fam-fine">${escapeHtml(fill(words.size, { size: sizeText(size.gzip) }))}</p>` : "",
    lang !== "en" && words.englishOnly ? `<p class="docs-note">${escapeHtml(words.englishOnly)}</p>` : "",
    entry.doc ? `<div${english}>${docMarkdown(model, page, entry.doc, { headingOffset: 1 })}</div>` : "",
    `<h2 id="exports">${escapeHtml(words.exports)}</h2>`,
    `<div class="fam-table-box"><table><thead><tr><th>${escapeHtml(words.nameCol)}</th><th>${escapeHtml(words.kindCol)}</th><th>${escapeHtml(words.summaryCol)}</th></tr></thead><tbody>${items.map(({ item }) => `<tr><td><a href="${hrefFrom(from, pagePath(lang, item.page))}"><code>${escapeHtml(item.name)}</code></a></td><td>${escapeHtml(words[`kind_${item.kind}`] ?? item.kind)}</td><td${english}>${docMarkdown(model, page, firstSentence(item.summary)).replace(/^<p>|<\/p>\n?$/g, "")}</td></tr>`).join("")}</tbody></table></div>`,
    metaLine(model, words, { source: `${model.site.repoUrl}/blob/main/${toPosix(relative(model.site.root, entry.file))}`, edit: `${model.site.repoUrl}/edit/main/${toPosix(relative(model.site.root, entry.file))}` }),
  ];
  const markdown = [`# ${entry.title.en} (\`${entry.importPath}\`)`, "", entry.doc, "", ...items.map(({ item }) => `- [${item.name}](${model.site.docsUrl}${item.page.replace(/\.html$/, ".md")}): ${firstSentence(item.summary)}`), ""].join("\n");
  return { ...page, html: frame(model, page, words, parts.filter(Boolean).join("\n          ")), markdown };
}

/** The order the guides are read in, for the Previous and Next links. */
const readingOrder = (model) => model.english.map((guide) => `guides/${guide.slug}.html`).concat(["changelog.html"]);

function guidePage(model, english, lang, outputs) {
  const words = DOCS_WORDS[lang];
  const guide = model.guides.find((one) => one.slug === english.slug && one.lang === lang) ?? english;
  const translated = guide.lang === lang;
  const page = { lang, path: `guides/${english.slug}.html`, title: guide.title, description: guide.description, section: words[guide.section] };
  const from = pagePath(lang, page.path);
  const headings = [];
  const fences = fencesOf(guide.body);
  const blockOutputs = new Map(fences.map((fence, index) => [index, outputs.get(`guide:${guide.file}:${index}`)]).filter(([, output]) => output));
  const anchorsOf = (one) => { const found = []; renderMarkdown(one.body, { headings: found, resolve: () => null }); return new Set(found.map((heading) => heading.id)); };
  const body = renderMarkdown(guide.body, {
    headings, outputs: blockOutputs,
    resolve: (href) => guideLink(model, guide, href, from, [], anchorsOf),
    code: (name) => { const target = referenceTarget(model, name); return target === null ? null : hrefFrom(from, pagePath(lang, target)); },
  });
  const tops = headings.filter((heading) => heading.level === 2);
  const order = readingOrder(model);
  const at = order.indexOf(page.path);
  const near = (path, rel) => {
    if (!path) return "";
    const twin = path === "changelog.html" ? { title: words.changelog } : (() => { const slug = path.slice(7, -5); return model.guides.find((one) => one.slug === slug && one.lang === lang) ?? model.english.find((one) => one.slug === slug); })();
    return `<a href="${hrefFrom(from, pagePath(lang, path))}" rel="${rel}"><span>${escapeHtml(rel === "prev" ? words.previous : words.next)}</span>${escapeHtml(twin.title)}</a>`;
  };
  const parts = [
    `<p class="docs-crumbs" data-pagefind-ignore><span>${escapeHtml(words[guide.section])}</span></p>`,
    `<h1>${escapeHtml(guide.title)}</h1>`,
    translated || !words.untranslated ? "" : `<p class="docs-note">${escapeHtml(words.untranslated)}</p>`,
    guide.description ? `<p class="docs-lead"${translated || lang === "en" ? "" : ` lang="en"`}>${escapeHtml(guide.description)}</p>` : "",
    tops.length >= 3 ? `<div class="docs-toc" role="navigation" aria-label="${escapeHtml(words.onThisPage)}"><strong>${escapeHtml(words.onThisPage)}</strong><ul>${tops.map((heading) => `<li><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`).join("")}</ul></div>` : "",
    `<div${translated || lang === "en" ? "" : ` lang="en"`}>${body}</div>`,
    `<div class="docs-pager" role="navigation" aria-label="${escapeHtml(`${words.previous} / ${words.next}`)}">${near(order[at - 1], "prev")}${near(order[at + 1], "next")}</div>`,
    metaLine(model, words, { source: `${model.site.repoUrl}/blob/main/${guide.file}`, edit: `${model.site.repoUrl}/edit/main/${guide.file}` }),
  ];
  const markdown = `# ${guide.title}\n\n${guide.description}\n\n${guide.body.trim()}\n`.replace(/\]\(api:([\w.]+)\)/g, (whole, name) => { const target = referenceTarget(model, `api:${name}`); return target ? `](${model.site.docsUrl}${target.replace(/\.html$/, ".md")})` : whole; });
  return { ...page, html: frame(model, page, words, parts.filter(Boolean).join("\n          ")), markdown };
}

function changelogPage(model, lang) {
  const words = DOCS_WORDS[lang];
  const page = { lang, path: "changelog.html", title: words.changelog, description: `${words.changelog}: ${model.site.pkg.name}`, section: words.changelog };
  const file = join(model.site.root, "CHANGELOG.md");
  const text = existsSync(file) ? read(file).replace(/^# .*\n/, "") : "";
  const body = renderMarkdown(text, { resolve: (href) => (/^(https?:|mailto:|#)/.test(href) ? href : `${model.site.repoUrl}/blob/main/${href.replace(/^\.\//, "")}`) });
  const parts = [`<h1>${escapeHtml(words.changelog)}</h1>`, lang === "en" ? "" : `<p class="docs-note">${escapeHtml(words.untranslated.replace(/ガイド/, "変更履歴"))}</p>`, `<div${lang === "en" ? "" : ` lang="en"`}>${body}</div>`, metaLine(model, words, { source: `${model.site.repoUrl}/blob/main/CHANGELOG.md`, edit: `${model.site.repoUrl}/edit/main/CHANGELOG.md` })];
  return { ...page, html: frame(model, page, words, parts.filter(Boolean).join("\n          ")), markdown: `# Changelog\n\n${text.trim()}\n` };
}

function searchPage(model, lang) {
  const words = DOCS_WORDS[lang];
  const page = { lang, path: "search.html", title: words.searchTitle, description: words.searchIntro, indexed: false, script: searchScript(words) };
  const parts = [
    `<h1>${escapeHtml(words.searchTitle)}</h1>`,
    `<p>${escapeHtml(words.searchIntro)}</p>`,
    `<form id="docs-search-form" class="docs-search-big" role="search" hidden><label class="fam-sr" for="docs-q">${escapeHtml(words.searchLabel)}</label><input id="docs-q" class="fam-field" type="search" name="q" placeholder="${escapeHtml(words.searchPlaceholder)}" autocomplete="off" /><button class="fam-button" type="submit">${escapeHtml(words.search)}</button></form>`,
    `<p id="docs-noscript" class="docs-note">${escapeHtml(words.searchNoScript)}</p>`,
    `<p id="docs-status" role="status" aria-live="polite"></p>`,
    `<ol id="docs-results" class="docs-results"></ol>`,
  ];
  return { ...page, html: frame(model, page, words, parts.join("\n          ")) };
}

function homePage(model, lang) {
  const words = DOCS_WORDS[lang];
  const { site } = model;
  const page = { lang, path: "index.html", title: fill(words.homeTitle, { name: site.name }), description: site.pitch[lang], section: words.home };
  const from = pagePath(lang, page.path);
  const titleOf = (guide) => (model.guides.find((one) => one.slug === guide.slug && one.lang === lang) ?? guide);
  const card = (path, title, text) => `<li><a href="${hrefFrom(from, pagePath(lang, path))}"><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></a></li>`;
  const guideCards = (section) => model.english.filter((guide) => guide.section === section).map((guide) => card(`guides/${guide.slug}.html`, titleOf(guide).title, titleOf(guide).description)).join("");
  const parts = [
    `<p class="docs-crumbs">${escapeHtml(page.title)}</p>`,
    `<h1>${escapeHtml(site.headline)}</h1>`,
    `<p class="docs-lead">${escapeHtml(site.pitch[lang])}</p>`,
    `<h2 id="install">${escapeHtml(words.install)}</h2>`,
    `<pre><code>${escapeHtml(`npm install ${site.pkg.name}`)}</code></pre>`,
    `<h2 id="start-here">${escapeHtml(words.startHere)}</h2>`,
    `<ul class="docs-cards">${guideCards("tutorial")}</ul>`,
    `<h2 id="reference">${escapeHtml(words.entryPoints)}</h2>`,
    `<div class="fam-table-box"><table><thead><tr><th>${escapeHtml(words.importLine)}</th><th>${escapeHtml(words.summaryCol)}</th>${site.sizes ? `<th data-number="true">${escapeHtml(words.sizeCol)}</th>` : ""}</tr></thead><tbody>${model.reference.entries.map((entry) => `<tr><td><a href="${hrefFrom(from, pagePath(lang, `api/${entry.slug}/index.html`))}"><code>${escapeHtml(entry.importPath).replace(/\//g, "/<wbr>")}</code></a><br><span class="fam-muted">${escapeHtml(entry.title[lang])} · ${escapeHtml(fill(words.allExports, { n: entry.names.length }))}</span></td><td${lang === "en" ? "" : ` lang="en"`}>${docMarkdown(model, page, firstSentence(entry.doc || "")).replace(/^<p>|<\/p>\n?$/g, "")}</td>${site.sizes ? `<td data-number="true">${site.sizes.entries[entry.key] ? escapeHtml(sizeText(site.sizes.entries[entry.key].gzip)) : ""}</td>` : ""}</tr>`).join("")}</tbody></table></div>`,
    `<h2 id="guides">${escapeHtml(words.guides)}</h2>`,
    ...["how-to", "explanation", "troubleshooting", "upgrading"].map((section) => (model.english.some((guide) => guide.section === section) ? `<h3 id="${section}">${escapeHtml(words[section])}</h3><ul class="docs-cards">${guideCards(section)}</ul>` : "")),
    `<ul class="docs-cards">${card("changelog.html", words.changelog, fill(words.madeFrom, { name: site.pkg.name, version: site.pkg.version }))}${`<li><a href="${posix.relative(posix.dirname(`docs/${from}`), "api.html")}"><b>${escapeHtml(words.apiIndex)}</b><span>api.html</span></a></li>`}${`<li><a href="${posix.relative(posix.dirname(`docs/${from}`), "llms.txt")}"><b>${escapeHtml(words.llms)}</b><span>llms.txt · llms-full.txt</span></a></li>`}</ul>`,
  ];
  const markdown = [`# ${site.name} documentation`, "", site.pitch.en, "", `\`npm install ${site.pkg.name}\``, ""].join("\n");
  return { ...page, html: frame(model, page, words, parts.filter(Boolean).join("\n          ")), markdown };
}

/** api.html, the old one-page reference: every old anchor (`<entry>-<name>`) is still there, each leading to its page. */
function apiIndexPage(model) {
  const { site } = model;
  const words = DOCS_WORDS.en;
  const title = fill(words.apiTitle, { name: site.name });
  const anchor = (entry, name) => `${entry.slug}-${name}`;
  const sections = model.reference.entries.map((entry) => `<section class="api-entry" id="${anchor(entry, "")}"><h2><a href="docs/api/${entry.slug}/index.html"><code>${escapeHtml(entry.importPath)}</code></a></h2>
        ${entry.names.map((one) => { const item = model.reference.items.find((candidate) => candidate.name === one.name && (candidate.entry === entry.key || candidate.alsoIn.includes(entry.importPath))); return item ? `<article id="${anchor(entry, one.name)}"><h3><a href="docs/${item.page}"><code>${escapeHtml(one.name)}</code></a>${kindBadge(words, item.kind)}</h3>${renderMarkdown(firstSentence(item.summary), { resolve: () => null })}</article>` : ""; }).join("\n        ")}
      </section>`).join("\n      ");
  return `<!doctype html>
<html lang="en">
  <head>
    ${familyHeadFor(site, { title: `${title} · ${site.headline}`, description: words.apiIntro, ogTitle: site.headline })}
    <link rel="icon" href="${site.icon}" />
    <link rel="stylesheet" href="docs/family.css" />
    <link rel="stylesheet" href="docs/docs.css" />
  </head>
  <body>
    <a class="docs-skip" href="#content">${escapeHtml(words.skip)}</a>
    <div class="docs-page">
      <main id="content" class="docs-content" tabindex="-1">
        <p class="docs-crumbs"><a href="docs/index.html">${escapeHtml(fill(words.homeTitle, { name: site.name }))}</a></p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(words.apiIntro)}</p>
        ${sections}
      </main>
    </div>
  </body>
</html>
`;
}

/** llms.txt and llms-full.txt (llmstxt.org): the site's map, and every page as Markdown in one file. */
function llmsFiles(model, pages) {
  const { site } = model;
  const md = (path) => `${site.docsUrl}${path.replace(/\.html$/, ".md")}`;
  const guides = GUIDE_SECTIONS.flatMap((section) => model.english.filter((guide) => guide.section === section).map((guide) => `- [${guide.title}](${md(`guides/${guide.slug}.html`)}): ${guide.description}`));
  const reference = model.reference.entries.flatMap((entry) => [`- [${entry.importPath}](${md(`api/${entry.slug}/index.html`)}): ${firstSentence(entry.doc || entry.title.en)}`]);
  const short = [
    `# ${site.headline}`, "", `> ${site.pkg.description}`, "",
    `Install with \`npm install ${site.pkg.name}\`. Every page below is also an HTML page at the same address ending in .html; the documentation's home is ${site.docsUrl}. The examples on the reference pages are run when the site is built, and what they print is shown under them.`, "",
    "## Guides", "", ...guides, "", "## Reference", "", ...reference, "", "## Optional", "",
    `- [Changelog](${md("changelog.html")}): every release`, `- [Every export, in full](${site.siteUrl}llms-full.txt)`, `- [Source](${site.repoUrl})`, "",
  ].join("\n");
  const english = pages.filter((page) => page.lang === "en" && page.markdown);
  const full = [`# ${site.headline}: the whole documentation`, "", `> ${site.pkg.description}`, "", ...english.map((page) => `<!-- ${site.docsUrl}${page.path} -->\n\n${page.markdown.trim()}\n`)].join("\n");
  return { short, full };
}

// ---------------------------------------------------------------------------------------------------------------------
// 11. Building it.

/** Make the site's docs under `out` (site/ by default). Throws on any problem, any failed example, or a search index that could not be built. */
export async function buildDocsSite({ root = process.cwd(), out = join(root, "site"), log = console.log, search = true } = {}) {
  const model = modelOf(root);
  const problems = docsProblems(root, model);
  if (problems.length > 0) throw new Error(`The docs have ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n- ${problems.join("\n- ")}`);
  const outputs = await runExamples(model, { log });
  const docs = join(out, "docs");
  rmSync(docs, { recursive: true, force: true });
  mkdirSync(docs, { recursive: true });
  const familyCss = [join(out, "family.css"), join(root, "demo", "family.css")].find((path) => existsSync(path));
  if (familyCss === undefined) throw new Error("No family.css: it is demo/family.css in every package of the family");
  cpSync(familyCss, join(docs, "family.css"));
  writeFileSync(join(docs, "docs.css"), DOCS_CSS);
  const pages = [];
  for (const lang of LANGS) {
    pages.push(homePage(model, lang), searchPage(model, lang), changelogPage(model, lang));
    for (const entry of model.reference.entries) pages.push(entryPage(model, entry, lang));
    for (const item of model.reference.items) pages.push(itemPage(model, item, lang, outputs));
    for (const guide of model.english) pages.push(guidePage(model, guide, lang, outputs));
  }
  for (const page of pages) {
    const file = join(docs, pagePath(page.lang, page.path));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page.html);
    if (page.markdown && page.lang === "en") writeFileSync(file.replace(/\.html$/, ".md"), page.markdown);
  }
  writeFileSync(join(out, "api.html"), apiIndexPage(model));
  const llms = llmsFiles(model, pages);
  writeFileSync(join(out, "llms.txt"), llms.short);
  writeFileSync(join(out, "llms-full.txt"), llms.full);
  const missing = model.english.filter((guide) => !model.guides.some((one) => one.slug === guide.slug && one.lang === "ja")).map((guide) => guide.file);
  if (missing.length > 0) log(`note ${missing.length} guide${missing.length === 1 ? " has" : "s have"} no Japanese yet and show${missing.length === 1 ? "s" : ""} the English: ${missing.join(", ")}`);
  if (search) {
    const pagefind = await import("pagefind");
    const { index, errors } = await pagefind.createIndex({});
    if (errors?.length) throw new Error(`Pagefind: ${errors.join("; ")}`);
    const added = await index.addDirectory({ path: docs });
    if (added.errors?.length) throw new Error(`Pagefind: ${added.errors.join("; ")}`);
    const written = await index.writeFiles({ outputPath: join(docs, "pagefind") });
    if (written.errors?.length) throw new Error(`Pagefind: ${written.errors.join("; ")}`);
    await pagefind.close();
    log(`ok   search index: ${added.page_count} pages`);
  }
  log(`ok   ${pages.length} pages in ${toPosix(relative(root, docs))}/, api.html, llms.txt and llms-full.txt`);
  return { pages, model };
}

// The command line: build, check or size.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command = "build", ...rest] = process.argv.slice(2);
  const root = process.cwd();
  try {
    if (command === "build") await buildDocsSite({ root });
    else if (command === "check") {
      const model = modelOf(root);
      const problems = docsProblems(root, model);
      if (problems.length > 0) throw new Error(`The docs have ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n- ${problems.join("\n- ")}`);
      await runExamples(model, { log: console.log });
      console.log("ok   the docs have no problem");
    } else if (command === "size") {
      const measured = await measureBundles(root);
      for (const [key, size] of Object.entries(measured.entries)) console.log(`${key.padEnd(24)} ${String(size.minified).padStart(8)} B minified  ${sizeText(size.gzip).padStart(9)} gzipped`);
      if (rest.includes("--write")) {
        writeFileSync(join(root, "docs", "bundle-size.json"), `${JSON.stringify(measured, null, 2)}\n`);
        console.log("wrote docs/bundle-size.json; the README's badge is:");
        console.log(sizeBadge(packageOf(root), measured.entries["."]?.gzip ?? Object.values(measured.entries)[0].gzip));
      }
    } else throw new Error(`Unknown command ${command}: build, check, or size [--write]`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
