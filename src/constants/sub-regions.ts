// The US and Canadian sub-regions (boroughs, parishes, districts, wards, arrondissements), read from the packed text
// in sub-regions.data.ts. The text is unpacked the first time a lookup asks for it, once, and per country, so a
// caller who never parses a facility's locality does not pay for the table at all.

import type { SubRegion } from "../types";
import { CA_SUB_REGIONS_PACKED, US_SUB_REGIONS_PACKED } from "./sub-regions.data";

// The country each packed table holds, and the text.
const PACKED_BY_COUNTRY: Readonly<Record<SubRegion["country"], string>> = {
  CA: CA_SUB_REGIONS_PACKED,
  US: US_SUB_REGIONS_PACKED,
};

// Unpacked tables, filled the first time a country is asked for.
const unpacked = new Map<SubRegion["country"], readonly SubRegion[]>();
let names: ReadonlySet<string> | undefined;

// One packed row, name|parentCity|state|type|alias~alias, as a sub-region of the country.
function unpackRow(row: string, country: SubRegion["country"]): SubRegion {
  const [name, parentCity, state, type, aliases] = row.split("|");
  const subRegion: SubRegion = { name, parentCity, state, country, type: type as SubRegion["type"] };
  if (aliases) subRegion.aliases = aliases.split("~");

  return subRegion;
}

// The sub-regions of one country.
// @param country - `US` or `CA`.
// @returns Every sub-region of that country, in the generator's order (state, type, name).
function subRegionsOf(country: SubRegion["country"]): readonly SubRegion[] {
  let rows = unpacked.get(country);
  if (!rows) {
    rows = PACKED_BY_COUNTRY[country]
      .split("\n")
      .filter((row) => row !== "")
      .map((row) => unpackRow(row, country));
    unpacked.set(country, rows);
  }

  return rows;
}

// Every sub-region, Canada first, then the United States.
// @returns The sub-regions of both countries.
function allSubRegions(): readonly SubRegion[] {
  return [...subRegionsOf("CA"), ...subRegionsOf("US")];
}

// Whether a normalized text (lower case, letters only, as the parser writes it) is a sub-region's name or one of its
// aliases.
// @param text - The text to look up.
// @returns `true` when a sub-region goes by it.
function isSubRegionName(text: string): boolean {
  if (!names) {
    const found = new Set<string>();
    for (const subRegion of allSubRegions()) {
      found.add(subRegion.name);
      for (const alias of subRegion.aliases ?? []) found.add(alias);
    }
    names = found;
  }

  return names.has(text);
}

export { allSubRegions, isSubRegionName, subRegionsOf };
