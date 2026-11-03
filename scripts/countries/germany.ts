import germanStates from "@johnmorrisdotca/kuni/subdivisions/de";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { base36, packPostcodes } from "./france.ts";
import { header, KUNI, ranked, tsdoc } from "./update-country-data.ts";

const DE_DIR = resolve("src/constants/de");
export const GEONAMES_URL = "https://download.geonames.org/export/zip/DE.zip";

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
export const readGeoNames = (path: string): Map<string, Map<string, number>> => {
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

export const writeGermany = (geonames: Map<string, Map<string, number>>): void => {
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
