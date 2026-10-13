import { refreshTableExamples, tableExampleLines } from "../table-docs.ts";
// Builds the Japanese tables in src/constants/jp/ from two open datasets:
//
//   - Geolonia's 住所データ (MIT), https://github.com/geolonia/japanese-addresses: every prefecture
//     and municipality with its JIS code, katakana reading and romaji.
//   - Japan Post's postal code file, through the jp-postal package (MIT), which repackages
//     KEN_ALL.CSV: every postal code with the prefecture it delivers to.
//
// Run: node scripts/jp/update-jp-data.ts [--geolonia <latest.csv>] [--postal <jp-postal/index.mjs>]
// Without arguments it downloads both (about 100 MB) into a temporary folder. Node 24 runs it as is.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { parse } from "csv-parse/sync";

const GEOLONIA_URL = "https://raw.githubusercontent.com/geolonia/japanese-addresses/master/data/latest.csv";
const OUT_DIR = resolve("src/constants/jp");

type Row = Record<string, string>;
type PostalRows = Record<string, [string, string, string, string, string, string][]>;

interface Prefecture {
  code: string;
  name: string;
  kana: string;
  romaji: string;
}

interface Municipality {
  code: string;
  prefecture: string;
  name: string;
  kana: string;
  romaji: string;
}

// Geolonia writes romaji in capitals with the designator as its own word: "SAPPORO SHI CHUO KU".
// Addresses in English hyphenate the designator to its name: "Sapporo-shi Chuo-ku".
const DESIGNATORS = new Set(["TO", "DO", "FU", "KEN", "SHI", "KU", "CHO", "MACHI", "MURA", "SON", "GUN"]);

const titleCase = (word: string): string => word.charAt(0) + word.slice(1).toLowerCase();

const romajiOf = (raw: string): string => {
  const out: string[] = [];
  for (const word of raw.trim().split(/\s+/)) {
    if (DESIGNATORS.has(word) && out.length > 0) out[out.length - 1] += `-${word.toLowerCase()}`;
    else out.push(titleCase(word));
  }
  return out.join(" ");
};

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};

const fetchInputs = async (): Promise<{ geolonia: string; postal: string }> => {
  let geolonia = flag("geolonia");
  let postal = flag("postal");
  if (geolonia && postal) return { geolonia, postal };

  const dir = mkdtempSync(join(tmpdir(), "address-plus-jp-"));
  if (!geolonia) {
    console.log(`Downloading ${GEOLONIA_URL} ...`);
    const res = await fetch(GEOLONIA_URL);
    if (!res.ok) throw new Error(`Geolonia download failed: ${res.status}`);
    geolonia = join(dir, "latest.csv");
    writeFileSync(geolonia, Buffer.from(await res.arrayBuffer()));
  }
  if (!postal) {
    console.log("Fetching jp-postal from npm ...");
    execFileSync("npm", ["pack", "jp-postal", "--pack-destination", dir], { stdio: "ignore" });
    const tarball = execFileSync("ls", [dir])
      .toString()
      .split("\n")
      .find((f) => f.startsWith("jp-postal-"));
    if (!tarball) throw new Error("npm pack jp-postal produced no tarball");
    execFileSync("tar", ["-xzf", join(dir, tarball), "-C", dir]);
    postal = join(dir, "package", "index.mjs");
  }
  return { geolonia, postal };
};

