import brRegions from "@johnmorrisdotca/kuni/subdivisions/br";
import esSubdivisions from "@johnmorrisdotca/kuni/subdivisions/es";
import inRegions from "@johnmorrisdotca/kuni/subdivisions/in";
import itSubdivisions from "@johnmorrisdotca/kuni/subdivisions/it";
import krRegions from "@johnmorrisdotca/kuni/subdivisions/kr";
import nzRegions from "@johnmorrisdotca/kuni/subdivisions/nz";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { base36, packPostcodes } from "./france.ts";
import { header, KUNI, ranked, tsdoc } from "./update-country-data.ts";

// The postcode tables of the Netherlands, Spain, Italy and New Zealand. Spain, Italy and New Zealand come from
// GeoNames' postal code files (Creative Commons Attribution 4.0), where no postal service or government publishes the
// list under a licence an MIT package can pass on; the Netherlands' list is Statistics Netherlands' (CBS) four-digit
// postcode areas, published through PDOK under the same licence. Each country has the postcodes (packed), and where the
// source says which region a postcode is in, the runs of postcodes that share one.

export const GEONAMES_BASE = "https://download.geonames.org/export/zip";
export const PDOK_URL =
  "https://service.pdok.nl/cbs/postcode4/2023/wfs/v1_0?service=WFS&version=2.0.0&request=GetFeature&typeNames=postcode4:postcode4&outputFormat=application/json&propertyName=postcode&sortBy=postcode";
const GEONAMES_NOTE =
  "GeoNames, postal code data, https://download.geonames.org/export/zip/ (Creative Commons Attribution 4.0)";
const PDOK_NOTE =
  "CBS (Statistics Netherlands), Postcode4 statistics 2023, through PDOK, https://service.pdok.nl/cbs/postcode4/2023/wfs/v1_0 (Creative Commons Attribution 4.0)";

export type Row = { postcode: string; name: string; admin1: string; code1: string; admin2: string; code2: string };

// Every row of a GeoNames file for one country, with the postcode checked against the shape the country writes.
export const readGeoNamesRows = (path: string, country: string, shape: RegExp): Row[] => {
  const rows: Row[] = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (line === "") continue;
    const cells = line.split("\t");
    if (cells[0] !== country || !shape.test(cells[1] ?? "") || cells.length < 11) {
      throw new Error(`Unexpected GeoNames row for ${country}: ${line}`);
    }
    rows.push({
      postcode: cells[1],
      name: cells[2],
      admin1: cells[3],
      code1: cells[4],
      admin2: cells[5],
      code2: cells[6],
    });
  }
  return rows;
};

// The runs of the sorted postcodes that share a region, packed: each run is the step from the last run's first
// postcode in base 36 (lower case), then the region's code in capitals.
const packRuns = (postcodes: string[], regionOf: (postcode: string) => string): { text: string; runs: number } => {
  let previousRegion = "";
  let previousStart = 0;
  let runs = 0;
  let text = "";
  for (const postcode of postcodes) {
    const region = regionOf(postcode);
    if (region === previousRegion) continue;
    text += `${base36(Number(postcode) - previousStart)}${region}`;
    previousStart = Number(postcode);
    previousRegion = region;
    runs += 1;
  }
  return { text, runs };
};

type Subdivision = {
  code: string;
  country: string;
  shortCode: string;
  level: number;
  parent?: string;
  name: { en: string; ja: string | null };
};

