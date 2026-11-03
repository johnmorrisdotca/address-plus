// Runs the README's examples (`pnpm test:readme`, after a build): every fenced `ts`, `js` and `mjs` block is written to its own
// file under .readme-examples/, which imports the package by its name exactly as a reader would (the package names itself
// through its `exports`, so this is the built package in this checkout). TypeScript blocks are type-checked together with the
// compiler's own strictness and then run; JavaScript blocks are run. Flags on the fence: `no-run` type-checks and does not run
// (the block needs a browser or a server), `no-check` skips the block (an excerpt). A block that fails is named by its line in
// README.md. The examples in the TSDoc of every export are run by `pnpm docs:check` and `pnpm docs:legacy-check`.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const readme = readFileSync(join(root, "README.md"), "utf8").replace(/\r\n/g, "\n");
const work = join(root, ".readme-examples");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

// The fenced blocks of the README: the line the fence opens on, what follows the three backticks, and the body.
function fencedBlocks(text) {
  const blocks = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const open = lines[index].match(/^```(.*)$/);
    if (!open || open[1] === "") continue;
    const body = [];
    let end = index + 1;
    while (end < lines.length && !lines[end].startsWith("```")) body.push(lines[end++]);
    blocks.push({ line: index + 1, info: open[1].trim(), body: body.join("\n") });
    index = end;
  }
  return blocks;
}

const blocks = [];
for (const block of fencedBlocks(readme)) {
  const [language, ...flags] = block.info.split(/\s+/);
  if (!["ts", "js", "mjs"].includes(language) || flags.includes("no-check")) continue;
  const typescript = language === "ts";
  // A block is a module, so that its `await`s and its names are its own.
  // A block that uses require() is a CommonJS one, as the Node.js section shows.
  const extension = typescript ? "ts" : /\brequire\(/.test(block.body) ? "cjs" : "mjs";
  const file = join(work, `line-${block.line}.${extension}`);
  writeFileSync(file, extension === "cjs" ? `${block.body}\n` : `${block.body}\nexport {};\n`);
  blocks.push({ file, line: block.line, typescript, run: !flags.includes("no-run") });
}
if (!blocks.length) {
  console.error("README.md has no ts or js block to run");
  process.exit(1);
}

let failed = 0;
const typed = blocks.filter((block) => block.typescript);
if (typed.length) {
  writeFileSync(
    join(work, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "es2023"],
        module: "esnext",
        moduleResolution: "bundler",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: [],
      },
      include: typed.map((block) => block.file.slice(work.length + 1)),
    }),
  );
  const checked = spawnSync(
    process.execPath,
    [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", join(work, "tsconfig.json")],
    { cwd: root, encoding: "utf8" },
  );
  if (checked.status !== 0) {
    failed += 1;
    const lineOf = (text) =>
      text.replace(
        /\.readme-examples\/line-(\d+)\.ts\((\d+),(\d+)\)/g,
        (_, block, row, column) => `README.md:${Number(block) + Number(row)}:${column} (block at line ${block})`,
      );
    console.error(`FAIL type check of the README's TypeScript blocks:\n${lineOf(checked.stdout + checked.stderr)}`);
  } else console.log(`ok   ${typed.length} TypeScript block${typed.length === 1 ? "" : "s"} type-check`);
}
for (const block of blocks) {
  if (!block.run) continue;
  // TypeScript is run by Node, which strips the types.
  const ran = spawnSync(process.execPath, [block.file], { cwd: root, encoding: "utf8", timeout: 60_000 });
  if (ran.status !== 0) {
    failed += 1;
    console.error(
      `FAIL README.md line ${block.line}: the block did not run\n${(ran.stderr || ran.stdout).trim().split("\n").slice(0, 12).join("\n")}`,
    );
  } else {
    const printed = ran.stdout.trim();
    console.log(
      `ok   README.md line ${block.line} ran${printed ? `: ${printed.split("\n").slice(0, 4).join(" | ").slice(0, 110)}` : ""}`,
    );
  }
}
rmSync(work, { recursive: true, force: true });
if (failed) {
  console.error(`${failed} of the README's examples failed`);
  process.exit(1);
}
console.log(`all ${blocks.length} of ${pkg.name}'s README examples hold`);