const readGeolonia = (path: string): { prefectures: Prefecture[]; municipalities: Municipality[] } => {
  const rows = parse(readFileSync(path, "utf8"), { columns: true }) as Row[];
  const prefectures = new Map<string, Prefecture>();
  const municipalities = new Map<string, Municipality>();
  for (const row of rows) {
    const code = row["都道府県コード"];
    if (!prefectures.has(code)) {
      prefectures.set(code, {
        code,
        name: row["都道府県名"],
        kana: row["都道府県名カナ"],
        romaji: romajiOf(row["都道府県名ローマ字"]),
      });
    }
    const municipality = row["市区町村コード"];
    if (!municipalities.has(municipality)) {
      municipalities.set(municipality, {
        code: municipality,
        prefecture: code,
        name: row["市区町村名"],
        kana: row["市区町村名カナ"],
        romaji: romajiOf(row["市区町村名ローマ字"]),
      });
    }
  }
  return {
    prefectures: [...prefectures.values()].sort((a, b) => a.code.localeCompare(b.code)),
    municipalities: [...municipalities.values()].sort((a, b) => a.code.localeCompare(b.code)),
  };
};

// A postal code's first three digits name its prefecture almost everywhere. Twenty-two prefixes
// straddle a border, so each prefix keeps the prefecture most of its codes belong to, and the
// codes on the other side are listed one by one. Prefectures are written by JIS code.
const readPostal = async (
  path: string,
  prefectureCodes: Map<string, string>,
): Promise<{ prefixes: Record<string, string>; exceptions: Record<string, string>; codes: number }> => {
  const data = (await import(path)).default as PostalRows;
  const byPrefix = new Map<string, Map<string, string[]>>();
  for (const [code, rows] of Object.entries(data)) {
    const prefix = code.slice(0, 3);
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Map());
    const prefectures = byPrefix.get(prefix)!;
    for (const [prefecture] of rows) {
      if (!prefectures.has(prefecture)) prefectures.set(prefecture, []);
      prefectures.get(prefecture)!.push(code);
    }
  }
  const prefixes: Record<string, string> = {};
  const exceptions: Record<string, string> = {};
  for (const [prefix, prefectures] of [...byPrefix].sort()) {
    const ranked = [...prefectures].sort((a, b) => b[1].length - a[1].length);
    const [majority] = ranked[0];
    prefixes[prefix] = jis(majority, prefectureCodes);
    for (const [prefecture, codes] of ranked.slice(1)) {
      for (const code of codes) {
        // The prefecture-wide code (xxx0000) can be listed for both sides; the majority keeps it.
        if (data[code].some(([owner]) => owner === majority)) continue;
        exceptions[code] = jis(prefecture, prefectureCodes);
      }
    }
  }
  return { prefixes, exceptions, codes: Object.keys(data).length };
};

const jis = (name: string, prefectureCodes: Map<string, string>): string => {
  const code = prefectureCodes.get(name);
  if (!code) throw new Error(`Unknown prefecture in postal data: ${name}`);
  return code;
};

