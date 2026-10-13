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
// Run: node scripts/countries/update-country-data.ts [--only au,gb,fr,de] [--abs <POA_2021_AUST.xlsx>]
//   [--codepoint <codepo_gb folder>] [--laposte <hexasmal.csv>] [--insee <folder of v_departement_2026.csv,
//   v_region_2026.csv and v_comer_2026.csv>] [--geonames <DE.txt>]
// Without arguments it downloads everything it needs (about 37 MB) into a temporary folder; `--only fr` makes France's
// tables alone (about 1.6 MB), `--only de` Germany's (0.4 MB). It needs `unzip` for Australia, Great Britain and Germany. Node 24 runs it as is.

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import australianStates from "@johnmorrisdotca/kuni/subdivisions/au";
import germanStates from "@johnmorrisdotca/kuni/subdivisions/de";
import britishSubdivisions from "@johnmorrisdotca/kuni/subdivisions/gb";

const ABS_URL =
  "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/allocation-files/POA_2021_AUST.xlsx";
const CODEPOINT_URL = "https://api.os.uk/downloads/v1/products/CodePointOpen/downloads?area=GB&format=CSV&redirect";
const AU_DIR = resolve("src/constants/au");
const GB_DIR = resolve("src/constants/gb");
const FR_DIR = resolve("src/constants/fr");
const DE_DIR = resolve("src/constants/de");
const GEONAMES_URL = "https://download.geonames.org/export/zip/DE.zip";
const LAPOSTE_URL = "https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw";
const INSEE_URL = "https://www.insee.fr/fr/statistiques/fichier/8740222";
const INSEE_FILES = ["v_departement_2026.csv", "v_region_2026.csv", "v_comer_2026.csv"];

// The first digit of a mesh block's code is its state's code in the ABS's own numbering. 9 is the Other Territories
// (Jervis Bay, Christmas Island, the Cocos (Keeling) Islands, Norfolk Island); Z is outside Australia.
const ABS_STATES: Readonly<Record<string, string>> = {
  "1": "NSW",
  "2": "VIC",
  "3": "QLD",
  "4": "SA",
  "5": "WA",
  "6": "TAS",
  "7": "NT",
  "8": "ACT",
  "9": "OT",
};
// The ABS's own codes that are not postcodes: 9494 is "no usual address" and 9797 "migratory, offshore and shipping".
const ABS_NOT_POSTCODES = new Set(["9494", "9797"]);
// Code-Point Open's nation codes (ONS GSS codes for England, Scotland and Wales).
const GSS_NATIONS: Readonly<Record<string, string>> = { E92000001: "ENG", S92000003: "SCT", W92000004: "WLS" };

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

const only = new Set((flag("only") ?? "au,gb,fr,de").split(","));
const wants = (country: string): boolean => only.has(country);

type Inputs = { abs?: string; codepoint?: string; laposte?: string; insee?: string; geonames?: string };
const fetchInputs = async (): Promise<Inputs> => {
  const dir = mkdtempSync(join(tmpdir(), "address-plus-countries-"));
  const inputs: Inputs = {};
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
  return inputs;
};

// One file of an xlsx workbook as text, streamed through unzip.
const unzipText = (archive: string, file: string): Promise<string> =>
  new Promise((done, fail) => {
    const chunks: Buffer[] = [];
    const child = spawn("unzip", ["-p", archive, file]);
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", fail);
    child.on("close", (code) =>
      code === 0 ? done(Buffer.concat(chunks).toString("utf8")) : fail(new Error(`unzip ${file}: ${code}`)),
    );
  });

const SHARED_STRING = /<si>(?:<t[^>]*>([^<]*)<\/t>|[\s\S]*?)<\/si>/g;
const ROW = /<row[^>]*>([\s\S]*?)<\/row>/g;
const CELL = /<c r="([A-Z]+)\d+"(?:[^>]*?t="(\w+)")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t>([^<]*)<\/t><\/is>)?<\/c>/g;

