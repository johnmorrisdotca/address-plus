import britishSubdivisions from "@johnmorrisdotca/kuni/subdivisions/gb";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { districtRuns, header, KUNI, ranked, tsdoc } from "./update-country-data.ts";

const GB_DIR = resolve("src/constants/gb");
// Code-Point Open's nation codes (ONS GSS codes for England, Scotland and Wales).
export const GSS_NATIONS: Readonly<Record<string, string>> = { E92000001: "ENG", S92000003: "SCT", W92000004: "WLS" };

export const writeBritain = (districts: Map<string, Map<string, number>>): void => {
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