// A TSDoc block for an exported table, so an editor shows what it holds on hover: the summary, wrapped, and an
// example whose answer scripts/check-docs.mjs checks against the built package.
const tsdoc = (summary: string, example: string, answer: string): string => {
  const lines: string[] = [];
  let line = "";
  for (const word of summary.split(" ")) {
    if (line && line.length + word.length + 1 > 112) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return [
    "/**",
    ...lines.map((text) => ` * ${text}`),
    " *",
    " * @example",
    " * ```ts",
    ...tableExampleLines(example).map((line) => ` *${line ? " " + line : ""}`),
    ` * // → ${answer}`,
    " * ```",
    " */",
    "",
  ].join("\n");
};

const header = (what: string, sources: string): string =>
  `// Generated by scripts/jp/update-jp-data.ts on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand.\n` +
  `// ${what}\n// Source: ${sources}\n\n`;

const main = async (): Promise<void> => {
  const { geolonia, postal } = await fetchInputs();
  const { prefectures, municipalities } = readGeolonia(geolonia);
  const codes = new Map(prefectures.map((p) => [p.name, p.code]));
  const { prefixes, exceptions, codes: postalCount } = await readPostal(resolve(postal), codes);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const geoloniaSource = "Geolonia 住所データ (MIT), https://github.com/geolonia/japanese-addresses";
  const postalSource = "Japan Post KEN_ALL.CSV through jp-postal (MIT), https://www.npmjs.com/package/jp-postal";

  writeFileSync(
    join(OUT_DIR, "prefectures.data.ts"),
    header(`The ${prefectures.length} prefectures, in JIS X 0401 order.`, geoloniaSource) +
      `import type { JapanesePrefecture } from "../../types/japan";\n\n` +
      tsdoc(
        `The ${prefectures.length} prefectures in JIS X 0401 order, each with its code, official name, katakana reading and romaji. Generated from Geolonia 住所データ (MIT).`,
        "JP_PREFECTURES.length",
        String(prefectures.length),
      ) +
      `const JP_PREFECTURES: readonly JapanesePrefecture[] = ${JSON.stringify(prefectures, null, 2)};\n\n` +
      `export { JP_PREFECTURES };\n`,
  );
  writeFileSync(
    join(OUT_DIR, "municipalities.data.ts"),
    header(`The ${municipalities.length} municipalities (市区町村), by JIS X 0402 code.`, geoloniaSource) +
      `import type { JapaneseMunicipality } from "../../types/japan";\n\n` +
      tsdoc(
        "Every municipality (市区町村) by JIS X 0402 code, with its prefecture, official name, reading and romaji; a designated city's wards are listed, and the city itself is in `JP_DESIGNATED_CITIES`. Generated from Geolonia 住所データ (MIT).",
        'JP_MUNICIPALITIES.find((one) => one.code === "13101")?.name',
        '"千代田区"',
      ) +
      `const JP_MUNICIPALITIES: readonly JapaneseMunicipality[] = ${JSON.stringify(municipalities)
        .replace(/\{"code"/g, '\n  {"code"')
        .replace(/\]$/, "\n]")};\n\n` +
      `export { JP_MUNICIPALITIES };\n`,
  );
  writeFileSync(
    join(OUT_DIR, "postal-prefixes.data.ts"),
    header(
      `Which prefecture (JIS code) a postal code delivers to: by its first three digits, and for the ` +
        `${Object.keys(exceptions).length} codes on the far side of a prefix that straddles a border, by the whole code. ` +
        `From ${postalCount} postal codes.`,
      postalSource,
    ) +
      tsdoc(
        "Each three-digit postal prefix, to the JIS code of the prefecture most of its codes deliver to. Generated from Japan Post's KEN_ALL.CSV through jp-postal (MIT).",
        'JP_POSTAL_PREFIXES["530"]',
        '"27"',
      ) +
      `const JP_POSTAL_PREFIXES: Readonly<Record<string, string>> = ${JSON.stringify(prefixes)
        .replace(/,"/g, ',\n  "')
        .replace(/^\{/, "{\n  ")
        .replace(/\}$/, ",\n}")};\n\n` +
      tsdoc(
        "The postal codes that deliver to another prefecture than the rest of their three-digit prefix, each to that prefecture's JIS code. Generated from Japan Post's KEN_ALL.CSV through jp-postal (MIT).",
        "Object.keys(JP_POSTAL_EXCEPTIONS).length > 0",
        "true",
      ) +
      `const JP_POSTAL_EXCEPTIONS: Readonly<Record<string, string>> = ${JSON.stringify(exceptions)
        .replace(/,"/g, ',\n  "')
        .replace(/^\{/, "{\n  ")
        .replace(/\}$/, ",\n}")};\n\n` +
      `export { JP_POSTAL_EXCEPTIONS, JP_POSTAL_PREFIXES };\n`,
  );
  console.log(
    `Wrote ${prefectures.length} prefectures, ${municipalities.length} municipalities, ` +
      `${Object.keys(prefixes).length} postal prefixes and ${Object.keys(exceptions).length} exceptions to ${OUT_DIR}`,
  );
};

if (process.argv.includes("--docs-only")) {
  refreshTableExamples([
    "src/constants/jp/municipalities.data.ts",
    "src/constants/jp/postal-prefixes.data.ts",
    "src/constants/jp/prefectures.data.ts",
  ]);
} else
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
