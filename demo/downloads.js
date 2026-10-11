// THE LIST DOWNLOADS the family's demos share: a table of rows as a Markdown table (for a README, an issue or a note)
// and as SQL (for a database, a demo or a test). This file is the same, byte for byte, in kuni, chizu and hata: a
// test in each (src/downloads.test.js) holds it to one hash. To change it, change it in all three at once, and record
// the new hash in each test.
//
// A column is a name, or { key, label } where the heading differs from the key in the rows. A row is a plain object;
// a missing value (undefined, null) is empty in Markdown and NULL in SQL, and a list is its items joined by a space,
// as the CSV does.

const columnKey = (column) => (typeof column === "string" ? column : column.key);
const columnLabel = (column) => (typeof column === "string" ? column : (column.label ?? column.key));

/** One value as the text a person would read: nothing for a missing one, a list's items spaced. */
const plain = (value) => (value === undefined || value === null ? "" : Array.isArray(value) ? value.join(" ") : String(value));

/** Whether a value is a number a table can right-align: a finite number, not a string that looks like one. */
const numeric = (value) => typeof value === "number" && Number.isFinite(value);

/**
 * Rows as a GitHub-flavoured Markdown table: a heading row, a rule, then a line a row. A `|` in a cell is written
 * `\|`, a backslash `\\`, and a line break `<br>`, so a cell can never end its column or its row. Number columns are
 * right-aligned.
 *
 * @example
 * toMarkdown(["code", "name"], [{ code: "JP", name: "日本 | Japan" }]);
 * // | code | name |
 * // | --- | --- |
 * // | JP | 日本 \| Japan |
 */
export function toMarkdown(columns, rows) {
  const cell = (value) => plain(value).replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r\n|\r|\n/g, "<br>");
  const line = (cells) => `| ${cells.join(" | ")} |`;
  const right = columns.map((column) => rows.length > 0 && rows.every((row) => row[columnKey(column)] === undefined || row[columnKey(column)] === null || numeric(row[columnKey(column)])) && rows.some((row) => numeric(row[columnKey(column)])));

  return `${[line(columns.map((column) => cell(columnLabel(column)))), line(right.map((aligned) => (aligned ? "---:" : "---"))), ...rows.map((row) => line(columns.map((column) => cell(row[columnKey(column)]))))].join("\n")}\n`;
}

/** A name for a table: letters, digits and underscores, so it needs no thought in any database. */
const tableName = (name) => String(name).replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "list";

/** An identifier in double quotes, with any double quote inside it doubled. */
const identifier = (name) => `"${String(name).replace(/"/g, '""')}"`;

/** The type a column's values need: INTEGER (BIGINT past 32 bits), REAL for any fraction, TEXT for anything else. */
function columnType(values) {
  const present = values.filter((value) => value !== undefined && value !== null);
  if (present.length === 0) return "TEXT";
  if (present.every((value) => typeof value === "boolean")) return "INTEGER";
  if (!present.every(numeric)) return "TEXT";
  if (!present.every(Number.isInteger)) return "REAL";

  return present.every((value) => Math.abs(value) <= 2147483647) ? "INTEGER" : "BIGINT";
}

/** One value as an SQL literal: NULL for a missing one, a bare number, or a string in single quotes with each `'` doubled. */
function literal(value, type) {
  if (value === undefined || value === null) return "NULL";
  if (type !== "TEXT") {
    if (typeof value === "boolean") return value ? "1" : "0";
    if (!Number.isFinite(value)) return "NULL";

    return String(value);
  }
  // A NUL cannot live in text in PostgreSQL, so it goes; a backslash is left alone (see the note in the file's head).
  return `'${plain(value).replace(/\0/g, "").replace(/'/g, "''")}'`;
}

/**
 * Rows as SQL: a `CREATE TABLE` and an `INSERT` a row, with double-quoted names, single-quoted text (a `'` doubled)
 * and NULL for what is missing. The types are the plain ones: INTEGER (BIGINT where a number is past 32 bits), REAL
 * and TEXT, each chosen from the column's values. It runs unchanged in SQLite and PostgreSQL; in MySQL, which reads
 * double quotes as text and a backslash as an escape unless told otherwise, run the one line its head says first.
 *
 * @example
 * toSql("countries", ["alpha2", "name"], [{ alpha2: "JP", name: "Japan's" }]);
 * // CREATE TABLE "countries" ("alpha2" TEXT, "name" TEXT);
 * // INSERT INTO "countries" ("alpha2", "name") VALUES ('JP', 'Japan''s');
 */
export function toSql(name, columns, rows) {
  const table = identifier(tableName(name));
  const keys = columns.map(columnKey);
  const types = keys.map((key) => columnType(rows.map((row) => row[key])));
  const names = keys.map((key) => identifier(key)).join(", ");
  const head = [
    `-- ${tableName(name)}: ${rows.length} row${rows.length === 1 ? "" : "s"}. Runs in SQLite, PostgreSQL and MySQL.`,
    `-- MySQL: run  SET sql_mode = 'ANSI_QUOTES,NO_BACKSLASH_ESCAPES';  first, so "names" are names and a backslash is a backslash.`,
    `CREATE TABLE ${table} (${keys.map((key, at) => `${identifier(key)} ${types[at]}`).join(", ")});`,
  ];

  return `${[...head, ...rows.map((row) => `INSERT INTO ${table} (${names}) VALUES (${keys.map((key, at) => literal(row[key], types[at])).join(", ")});`)].join("\n")}\n`;
}