// The first two columns of the sheet, mesh block and postal area, row by row: postcode -> state -> mesh blocks.
const readAbs = async (path: string): Promise<Map<string, Map<string, number>>> => {
  const strings: string[] = [];
  for (const match of (await unzipText(path, "xl/sharedStrings.xml")).matchAll(SHARED_STRING)) {
    strings.push(match[1] ?? "");
  }
  const sheet = await unzipText(path, "xl/worksheets/sheet1.xml");
  const postcodes = new Map<string, Map<string, number>>();
  let header = true;
  for (const row of sheet.matchAll(ROW)) {
    const cells: Record<string, string> = {};
    for (const cell of row[1].matchAll(CELL)) {
      const [, column, kind, value, inline] = cell;
      cells[column] = kind === "s" ? strings[Number(value)] : (inline ?? value ?? "");
    }
    if (header) {
      if (cells.A !== "MB_CODE_2021" || cells.B !== "POA_CODE_2021") throw new Error("Unexpected ABS columns");
      header = false;
      continue;
    }
    const [meshBlock, postcode] = [cells.A, cells.B];
    if (!/^\d{4}$/.test(postcode ?? "") || ABS_NOT_POSTCODES.has(postcode)) continue;
    const state = ABS_STATES[meshBlock.charAt(0)];
    if (!state) continue;
    if (!postcodes.has(postcode)) postcodes.set(postcode, new Map());
    const states = postcodes.get(postcode)!;
    states.set(state, (states.get(state) ?? 0) + 1);
  }
  return postcodes;
};

