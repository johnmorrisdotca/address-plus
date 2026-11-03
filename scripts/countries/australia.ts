import australianStates from "@johnmorrisdotca/kuni/subdivisions/au";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { GSS_NATIONS } from "./britain.ts";
import { header, KUNI, ranked, tsdoc, unzipText } from "./update-country-data.ts";

export const ABS_URL =
  "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/allocation-files/POA_2021_AUST.xlsx";
export const CODEPOINT_URL =
  "https://api.os.uk/downloads/v1/products/CodePointOpen/downloads?area=GB&format=CSV&redirect";
const AU_DIR = resolve("src/constants/au");

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

const SHARED_STRING = /<si>(?:<t[^>]*>([^<]*)<\/t>|[\s\S]*?)<\/si>/g;
const ROW = /<row[^>]*>([\s\S]*?)<\/row>/g;
const CELL = /<c r="([A-Z]+)\d+"(?:[^>]*?t="(\w+)")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t>([^<]*)<\/t><\/is>)?<\/c>/g;

// The first two columns of the sheet, mesh block and postal area, row by row: postcode -> state -> mesh blocks.
export const readAbs = async (path: string): Promise<Map<string, Map<string, number>>> => {
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
export const readCodePoint = (folder: string): Map<string, Map<string, number>> => {
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

export const writeAustralia = (postcodes: Map<string, Map<string, number>>): void => {
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
