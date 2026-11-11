import { refreshTableExamples, tableExampleLines } from "../table-docs.ts";
// Builds the Australian and British tables in src/constants/au/ and src/constants/gb/ from three open sources:
//
//   - kuni (@johnmorrisdotca/kuni, MIT, a devDependency only): the states and territories of Australia and the four
//     nations of the United Kingdom, with their ISO 3166-2 codes and their names in English and Japanese. The few
//     rows needed are copied here, so kuni is never a dependency of the package.
//   - The Australian Bureau of Statistics' allocation of mesh blocks to Postal Areas, ASGS Edition 3 (July 2021 to
//     June 2026), POA_2021_AUST.xlsx, CC BY 4.0: which states each postcode's area lies in, so the postcodes that
//     cross a state border are known rather than guessed. A mesh block's code begins with its state's code.
//   - Ordnance Survey's Code-Point Open, Open Government Licence v3.0: every postcode in Great Britain with the nation
//     it lies in, read down to the postcode districts each area has and the nations each district lies in.
//     Northern Ireland (BT) is not in it, and is not taken from anywhere else: the ONS Postcode Directory carries it,
//     but its Northern Ireland postcodes need a licence from Land & Property Services for commercial use.
//
//   - La Poste's Base officielle des codes postaux (Licence Ouverte 2.0), every postcode of France, the overseas
//     departments and collectivities and Monaco, and INSEE's Code officiel géographique (Licence Ouverte 2.0): the
//     departments, their regions and the overseas collectivities, with their names. France's tables hold which
//     postcodes exist and which department or territory each belongs to, not the communes.
//
//   - GeoNames' postal code file for Germany (Creative Commons Attribution 4.0): every postcode it lists, with the
//     Land its places are in, and kuni's sixteen Länder with their ISO 3166-2 codes and names in English and Japanese.
//
//   - CBS (Statistics Netherlands), four-digit postcode areas 2023 through PDOK (Creative Commons Attribution 4.0), and
//     GeoNames' postal code files for Spain, Italy and New Zealand (Creative Commons Attribution 4.0), with the regions
//     from kuni: every postcode listed, and the province or region each is in.
//
// Run: node scripts/countries/update-country-data.ts [--only au,gb,fr,de,nl,es,it,nz] [--abs <POA_2021_AUST.xlsx>]
//   [--codepoint <codepo_gb folder>] [--laposte <hexasmal.csv>] [--insee <folder of v_departement_2026.csv,
//   v_region_2026.csv and v_comer_2026.csv>] [--geonames <DE.txt>] [--cbs <a file of postcodes, one a line>]
//   [--geonames-es <ES.txt>] [--geonames-it <IT.txt>] [--geonames-nz <NZ.txt>]
// Without arguments it downloads everything it needs (about 37 MB) into a temporary folder; `--only fr` makes France's
// tables alone (about 1.6 MB), `--only de` Germany's (0.4 MB). It needs `unzip` for Australia, Great Britain and Germany. Node 24 runs it as is.

import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { ABS_URL, CODEPOINT_URL, readAbs, readCodePoint, writeAustralia } from "./australia.ts";
import { writeBritain } from "./britain.ts";
import { INSEE_FILES, INSEE_URL, LAPOSTE_URL, readLaPoste, writeFrance } from "./france.ts";
import { GEONAMES_URL, readGeoNames, writeGermany } from "./germany.ts";
import {
  GEONAMES_BASE,
  PDOK_URL,
  readCbsPostcodes,
  readGeoNamesRows,
  writeItaly,
  writeNetherlands,
  writeNewZealand,
  writeSpain,
} from "./postcode-countries.ts";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};

const download = async (url: string, path: string): Promise<void> => {
  console.log(`Downloading ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
};

const COUNTRIES = ["au", "gb", "fr", "de", "nl", "es", "it", "nz"];
const only = new Set((flag("only") ?? COUNTRIES.join(",")).split(","));
const wants = (country: string): boolean => only.has(country);

type Inputs = {
  abs?: string;
  codepoint?: string;
  laposte?: string;
  insee?: string;
  geonames?: string;
  cbs?: string;
  geonamesMore: Map<string, string>;
};

// The postcodes of the Netherlands as CBS lists them, one a line, from PDOK's web feature service in pages of a thousand.
const downloadCbs = async (path: string): Promise<void> => {
  const found: string[] = [];
  for (let start = 0; ; start += 1000) {
    const url = `${PDOK_URL}&count=1000&startIndex=${start}`;
    console.log(`Downloading ${url} ...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
    const page = (await res.json()) as { features: { properties: { postcode: number } }[] };
    for (const feature of page.features) found.push(String(feature.properties.postcode));
    if (page.features.length < 1000) break;
  }
  writeFileSync(path, found.join("\n") + "\n");
};
const fetchInputs = async (): Promise<Inputs> => {
  const dir = mkdtempSync(join(tmpdir(), "address-plus-countries-"));
  const inputs: Inputs = { geonamesMore: new Map() };
  if (wants("au")) {
    inputs.abs = flag("abs");
    if (!inputs.abs) {
      inputs.abs = join(dir, "POA_2021_AUST.xlsx");
      await download(ABS_URL, inputs.abs);
    }
  }
  if (wants("gb")) {
    inputs.codepoint = flag("codepoint");
    if (!inputs.codepoint) {
      const zip = join(dir, "codepo_gb.zip");
      await download(CODEPOINT_URL, zip);
      inputs.codepoint = join(dir, "codepo_gb");
      execFileSync("unzip", ["-q", "-o", zip, "-d", inputs.codepoint]);
    }
  }
  if (wants("fr")) {
    inputs.laposte = flag("laposte");
    if (!inputs.laposte) {
      inputs.laposte = join(dir, "hexasmal.csv");
      await download(LAPOSTE_URL, inputs.laposte);
    }
    inputs.insee = flag("insee");
    if (!inputs.insee) {
      inputs.insee = join(dir, "insee");
      mkdirSync(inputs.insee);
      for (const file of INSEE_FILES) await download(`${INSEE_URL}/${file}`, join(inputs.insee, file));
    }
  }
  if (wants("de")) {
    inputs.geonames = flag("geonames");
    if (!inputs.geonames) {
      const zip = join(dir, "DE.zip");
      await download(GEONAMES_URL, zip);
      execFileSync("unzip", ["-q", "-o", zip, "DE.txt", "-d", dir]);
      inputs.geonames = join(dir, "DE.txt");
    }
  }
  if (wants("nl")) {
    inputs.cbs = flag("cbs");
    if (!inputs.cbs) {
      inputs.cbs = join(dir, "cbs-pc4.txt");
      await downloadCbs(inputs.cbs);
    }
  }
  for (const country of ["es", "it", "nz"]) {
    if (!wants(country)) continue;
    const upper = country.toUpperCase();
    let path = flag(`geonames-${country}`);
    if (!path) {
      const zip = join(dir, `${upper}.zip`);
      await download(`${GEONAMES_BASE}/${upper}.zip`, zip);
      execFileSync("unzip", ["-q", "-o", zip, `${upper}.txt`, "-d", dir]);
      path = join(dir, `${upper}.txt`);
    }
    inputs.geonamesMore.set(country, path);
  }
  return inputs;
};