// Every outward code in Code-Point Open with the nations its postcodes lie in, and how many in each.
const readCodePoint = (folder: string): Map<string, Map<string, number>> => {
  const csv = join(folder, "Data", "CSV");
  const districts = new Map<string, Map<string, number>>();
  for (const file of readdirSync(csv).filter((name) => name.endsWith(".csv"))) {
    for (const line of readFileSync(join(csv, file), "utf8").split("\n")) {
      if (line === "") continue;
      const cells = line.split(",").map((cell) => cell.replace(/"/g, ""));
      const postcode = cells[0];
      const nation = GSS_NATIONS[cells[4]];
      if (!nation) throw new Error(`Unknown nation ${cells[4]} for ${postcode}`);
      const outward = postcode.slice(0, -3).trim();
      if (!districts.has(outward)) districts.set(outward, new Map());
      const nations = districts.get(outward)!;
      nations.set(nation, (nations.get(nation) ?? 0) + 1);
    }
  }
  return districts;
};

const ranked = (counts: Map<string, number>): string[] =>
  [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([key]) => key);

// An area's districts written short: the numbered ones as runs ("1-21,23-38"), then the lettered ones ("1A,1M").
const districtRuns = (suffixes: string[]): string => {
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

const header = (what: string, sources: string[]): string =>
  `// Generated by scripts/countries/update-country-data.ts on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand.\n` +
  `// ${what}\n${sources.map((source) => `// Source: ${source}`).join("\n")}\n\n`;

const KUNI = "kuni 1.1.0 (MIT), https://www.npmjs.com/package/@johnmorrisdotca/kuni, from Unicode CLDR and Wikidata";

const writeAustralia = (postcodes: Map<string, Map<string, number>>): void => {
  if (!existsSync(AU_DIR)) mkdirSync(AU_DIR, { recursive: true });
  const states = australianStates
    .map((one) => ({
      code: one.shortCode,
      iso: one.code,
      name: one.name.en,
      nameJa: one.name.ja,
      kind: one.type === "territory" ? "territory" : "state",
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
  if (states.length !== 8) throw new Error(`kuni gave ${states.length} Australian states, not 8`);
  writeFileSync(
    join(AU_DIR, "states.data.ts"),
    header("The eight states and territories, by the code Australia Post writes.", [KUNI]) +
      `import type { AustralianState } from "../../types/australia";\n\n` +
      tsdoc(
        "The six states and two territories of Australia, in order of their codes, each with Australia Post's code, the ISO 3166-2 code and its name in English and in Japanese. Copied from kuni when the tables are made.",
        "AU_STATES.map((state) => state.code)",
        `["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"]`,
      ) +
      `const AU_STATES: readonly AustralianState[] = ${JSON.stringify(states, null, 2)};\n\nexport { AU_STATES };\n`,
  );

  // A postcode whose area lies in more than one state, or in a state other than its block's, and the postcodes of the
  // external territories, which no state's block names.
  const crossing: Record<string, string[]> = {};
  const territories: string[] = [];
  for (const [postcode, counts] of [...postcodes].sort()) {
    const inStates = ranked(counts).filter((state) => state !== "OT");
    if (counts.has("OT")) territories.push(postcode);
    if (inStates.length > 1) crossing[postcode] = inStates;
  }
  writeFileSync(
    join(AU_DIR, "cross-border.data.ts"),
    header("Postcodes that cross a state border, and those of the external territories, from the ABS's Postal Areas.", [
      "Australian Bureau of Statistics, Australian Statistical Geography Standard (ASGS) Edition 3, July 2021 - June 2026, Postal Areas allocation file POA_2021_AUST.xlsx (CC BY 4.0)",
    ]) +
      `import type { AustralianStateCode } from "../../types/australia";\n\n` +
      tsdoc(
        "The postcodes whose area lies in more than one state or territory, each with the states it lies in, the one with most of it first. Read from the Australian Bureau of Statistics' Postal Areas (ASGS Edition 3, CC BY 4.0), which approximate Australia Post's postcodes by mesh blocks, so a state with a sliver of a postcode's area is listed too. An address naming any of these states passes the postcode check.",
        `AU_CROSS_BORDER_POSTCODES["2620"]`,
        `["NSW","ACT"]`,
      ) +
      `const AU_CROSS_BORDER_POSTCODES: Readonly<Record<string, readonly AustralianStateCode[]>> = ${JSON.stringify(crossing, null, 2)};\n\n` +
      tsdoc(
        "The postcodes the Australian Bureau of Statistics places, wholly or partly, in the Other Territories: Jervis Bay, Norfolk Island, Christmas Island and the Cocos (Keeling) Islands. Which state's code Australia Post writes beside each is not in the open data, so the validator does not judge the state given with one.",
        "AU_EXTERNAL_TERRITORY_POSTCODES",
        JSON.stringify(territories),
      ) +
      `const AU_EXTERNAL_TERRITORY_POSTCODES: readonly string[] = ${JSON.stringify(territories)};\n\nexport { AU_CROSS_BORDER_POSTCODES, AU_EXTERNAL_TERRITORY_POSTCODES };\n`,
  );
  console.log(
    `Australia: ${states.length} states, ${postcodes.size} postal areas, ${Object.keys(crossing).length} crossing a border, ${territories.length} in the external territories.`,
  );
};

const writeBritain = (districts: Map<string, Map<string, number>>): void => {
  if (!existsSync(GB_DIR)) mkdirSync(GB_DIR, { recursive: true });
  const nations = britishSubdivisions
    .filter((one) => one.type === "country")
    .map((one) => ({ code: one.shortCode, iso: one.code, name: one.name.en, nameJa: one.name.ja }))
    .sort((a, b) => a.code.localeCompare(b.code));
  if (nations.length !== 4) throw new Error(`kuni gave ${nations.length} British nations, not 4`);
  writeFileSync(
    join(GB_DIR, "nations.data.ts"),
    header("The four nations of the United Kingdom.", [KUNI]) +
      `import type { UKNation } from "../../types/united-kingdom";\n\n` +
      tsdoc(
        "The four nations of the United Kingdom, in order of their codes, each with its ISO 3166-2 code and its name in English and in Japanese. Copied from kuni when the tables are made.",
        "GB_NATIONS.map((nation) => nation.name)",
        `["England","Northern Ireland","Scotland","Wales"]`,
      ) +
      `const GB_NATIONS: readonly UKNation[] = ${JSON.stringify(nations, null, 2)};\n\nexport { GB_NATIONS };\n`,
  );

  const byArea = new Map<string, { suffixes: string[]; nations: Map<string, number> }>();
  for (const [outward, counts] of [...districts].sort()) {
    const [, area, suffix] = /^([A-Z]+)(.+)$/.exec(outward)!;
    if (!byArea.has(area)) byArea.set(area, { suffixes: [], nations: new Map() });
    const entry = byArea.get(area)!;
    entry.suffixes.push(suffix);
    for (const [nation, count] of counts) entry.nations.set(nation, (entry.nations.get(nation) ?? 0) + count);
  }
  const runs = Object.fromEntries([...byArea].map(([area, entry]) => [area, districtRuns(entry.suffixes)]));
  const areaNations = Object.fromEntries([...byArea].map(([area, entry]) => [area, ranked(entry.nations)[0]]));
  // The districts not wholly in their area's nation: those that cross a border, and those wholly on the other side of
  // it (CH5 to CH8 are in Wales, though most of the CH area is in England).
  const exceptions: Record<string, string[]> = {};
  for (const [outward, counts] of [...districts].sort()) {
    const area = /^[A-Z]+/.exec(outward)![0];
    const nations = ranked(counts);
    if (nations.length > 1 || nations[0] !== areaNations[area]) exceptions[outward] = nations;
  }
  const codePoint =
    "Ordnance Survey Code-Point Open (Open Government Licence v3.0). Contains OS data © Crown copyright and database right 2026. Contains Royal Mail data © Royal Mail copyright and database right 2026. Contains National Statistics data © Crown copyright and database right 2026.";
  writeFileSync(
    join(GB_DIR, "districts.data.ts"),
    header("The postcode districts of Great Britain and the nations they lie in, from Code-Point Open.", [codePoint]) +
      `import type { UKNationCode } from "../../types/united-kingdom";\n\n` +
      tsdoc(
        "Every postcode district in Great Britain, by area: the numbered districts as runs, then those with a letter. Read from Ordnance Survey's Code-Point Open (OGL v3; contains Royal Mail data © Royal Mail copyright and database right). Northern Ireland's BT area is not in it, so its districts are not listed.",
        `GB_POSTCODE_DISTRICTS["EC"]`,
        JSON.stringify(runs.EC),
      ) +
      `const GB_POSTCODE_DISTRICTS: Readonly<Record<string, string>> = ${JSON.stringify(runs, null, 2)};\n\n` +
      tsdoc(
        "The nation each postcode area of Great Britain delivers to, by the most of its postcodes. The districts that cross a border are listed in GB_CROSS_BORDER_DISTRICTS. From Code-Point Open (OGL v3).",
        `GB_AREA_NATIONS["CF"]`,
        `"WLS"`,
      ) +
      `const GB_AREA_NATIONS: Readonly<Record<string, UKNationCode>> = ${JSON.stringify(areaNations, null, 2)};\n\n` +
      tsdoc(
        "The postcode districts not wholly in the nation of their area, each with the nations its postcodes lie in, the one with most of them first: the districts that cross the borders of Wales and of Scotland, and those wholly across one (CH5 to CH8 are in Wales, though most of the CH area is in England). From Code-Point Open (OGL v3).",
        `[GB_DISTRICT_NATIONS["TD15"], GB_DISTRICT_NATIONS["CH5"]]`,
        `[["ENG","SCT"],["WLS"]]`,
      ) +
      `const GB_DISTRICT_NATIONS: Readonly<Record<string, readonly UKNationCode[]>> = ${JSON.stringify(exceptions, null, 2)};\n\n` +
      `export { GB_AREA_NATIONS, GB_DISTRICT_NATIONS, GB_POSTCODE_DISTRICTS };\n`,
  );
  console.log(
    `Great Britain: ${byArea.size} areas, ${districts.size} districts, ${Object.keys(exceptions).length} not wholly in their area's nation.`,
  );
};

// ---- France ----------------------------------------------------------------------------------------------------

// What each of the overseas collectivities is called in ISO 3166-1, where La Poste's base has postcodes for it. They
// are French, but each has a country code of its own, and the Universal Postal Union lists them apart; the
// departments overseas (971 to 974 and 976) are French regions and keep France's code.
const FR_COLLECTIVITY_COUNTRIES: Readonly<Record<string, string>> = {
  "975": "PM",
  "977": "BL",
  "978": "MF",
  "986": "WF",
  "987": "PF",
  "988": "NC",
};
// A commune's INSEE code begins with its department's, three digits overseas; Monaco's (99138) begins with 99.
const placeOfInsee = (insee: string): string => (/^(97|98)/.test(insee) ? insee.slice(0, 3) : insee.slice(0, 2));
// The department a postcode's number belongs to, by the rule the postcode itself follows: its first two digits, three
// overseas, and Corsica's 20 split between 2A and 2B at 20200. This is what the parser reports; the data is read
// against it below, to say where it does not hold.
const placeOfPostcode = (postcode: string): string => {
  if (/^(97|98)/.test(postcode)) return postcode.slice(0, 3);
  if (postcode.startsWith("20")) return postcode < "20200" ? "2A" : "2B";
  return postcode.slice(0, 2);
};

// The postcodes of La Poste's base with the places of the communes each serves, by INSEE code, and how many in each.
const readLaPoste = (path: string): Map<string, Map<string, number>> => {
  const postcodes = new Map<string, Map<string, number>>();
  const lines = new TextDecoder("latin1").decode(readFileSync(path)).split(/\r?\n/);
  if (!lines[0].startsWith("#Code_commune_INSEE;Nom_de_la_commune;Code_postal;"))
    throw new Error("Unexpected La Poste columns");
  for (const line of lines.slice(1)) {
    if (line === "") continue;
    const [insee, , postcode] = line.split(";");
    if (!/^\d{5}$/.test(postcode ?? "") || !/^[0-9][0-9AB]\d{3}$/.test(insee ?? ""))
      throw new Error(`Unexpected La Poste row: ${line}`);
    const place = placeOfInsee(insee);
    if (!postcodes.has(postcode)) postcodes.set(postcode, new Map());
    const places = postcodes.get(postcode)!;
    places.set(place, (places.get(place) ?? 0) + 1);
  }
  return postcodes;
};

// A comma-and-quote INSEE file: the first line names the columns, every value is in double quotes.
const readInsee = (path: string): Record<string, string>[] => {
  const [head, ...lines] = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter((line) => line !== "");
  const names = head.split(",").map((name) => name.replace(/"/g, ""));
  return lines.map((line) =>
    Object.fromEntries(line.split('","').map((cell, at) => [names[at], cell.replace(/"/g, "")])),
  );
};

// Postcodes as one string: the first's number, then the step to each next in base 36, a step of 36 or more written
// "~" and three digits. Decoded when first needed; 6,328 postcodes come to 7.5 KB.
const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";
const base36 = (value: number): string => {
  let text = "";
  do {
    text = BASE36[value % 36] + text;
    value = Math.floor(value / 36);
  } while (value > 0);
  return text;
};
const packPostcodes = (postcodes: string[]): string => {
  let previous = 0;
  return postcodes
    .map((postcode) => {
      const step = Number(postcode) - previous;
      previous = Number(postcode);
      if (step < 1) throw new Error("postcodes must be sorted and distinct");
      return step < 36 ? base36(step) : `~${base36(step).padStart(3, "0")}`;
    })
    .join("");
};

const writeFrance = (laposte: Map<string, Map<string, number>>, inseeFolder: string): void => {
  if (!existsSync(FR_DIR)) mkdirSync(FR_DIR, { recursive: true });
  const regions = new Map(readInsee(join(inseeFolder, "v_region_2026.csv")).map((row) => [row.REG, row.LIBELLE]));
  const departments = readInsee(join(inseeFolder, "v_departement_2026.csv")).map((row) => ({
    code: row.DEP,
    name: row.LIBELLE,
    region: regions.get(row.REG) ?? "",
  }));
  if (departments.length !== 101 || departments.some((one) => one.region === "")) {
    throw new Error(`INSEE gave ${departments.length} departments, not 101, or one without a region`);
  }
  const collectivities = readInsee(join(inseeFolder, "v_comer_2026.csv"))
    .filter((row) => FR_COLLECTIVITY_COUNTRIES[row.COMER] !== undefined)
    .map((row) => ({ code: row.COMER, country: FR_COLLECTIVITY_COUNTRIES[row.COMER], name: row.LIBELLE }));
  if (collectivities.length !== Object.keys(FR_COLLECTIVITY_COUNTRIES).length)
    throw new Error("INSEE lacks a collectivity");

  const postcodes = [...laposte.keys()].sort();
  // Where the number's rule and the communes disagree. Overseas that matters (97133 is Saint-Barthélemy, 97150
  // Saint-Martin, 98000 Monaco) and is written down; within the metropolis, a few postcodes serve a commune across
  // a department's border, and the number's department stays.
  const overseasPlaces: Record<string, string> = {};
  let acrossBorders = 0;
  for (const postcode of postcodes) {
    const places = [...laposte.get(postcode)!].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const place = places[0][0];
    const expected = placeOfPostcode(postcode);
    if (place === expected) continue;
    if (/^(97|98)/.test(postcode)) overseasPlaces[postcode] = place;
    else acrossBorders += 1;
  }
  for (const postcode of postcodes.filter((one) => one.startsWith("20"))) {
    for (const place of laposte.get(postcode)!.keys()) {
      if (place !== placeOfPostcode(postcode)) throw new Error(`Corsica's 20200 rule fails at ${postcode}`);
    }
  }
  const laPoste =
    "La Poste, Base officielle des codes postaux, https://data.laposte.fr/datasets/laposte-hexasmal (Licence Ouverte 2.0, Etalab)";
  const insee =
    "INSEE, Code officiel géographique 2026, https://www.insee.fr/fr/information/8740218 (Licence Ouverte 2.0, Etalab)";
  writeFileSync(
    join(FR_DIR, "departments.data.ts"),
    header("France's departments and overseas collectivities, by the code La Poste's postcodes begin with.", [insee]) +
      `import type { FrenchCollectivity, FrenchDepartment } from "../../types/france";\n\n` +
      tsdoc(
        "The 101 departments of France, in order of their codes, each with its code (`75`, `2A`, `971`), its name and its region's. The code is how a postcode begins: its first two digits (three overseas), with Corsica's 20 split at 20200. From INSEE's Code officiel géographique (Licence Ouverte 2.0).",
        `FR_DEPARTMENTS.find((department) => department.code === "2A")`,
        JSON.stringify(departments.find((one) => one.code === "2A")),
      ) +
      `const FR_DEPARTMENTS: readonly FrenchDepartment[] = ${JSON.stringify(departments, null, 2)};\n\n` +
      tsdoc(
        "The overseas collectivities that have postcodes in La Poste's base: each with its code, its ISO 3166-1 country code and its name. They are French, and addressed through La Poste, but each has a country code of its own and the Universal Postal Union lists them apart, so an address in one reads as that country's. From INSEE's Code officiel géographique (Licence Ouverte 2.0).",
        `FR_COLLECTIVITIES.map((one) => one.country)`,
        JSON.stringify(collectivities.map((one) => one.country)),
      ) +
      `const FR_COLLECTIVITIES: readonly FrenchCollectivity[] = ${JSON.stringify(collectivities, null, 2)};\n\nexport { FR_COLLECTIVITIES, FR_DEPARTMENTS };\n`,
  );
  const packed = packPostcodes(postcodes);
  writeFileSync(
    join(FR_DIR, "postcodes.data.ts"),
    header("The postcodes of France, the overseas territories and Monaco, and where the number's rule does not hold.", [
      laPoste,
    ]) +
      tsdoc(
        `Every postcode of La Poste's base officielle (${postcodes.length} of them, France, the overseas departments and collectivities and Monaco), packed as the first's number and the step to each next in base 36 (a step of 36 or more is a tilde and three digits). Read with isKnownFrenchPostcode, never by hand. From La Poste (Licence Ouverte 2.0).`,
        "FR_POSTCODES_PACKED.length",
        String(packed.length),
      ) +
      `const FR_POSTCODES_PACKED = ${JSON.stringify(packed)};\n\n` +
      tsdoc(
        "The overseas postcodes whose place is not the one their first three digits name, by the INSEE code of the communes they serve: 97133 is Saint-Barthélemy (977), 97150 Saint-Martin (978) and 98000 Monaco (99). From La Poste (Licence Ouverte 2.0).",
        'FR_POSTCODE_PLACES["98000"]',
        JSON.stringify(overseasPlaces["98000"]),
      ) +
      `const FR_POSTCODE_PLACES: Readonly<Record<string, string>> = ${JSON.stringify(overseasPlaces, null, 2)};\n\nexport { FR_POSTCODES_PACKED, FR_POSTCODE_PLACES };\n`,
  );
  console.log(
    `France: ${departments.length} departments, ${collectivities.length} collectivities, ${postcodes.length} postcodes (${packed.length} characters packed), ${Object.keys(overseasPlaces).length} overseas exceptions, ${acrossBorders} serving a commune across a department's border.`,
  );
};

// ---- Germany ---------------------------------------------------------------------------------------------------

// The Länder as GeoNames names them, in German and in English (it uses both for the same Land), by ISO 3166-2 code.
const GEONAMES_STATES: Readonly<Record<string, string>> = {
  "Baden-Württemberg": "BW",
  Bayern: "BY",
  Bavaria: "BY",
  Berlin: "BE",
  "Land Berlin": "BE",
  Brandenburg: "BB",
  Bremen: "HB",
  Hamburg: "HH",
  Hessen: "HE",
  "Mecklenburg-Vorpommern": "MV",
  "Mecklenburg-Western Pomerania": "MV",
  Niedersachsen: "NI",
  "Lower Saxony": "NI",
  "Nordrhein-Westfalen": "NW",
  "Rheinland-Pfalz": "RP",
  Saarland: "SL",
  Sachsen: "SN",
  Saxony: "SN",
  "Sachsen-Anhalt": "ST",
  "Saxony-Anhalt": "ST",
  "Schleswig-Holstein": "SH",
  Thüringen: "TH",
  Thuringia: "TH",
};

// Every postcode in GeoNames' file for Germany, with how many of its places are in each Land.
const readGeoNames = (path: string): Map<string, Map<string, number>> => {
  const postcodes = new Map<string, Map<string, number>>();
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (line === "") continue;
    const cells = line.split("\t");
    const [country, postcode, , landName] = cells;
    if (country !== "DE" || !/^\d{5}$/.test(postcode ?? "") || cells.length < 11) {
      throw new Error(`Unexpected GeoNames row: ${line}`);
    }
    if (landName === "") continue;
    const land = GEONAMES_STATES[landName];
    if (!land) throw new Error(`GeoNames names a Land this script does not know: ${landName}`);
    if (!postcodes.has(postcode)) postcodes.set(postcode, new Map());
    const lands = postcodes.get(postcode)!;
    lands.set(land, (lands.get(land) ?? 0) + 1);
  }
  return postcodes;
};

const writeGermany = (geonames: Map<string, Map<string, number>>): void => {
  if (!existsSync(DE_DIR)) mkdirSync(DE_DIR, { recursive: true });
  const states = germanStates
    .map((one) => ({ code: one.shortCode, iso: one.code, name: one.name.en, nameJa: one.name.ja }))
    .sort((a, b) => a.code.localeCompare(b.code));
  if (states.length !== 16) throw new Error(`kuni gave ${states.length} German states, not 16`);
  writeFileSync(
    join(DE_DIR, "states.data.ts"),
    header("The sixteen Länder of Germany.", [KUNI]) +
      `import type { GermanState } from "../../types/germany";\n\n` +
      tsdoc(
        "The sixteen Länder of Germany, in order of their codes, each with its ISO 3166-2 code and its name in English and in Japanese. Copied from kuni when the tables are made.",
        "DE_STATES.map((state) => state.code)",
        JSON.stringify(states.map((one) => one.code)),
      ) +
      `const DE_STATES: readonly GermanState[] = ${JSON.stringify(states, null, 2)};\n\nexport { DE_STATES };\n`,
  );

  const postcodes = [...geonames.keys()].sort();
  const landOf = (postcode: string): string => ranked(geonames.get(postcode)!)[0];
  // Where a Land's postcodes begin: each postcode that is not in the same Land as the one before it.
  const runs: string[] = [];
  let previousLand = "";
  let previousStart = 0;
  let straddling = 0;
  for (const postcode of postcodes) {
    if (geonames.get(postcode)!.size > 1) straddling += 1;
    const land = landOf(postcode);
    if (land === previousLand) continue;
    const step = Number(postcode) - previousStart;
    runs.push(`${step < 36 ? base36(step) : `~${base36(step).padStart(3, "0")}`}${land}`);
    previousStart = Number(postcode);
    previousLand = land;
  }
  const packed = packPostcodes(postcodes);
  const joinedRuns = runs.join("");
  writeFileSync(
    join(DE_DIR, "postcodes.data.ts"),
    header("The postcodes of Germany and the Land each is in, from GeoNames.", [
      "GeoNames, postal code data for Germany, https://download.geonames.org/export/zip/ (Creative Commons Attribution 4.0)",
    ]) +
      tsdoc(
        `Every postcode GeoNames lists for Germany (${postcodes.length} of them), packed as the first's number and the step to each next in base 36 (a step of 36 or more is a tilde and three digits). Read with isKnownGermanPostcode, never by hand. From GeoNames (CC BY 4.0).`,
        "DE_POSTCODES_PACKED.length",
        String(packed.length),
      ) +
      `const DE_POSTCODES_PACKED = ${JSON.stringify(packed)};\n\n` +
      tsdoc(
        `Where each Land's postcodes begin: the step from the last run's first postcode, in base 36 (a step of 36 or more is a tilde and three digits), then the Land's two-letter code. ${runs.length} runs in all. A postcode is in the Land of the last run that begins at or before it; ${straddling} postcodes have places in more than one Land (the postcodes of large firms among them) and take the Land most of their places are in. From GeoNames (CC BY 4.0).`,
        "DE_POSTCODE_STATE_RUNS.length",
        String(joinedRuns.length),
      ) +
      `const DE_POSTCODE_STATE_RUNS = ${JSON.stringify(joinedRuns)};\n\nexport { DE_POSTCODE_STATE_RUNS, DE_POSTCODES_PACKED };\n`,
  );
  console.log(
    `Germany: ${states.length} Länder, ${postcodes.length} postcodes (${packed.length} characters packed), ${runs.length} Land runs (${joinedRuns.length} characters), ${straddling} postcodes in more than one Land.`,
  );
};

const main = async (): Promise<void> => {
  for (const country of only)
    if (!["au", "gb", "fr", "de"].includes(country)) throw new Error(`--only: no country ${country}`);
  const { abs, codepoint, laposte, insee, geonames } = await fetchInputs();
  if (abs) writeAustralia(await readAbs(resolve(abs)));
  if (codepoint) writeBritain(readCodePoint(resolve(codepoint)));
  if (laposte && insee) writeFrance(readLaPoste(resolve(laposte)), resolve(insee));
  if (geonames) writeGermany(readGeoNames(resolve(geonames)));
};

if (process.argv.includes("--docs-only")) {
  refreshTableExamples([
    "src/constants/au/cross-border.data.ts",
    "src/constants/au/states.data.ts",
    "src/constants/gb/districts.data.ts",
    "src/constants/gb/nations.data.ts",
    "src/constants/de/states.data.ts",
    "src/constants/fr/departments.data.ts",
  ]);
} else await main();
