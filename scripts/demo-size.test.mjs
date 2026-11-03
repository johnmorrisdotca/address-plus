// The demo's scripts are held to the same size as the package's source: at most 500 lines of code each, blank lines and
// comments not counted. scripts/check-size.mjs, the family's gate, reads src/ only, so this test reads demo/.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MAX_CODE_LINES = 500;

/** The lines of a script that are code: not blank, not a // comment, not inside a block comment. */
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

describe("the demo's scripts", () => {
  it(`hold at most ${MAX_CODE_LINES} lines of code each`, () => {
    const over = readdirSync("demo")
      .filter((name) => name.endsWith(".js"))
      .map((name) => ({ name, lines: codeLines(readFileSync(`demo/${name}`, "utf8")) }))
      .filter((file) => file.lines > MAX_CODE_LINES);
    expect(over, "split each by what it does").toEqual([]);
  });
});
