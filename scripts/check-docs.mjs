// The docs check, run by `pnpm docs:legacy-check` after the build: every export of every entry point has a TSDoc block
// with a summary and an @example, a function has an @param for each parameter and an @returns unless it returns
// nothing, the block reaches the published type definitions (so an editor shows it on hover), and every example
// gives, when run against the built package, the answer written under it.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { apiOf, exampleScope, shown } from "./api.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const api = apiOf();

// The source: the comment, the tags and the examples.
const run = await exampleScope();
const checked = new Set();
for (const entry of api) {
  for (const one of entry.exports) {
    const where = `${entry.name}: ${one.name}`;
    if (one.doc === "") problems.push(`${where} has no TSDoc summary`);
    if (!one.example) {
      problems.push(`${where} has no @example`);
      continue;
    }
    const documented = new Set(one.params.map((param) => param.name));
    for (const name of one.parameterNames) {
      if (!documented.has(name)) problems.push(`${where} has no @param for ${name}`);
    }
    if (!one.returnsVoid && !one.returns && one.parameterNames.length + one.params.length > 0) {
      problems.push(`${where} has no @returns`);
    }
    if (checked.has(one.name)) continue;
    checked.add(one.name);
    if (one.example.answer === undefined) {
      problems.push(`${where}: its @example has no "// → answer" line`);
      continue;
    }
    try {
      const answer = shown(run(one.example.code));
      if (answer !== one.example.answer) {
        problems.push(`${where}: its @example gives ${answer}, but the TSDoc says ${one.example.answer}`);
      }
    } catch (error) {
      problems.push(`${where}: its @example throws ${error.message}`);
    }
  }
}

// The published type definitions: the same exports, each with its comment and its example.
const typings = [
  "dist/index.d.ts",
  "dist/jp/index.d.ts",
  "dist/au/index.d.ts",
  "dist/gb/index.d.ts",
  "dist/fr/index.d.ts",
  "dist/de/index.d.ts",
].map((file) => join(root, file));
if (typings.some((file) => !existsSync(file))) {
  problems.push("dist/*.d.ts is missing: run pnpm build first");
} else {
  const program = ts.createProgram(typings, { noEmit: true, skipLibCheck: true });
  const checker = program.getTypeChecker();
  for (const file of typings) {
    const module = checker.getSymbolAtLocation(program.getSourceFile(file));
    for (const symbol of checker.getExportsOfModule(module)) {
      const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
      const comment = ts.displayPartsToString(target.getDocumentationComment(checker)).trim();
      const example = target.getJsDocTags(checker).some((tag) => tag.name === "example");
      const where = `${file.replace(`${root}/`, "")}: ${symbol.name}`;
      if (comment === "") problems.push(`${where} lost its TSDoc in the build`);
      else if (!example) problems.push(`${where} lost its @example in the build`);
    }
  }
}

if (problems.length > 0) {
  console.error(
    `The docs check found ${problems.length} problem(s):\n${problems.map((line) => `  ${line}`).join("\n")}`,
  );
  process.exit(1);
}
const total = api.reduce((sum, entry) => sum + entry.exports.length, 0);
console.log(`The docs check passed: ${total} exports, each with TSDoc and an example that gives the answer it shows.`);
