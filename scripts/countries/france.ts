import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { header, tsdoc } from "./update-country-data.ts";

const FR_DIR = resolve("src/constants/fr");
export const LAPOSTE_URL = "https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw";
export const INSEE_URL = "https://www.insee.fr/fr/statistiques/fichier/8740222";
export const INSEE_FILES = ["v_departement_2026.csv", "v_region_2026.csv", "v_comer_2026.csv"];

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
export const readLaPoste = (path: string): Map<string, Map<string, number>> => {
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
export const base36 = (value: number): string => {
  let text = "";
  do {
    text = BASE36[value % 36] + text;
    value = Math.floor(value / 36);
  } while (value > 0);
  return text;
};
export const packPostcodes = (postcodes: string[]): string => {
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

export const writeFrance = (laposte: Map<string, Map<string, number>>, inseeFolder: string): void => {
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