// One file of an xlsx workbook as text, streamed through unzip.
export const unzipText = (archive: string, file: string): Promise<string> =>
  new Promise((done, fail) => {
    const chunks: Buffer[] = [];
    const child = spawn("unzip", ["-p", archive, file]);
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", fail);
    child.on("close", (code) =>
      code === 0 ? done(Buffer.concat(chunks).toString("utf8")) : fail(new Error(`unzip ${file}: ${code}`)),
    );
  });

export const ranked = (counts: Map<string, number>): string[] =>
  [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([key]) => key);

// An area's districts written short: the numbered ones as runs ("1-21,23-38"), then the lettered ones ("1A,1M").
export const districtRuns = (suffixes: string[]): string => {
  const numbers = suffixes
    .filter((one) => /^\d+$/.test(one))
    .map(Number)
    .sort((a, b) => a - b);
  const runs: string[] = [];
  for (let at = 0; at < numbers.length;) {
    let end = at;
    while (end + 1 < numbers.length && numbers[end + 1] === numbers[end] + 1) end += 1;
    runs.push(at === end ? `${numbers[at]}` : `${numbers[at]}-${numbers[end]}`);
    at = end + 1;
  }
  const lettered = suffixes.filter((one) => !/^\d+$/.test(one)).sort();
  return [...runs, ...lettered].join(",");
};

// A TSDoc block for an exported table, as the Japanese generator writes them; scripts/check-docs.mjs runs the example.
export const tsdoc = (summary: string, example: string, answer: string): string => {
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

export const header = (what: string, sources: string[]): string =>
  `// Generated by scripts/countries/update-country-data.ts on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand.\n` +
  `// ${what}\n${sources.map((source) => `// Source: ${source}`).join("\n")}\n\n`;

export const KUNI =
  "kuni 1.1.0 (MIT), https://www.npmjs.com/package/@johnmorrisdotca/kuni, from Unicode CLDR and Wikidata";

const main = async (): Promise<void> => {
  for (const country of only) if (!COUNTRIES.includes(country)) throw new Error(`--only: no country ${country}`);
  const { abs, codepoint, laposte, insee, geonames, cbs, geonamesMore } = await fetchInputs();
  if (abs) writeAustralia(await readAbs(resolve(abs)));
  if (codepoint) writeBritain(readCodePoint(resolve(codepoint)));
  if (laposte && insee) writeFrance(readLaPoste(resolve(laposte)), resolve(insee));
  if (geonames) writeGermany(readGeoNames(resolve(geonames)));
  if (cbs) writeNetherlands(readCbsPostcodes(resolve(cbs)));
  const more = (country: string, shape: RegExp): ReturnType<typeof readGeoNamesRows> | undefined => {
    const path = geonamesMore.get(country);
    return path ? readGeoNamesRows(resolve(path), country.toUpperCase(), shape) : undefined;
  };
  const spain = more("es", /^\d{5}$/);
  if (spain) writeSpain(spain);
  const italy = more("it", /^\d{5}$/);
  if (italy) writeItaly(italy);
  const newZealand = more("nz", /^\d{4}$/);
  if (newZealand) writeNewZealand(newZealand);
};

if (process.argv.includes("--docs-only")) {
  refreshTableExamples([
    "src/constants/au/cross-border.data.ts",
    "src/constants/au/states.data.ts",
    "src/constants/gb/districts.data.ts",
    "src/constants/gb/nations.data.ts",
    "src/constants/de/states.data.ts",
    "src/constants/es/regions.data.ts",
    "src/constants/it/regions.data.ts",
    "src/constants/nz/regions.data.ts",
    "src/constants/fr/departments.data.ts",
  ]);
} else await main();
