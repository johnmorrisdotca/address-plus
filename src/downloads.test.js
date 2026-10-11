// The Markdown and SQL downloads (demo/downloads.js), the same file in kuni, chizu and hata: held to one hash, the SQL
// loaded into a real database (node's own SQLite), and the Markdown read back. This test is the same in all three too.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

import { toMarkdown, toSql } from "../demo/downloads.js";

// The hash of demo/downloads.js. Change the file in kuni, chizu and hata together, then record its new hash in all three.
const DOWNLOADS_SHA256 = "6baed5d0d7fb76b07f556a394ee09aa98613537ee33b65b742d7460060b8cc0d";

const COLUMNS = [{ key: "code", label: "Code" }, "name", "note", "count", "area", "big", "borders", "flag"];
const ROWS = [
  { code: "JP", name: "東京", note: "It's a | pipe, a \"quote\", a back\\slash,\nand a second line", count: 14, area: 377.9, big: 3000000000, borders: ["KR", "RU"], flag: true },
  { code: "GB", name: "O'Brien's", note: "", count: -2, area: 242495, big: 1, borders: [], flag: false },
  { code: "XX", name: undefined, note: null, count: null, area: null, big: null, borders: undefined, flag: null },
];

/** The cells of a Markdown table's line, read back: split on every `|` a backslash does not protect, then undo the escapes. */
function cells(line) {
  const out = [""];
  const inside = line.slice(2, -2);
  for (let at = 0; at < inside.length; at += 1) {
    const char = inside[at];
    if (char === "\\") {
      out[out.length - 1] += inside.slice(at, at + 2);
      at += 1;
    } else if (char === "|") out.push("");
    else out[out.length - 1] += char;
  }

  return out.map((text, at) => text.slice(at === 0 ? 0 : 1, at === out.length - 1 ? undefined : -1).replace(/<br>/g, "\n").replace(/\\(.)/g, "$1"));
}

describe("the family's shared download writers", () => {
  it("are the same file in every package", () => {
    expect(createHash("sha256").update(readFileSync("demo/downloads.js")).digest("hex")).toBe(DOWNLOADS_SHA256);
  });

  describe("Markdown", () => {
    const lines = toMarkdown(COLUMNS, ROWS).trimEnd().split("\n");

    it("is a header, a rule and a line a row, with numbers right-aligned", () => {
      expect(lines).toHaveLength(2 + ROWS.length);
      expect(lines[0]).toBe("| Code | name | note | count | area | big | borders | flag |");
      expect(lines[1]).toBe("| --- | --- | --- | ---: | ---: | ---: | --- | --- |");
    });

    it("keeps a cell inside its column: a pipe, a backslash and a line break are escaped", () => {
      expect(lines[2]).toContain("It's a \\| pipe");
      expect(lines[2]).toContain("a back\\\\slash,<br>and a second line");
      expect(lines.every((line) => line.startsWith("| ") && line.endsWith(" |"))).toBe(true);
    });

    it("gives every cell back as it went in, 東京 and the quote and the pipe included", () => {
      const back = lines.slice(2).map(cells);
      expect(back.every((row) => row.length === COLUMNS.length)).toBe(true);
      expect(back[0]).toEqual(["JP", "東京", "It's a | pipe, a \"quote\", a back\\slash,\nand a second line", "14", "377.9", "3000000000", "KR RU", "true"]);
      expect(back[1][1]).toBe("O'Brien's");
      expect(back[2]).toEqual(["XX", "", "", "", "", "", "", ""]);
    });

    it("is only a heading and its rule for no rows", () => {
      expect(toMarkdown(["a", "b"], [])).toBe("| a | b |\n| --- | --- |\n");
    });
  });

  describe("SQL", () => {
    const sql = toSql("countries", COLUMNS, ROWS);

    it("quotes names with double quotes and text with single quotes, doubling each quote inside", () => {
      expect(sql).toContain('CREATE TABLE "countries" ("code" TEXT, "name" TEXT, "note" TEXT, "count" INTEGER, "area" REAL, "big" BIGINT, "borders" TEXT, "flag" INTEGER);');
      expect(sql).toContain("'O''Brien''s'");
      expect(sql).toContain("NULL");
      expect(sql.split("\n").filter((line) => line.startsWith("INSERT"))).toHaveLength(ROWS.length);
    });

    it("tells MySQL's user what to set first", () => {
      expect(sql).toContain("ANSI_QUOTES");
      expect(sql).toContain("NO_BACKSLASH_ESCAPES");
    });

    it("loads into SQLite with every row, and gives the values back", () => {
      const database = new DatabaseSync(":memory:");
      database.exec(sql);
      const rows = database.prepare('SELECT * FROM "countries" ORDER BY "code" DESC').all();
      expect(rows).toHaveLength(ROWS.length);
      const [jp, gb, xx] = [rows.find((row) => row.code === "JP"), rows.find((row) => row.code === "GB"), rows.find((row) => row.code === "XX")];
      expect(jp.name).toBe("東京");
      expect(jp.note).toBe(ROWS[0].note);
      expect(jp.count).toBe(14);
      expect(jp.area).toBe(377.9);
      expect(jp.big).toBe(3000000000);
      expect(jp.borders).toBe("KR RU");
      expect(jp.flag).toBe(1);
      expect(gb.name).toBe("O'Brien's");
      expect(gb.note).toBe("");
      expect(gb.flag).toBe(0);
      expect(xx.name).toBeNull();
      expect(xx.note).toBeNull();
      expect(xx.count).toBeNull();
      expect(database.prepare('SELECT COUNT(*) AS n FROM "countries" WHERE "name" = ?').get("東京").n).toBe(1);
      database.close();
    });

    it("makes a table for no rows, and a safe name from an unsafe one", () => {
      const database = new DatabaseSync(":memory:");
      database.exec(toSql("kuni — groups!", ["a", 'we"ird'], []));
      expect(database.prepare('SELECT COUNT(*) AS n FROM "kuni_groups"').get().n).toBe(0);
      expect(toSql("t", ['we"ird'], [])).toContain('"we""ird" TEXT');
      database.close();
    });

    it("keeps text that looks like a number as text, so a leading zero survives", () => {
      const database = new DatabaseSync(":memory:");
      database.exec(toSql("codes", ["numeric"], [{ numeric: "044" }, { numeric: "392" }]));
      expect(database.prepare('SELECT "numeric" AS n FROM "codes" ORDER BY "numeric"').all().map((row) => row.n)).toEqual(["044", "392"]);
      database.close();
    });
  });
});