// A region's name in Japanese: its own, or its parent's when kuni has none (Asturias is a province and a community at
// once, and has the community's name).
const writeRegions = (dir: string, constant: string, what: string, rows: Subdivision[], all: Subdivision[]): void => {
  const regions = rows
    .map((one) => {
      const nameJa = one.name.ja ?? all.find((parent) => parent.code === one.parent)?.name.ja;
      if (!nameJa) throw new Error(`kuni has no Japanese name for ${one.code}`);
      return { code: one.shortCode, iso: one.code, name: one.name.en, nameJa };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
  writeFileSync(
    join(dir, "regions.data.ts"),
    header(what, [KUNI]) +
      `import type { PostcodeRegion } from "../../types/postcode-country";\n\n` +
      tsdoc(
        `${what} Each has its code, its ISO 3166-2 code and its name in English and in Japanese, copied from kuni when the tables are made.`,
        `${constant}.map((region) => region.code).slice(0, 3)`,
        JSON.stringify(regions.map((region) => region.code).slice(0, 3)),
      ) +
      `const ${constant}: readonly PostcodeRegion[] = ${JSON.stringify(regions, null, 2)};\n\nexport { ${constant} };\n`,
  );
};

const writePostcodes = (
  dir: string,
  prefix: string,
  label: string,
  source: string,
  postcodes: string[],
  runs?: { text: string; runs: number; note: string },
): void => {
  const packed = packPostcodes(postcodes);
  const exported = [`${prefix}_POSTCODES_PACKED`];
  let body =
    tsdoc(
      `Every postcode listed for ${label} (${postcodes.length} of them), packed as the first's number and the step to each next in base 36 (a step of 36 or more is a tilde and three digits). Read with the country's lookups, never by hand.`,
      `${prefix}_POSTCODES_PACKED.length`,
      String(packed.length),
    ) + `const ${prefix}_POSTCODES_PACKED = ${JSON.stringify(packed)};\n\n`;
  if (runs) {
    exported.unshift(`${prefix}_POSTCODE_REGION_RUNS`);
    body +=
      tsdoc(
        `Where each region's postcodes begin: the step from the last run's first postcode in base 36 in lower case, then the region's code in capitals. ${runs.runs} runs in all. ${runs.note}`,
        `${prefix}_POSTCODE_REGION_RUNS.length`,
        String(runs.text.length),
      ) + `const ${prefix}_POSTCODE_REGION_RUNS = ${JSON.stringify(runs.text)};\n\n`;
  }
  writeFileSync(
    join(dir, "postcodes.data.ts"),
    header(`The postcodes of ${label}${runs ? " and the region each is in" : ""}.`, [source]) +
      body +
      `export { ${exported.join(", ")} };\n`,
  );
};

const dirOf = (code: string): string => {
  const dir = resolve(`src/constants/${code}`);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
};

const distinct = (postcodes: string[]): string[] => [...new Set(postcodes)].sort();

// The region most of a postcode's rows are in.
const majority = (rows: Row[], pick: (row: Row) => string): Map<string, string> => {
  const counts = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const region = pick(row);
    if (region === "") continue;
    const at = counts.get(row.postcode) ?? new Map<string, number>();
    at.set(region, (at.get(region) ?? 0) + 1);
    counts.set(row.postcode, at);
  }
  return new Map([...counts].map(([postcode, found]) => [postcode, ranked(found)[0]]));
};

// ---- Netherlands ----------------------------------------------------------------------------------------------

export const readCbsPostcodes = (path: string): string[] => {
  const postcodes = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter((line) => line !== "");
  if (postcodes.some((one) => !/^[1-9]\d{3}$/.test(one)))
    throw new Error("The CBS list holds a postcode that is not four digits");
  return distinct(postcodes);
};

export const writeNetherlands = (postcodes: string[]): void => {
  if (postcodes.length < 4000) throw new Error(`CBS gave ${postcodes.length} postcode areas, fewer than 4000`);
  writePostcodes(dirOf("nl"), "NL", "the Netherlands (the four-digit postcode areas)", PDOK_NOTE, postcodes);
  console.log(`Netherlands: ${postcodes.length} four-digit postcodes.`);
};

// ---- Spain ----------------------------------------------------------------------------------------------------

export const writeSpain = (rows: Row[]): void => {
  // The fifty provinces, and Ceuta and Melilla, which have the status of a province and a city of their own.
  const provinces = (esSubdivisions as unknown as Subdivision[]).filter(
    (one) => one.level === 2 || one.shortCode === "CE" || one.shortCode === "ML",
  );
  const known = new Set(provinces.map((one) => one.shortCode));
  // GeoNames gives the province's ISO code; a postcode's first two digits are its province, so each takes the one most of
  // its rows name (a few postcodes of an enclave are written under the neighbour's).
  const byPrefix = majority(
    rows.map((row) => ({ ...row, postcode: row.postcode.slice(0, 2) })),
    // GeoNames writes Melilla as ME; ISO 3166-2:ES writes it ML.
    (row) => (row.code2 === "ME" ? "ML" : row.code2),
  );
  for (const code of byPrefix.values())
    if (!known.has(code)) throw new Error(`GeoNames names a Spanish province kuni does not have: ${code}`);
  const postcodes = distinct(rows.map((row) => row.postcode));
  const runs = packRuns(postcodes, (postcode) => byPrefix.get(postcode.slice(0, 2)) ?? "");
  if (runs.text.includes("undefined") || postcodes.some((one) => !byPrefix.has(one.slice(0, 2)))) {
    throw new Error("A Spanish postcode has no province");
  }
  const dir = dirOf("es");
  writeRegions(
    dir,
    "ES_PROVINCES",
    "The provinces of Spain, with the two cities that are no province's.",
    provinces,
    esSubdivisions as unknown as Subdivision[],
  );
  writePostcodes(dir, "ES", "Spain", GEONAMES_NOTE, postcodes, {
    ...runs,
    note: "A postcode is in the province of the last run that begins at or before it; its first two digits name the province, and the one most of GeoNames' places for those digits are in is taken.",
  });
  console.log(`Spain: ${provinces.length} provinces, ${postcodes.length} postcodes, ${runs.runs} province runs.`);
};

// ---- Italy ----------------------------------------------------------------------------------------------------

export const writeItaly = (rows: Row[]): void => {
  const all = itSubdivisions as unknown as Subdivision[];
  // Aosta has no province in ISO 3166-2 (the region, IT-23, is all of it) but a sigla in addresses, AO.
  const aosta = all.find((one) => one.code === "IT-23");
  if (!aosta) throw new Error("kuni has no Aosta Valley");
  const subdivisions = [...all.filter((one) => one.level === 2), { ...aosta, shortCode: "AO" }];
  const known = new Set(subdivisions.map((one) => one.shortCode));
  const byPostcode = majority(rows, (row) => row.code2);
  for (const code of byPostcode.values())
    if (!known.has(code)) throw new Error(`GeoNames names an Italian province kuni does not have: ${code}`);
  const postcodes = distinct(rows.map((row) => row.postcode));
  let straddling = 0;
  for (const postcode of postcodes) {
    const found = new Set(rows.filter((row) => row.postcode === postcode).map((row) => row.code2));
    if (found.size > 1) straddling += 1;
  }
  const runs = packRuns(postcodes, (postcode) => byPostcode.get(postcode) ?? "");
  if (postcodes.some((one) => !byPostcode.has(one))) throw new Error("An Italian postcode has no province");
  const dir = dirOf("it");
  writeRegions(
    dir,
    "IT_PROVINCES",
    "The provinces, metropolitan cities and other second-level divisions of Italy.",
    subdivisions,
    all,
  );
  writePostcodes(dir, "IT", "Italy", GEONAMES_NOTE, postcodes, {
    ...runs,
    note: `A postcode is in the province of the last run that begins at or before it; ${straddling} postcodes have places in more than one province and take the one most of their places are in.`,
  });
  console.log(
    `Italy: ${subdivisions.length} provinces, ${postcodes.length} postcodes, ${runs.runs} province runs, ${straddling} postcodes in more than one province.`,
  );
};

// ---- New Zealand ----------------------------------------------------------------------------------------------

const plainName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

export const writeNewZealand = (rows: Row[]): void => {
  const regions = nzRegions as unknown as Subdivision[];
  const byName = new Map(regions.map((one) => [plainName(one.name.en), one.shortCode]));
  const byPostcode = majority(rows, (row) => {
    if (row.admin1 === "") return "";
    const code = byName.get(plainName(row.admin1)) ?? byName.get(plainName(row.admin1.replace(/[- ]/g, "")));
    if (!code) throw new Error(`GeoNames names a New Zealand region kuni does not have: ${row.admin1}`);
    return code;
  });
  const postcodes = distinct(rows.map((row) => row.postcode));
  const none = postcodes.filter((postcode) => !byPostcode.has(postcode)).length;
  const runs = packRuns(postcodes, (postcode) => byPostcode.get(postcode) ?? "-");
  const dir = dirOf("nz");
  writeRegions(dir, "NZ_REGIONS", "The regions of New Zealand.", regions, regions);
  writePostcodes(dir, "NZ", "New Zealand", GEONAMES_NOTE, postcodes, {
    ...runs,
    note: `A postcode is in the region of the last run that begins at or before it; a run with the code - is ${none} postcodes GeoNames gives no region.`,
  });
  console.log(
    `New Zealand: ${regions.length} regions, ${postcodes.length} postcodes, ${runs.runs} region runs, ${none} with no region.`,
  );
};

// ---- India ----------------------------------------------------------------------------------------------------

// GeoNames' names for the states that kuni writes differently.
const INDIA_ALIASES: Readonly<Record<string, string>> = { pondicherry: "puducherry" };

export const writeIndia = (rows: Row[]): void => {
  const regions = inRegions as unknown as Subdivision[];
  const byName = new Map(regions.map((one) => [plainName(one.name.en.replace(/&/g, "and")), one.shortCode]));
  const byPostcode = majority(rows, (row) => {
    if (row.admin1 === "") return "";
    const plain = plainName(row.admin1.replace(/&/g, "and"));
    const code = byName.get(INDIA_ALIASES[plain] ?? plain);
    if (!code) throw new Error(`GeoNames names an Indian state kuni does not have: ${row.admin1}`);
    return code;
  });
  const postcodes = distinct(rows.map((row) => row.postcode));
  const none = postcodes.filter((postcode) => !byPostcode.has(postcode)).length;
  const runs = packRuns(postcodes, (postcode) => byPostcode.get(postcode) ?? "-");
  const dir = dirOf("in");
  writeRegions(dir, "IN_STATES", "The states and union territories of India.", regions, regions);
  writePostcodes(dir, "IN", "India", GEONAMES_NOTE, postcodes, {
    ...runs,
    note: `A postcode is in the state of the last run that begins at or before it; GeoNames' states are those of its last update, so Ladakh's postcodes are in Jammu and Kashmir's runs; a run with the code - is ${none} postcodes GeoNames gives no state.`,
  });
  console.log(
    `India: ${regions.length} states, ${postcodes.length} postcodes, ${runs.runs} state runs, ${none} with no state.`,
  );
};

// ---- South Korea ----------------------------------------------------------------------------------------------

// The official names of the metropolitan cities and provinces, by their ISO 3166-2 code: a fact, written out here because
// GeoNames names them in Korean and kuni does not.
const KOREA_NAMES: Readonly<Record<string, string>> = {
  서울특별시: "11",
  부산광역시: "26",
  대구광역시: "27",
  인천광역시: "28",
  광주광역시: "29",
  대전광역시: "30",
  울산광역시: "31",
  세종특별자치시: "50",
  경기도: "41",
  강원도: "42",
  충청북도: "43",
  충청남도: "44",
  전라북도: "45",
  전라남도: "46",
  경상북도: "47",
  경상남도: "48",
  제주특별자치도: "49",
};

export const writeKorea = (rows: Row[]): void => {
  const regions = krRegions as unknown as Subdivision[];
  const known = new Set(regions.map((one) => one.shortCode));
  const byPostcode = majority(rows, (row) => {
    const code = KOREA_NAMES[row.admin1];
    if (!code || !known.has(code))
      throw new Error(`GeoNames names a Korean province this script does not know: ${row.admin1}`);
    return code;
  });
  const postcodes = distinct(rows.map((row) => row.postcode));
  // The runs write a region's code in capitals, and a province's code is a number: its letter is its place in the table, A for
  // the first.
  const letters = new Map(regions.map((one, at) => [one.shortCode, String.fromCharCode(65 + at)]));
  const runs = packRuns(postcodes, (postcode) => letters.get(byPostcode.get(postcode) ?? "") ?? "");
  if (postcodes.some((one) => !byPostcode.has(one))) throw new Error("A Korean postcode has no province");
  const dir = dirOf("kr");
  writeRegions(dir, "KR_PROVINCES", "The metropolitan cities and provinces of South Korea.", regions, regions);
  writePostcodes(dir, "KR", "South Korea", GEONAMES_NOTE, postcodes, {
    ...runs,
    note: "A postcode is in the province of the last run that begins at or before it; the province is a letter, A for the first of the table (sorted by code), B for the second and so on.",
  });
  console.log(`South Korea: ${regions.length} provinces, ${postcodes.length} postcodes, ${runs.runs} province runs.`);
};

// ---- Brazil ---------------------------------------------------------------------------------------------------

// Brazil has no list of postcodes here (GeoNames has only the major ones): the states are kuni's, and a state is told from the
// CEP by the range of its first five digits, which src/constants/br/index.ts holds. The GeoNames file is only read to check
// those ranges: every CEP it lists must fall in the range of its state.
export const writeBrazil = (
  rows: Row[],
  ranges: Readonly<Record<string, readonly (readonly [number, number])[]>>,
): void => {
  const regions = brRegions as unknown as Subdivision[];
  const byName = new Map(
    regions.map((one) => [plainName(one.name.en.replace("Federal District", "Distrito Federal")), one.shortCode]),
  );
  let checked = 0;
  for (const row of rows) {
    const code = byName.get(plainName(row.admin1));
    if (!code) throw new Error(`GeoNames names a Brazilian state kuni does not have: ${row.admin1}`);
    const first = Number(row.postcode.slice(0, 5));
    if (!(ranges[code] ?? []).some(([from, to]) => first >= from && first <= to)) {
      throw new Error(`CEP ${row.postcode} (${row.admin1}) is outside the ranges of ${code}`);
    }
    checked += 1;
  }
  writeRegions(dirOf("br"), "BR_STATES", "The states of Brazil and the Federal District.", regions, regions);
  console.log(`Brazil: ${regions.length} states; ${checked} of GeoNames' CEPs are inside the range of their state.`);
};
