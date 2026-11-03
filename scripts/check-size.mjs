// check-size.mjs: no source file holds more than 500 lines of code. One file copied unchanged into every package of the
// family. Blank lines and comments are not counted, so documentation never pushes a file over; tests and data files
// (*.data.ts) are not counted at all, because a long table split in two is two tables to keep in step.
//
//   node scripts/check-size.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CODE_LINES = 500;

/** The lines of a JavaScript or TypeScript source that are code: not blank, not inside a comment. */
function codeLines(source) {
  let inBlock = false;
  let count = 0;
  for (const raw of source.split(/\r?\n/)) {
    let line = raw.trim();
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      inBlock = false;
      line = line.slice(end + 2).trim();
    }
    if (line.startsWith("/*")) {
      const end = line.indexOf("*/", 2);
      if (end === -1) {
        inBlock = true;
        continue;
      }
      line = line.slice(end + 2).trim();
    }
    if (line !== "" && !line.startsWith("//")) count++;
  }
  return count;
}

const counted = (name) =>
  /\.(ts|tsx|js|mjs)$/.test(name) && !/\.(test|spec|data)\./.test(name) && !name.endsWith(".d.ts");

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return counted(entry.name) ? [path] : [];
  });
}

const over = sources("src")
  .map((path) => ({ path, lines: codeLines(readFileSync(path, "utf8")) }))
  .filter((file) => file.lines > MAX_CODE_LINES)
  .sort((a, b) => b.lines - a.lines);
if (over.length > 0) {
  console.error(
    `${over.length} source files hold more than ${MAX_CODE_LINES} lines of code; split each by what it does:`,
  );
  for (const file of over) console.error(`  ${file.path}: ${file.lines}`);
  process.exit(1);
}
console.log(`Every source file holds at most ${MAX_CODE_LINES} lines of code.`);
