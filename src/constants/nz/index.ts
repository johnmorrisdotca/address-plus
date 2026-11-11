// New Zealand's postcodes: four digits, whether GeoNames' list has one, and the region it is in.

import { postcodeLookups } from "../../country/postcode-lookups";
import type { PostcodeRegion } from "../../types/postcode-country";
import { NZ_POSTCODE_REGION_RUNS, NZ_POSTCODES_PACKED } from "./postcodes.data";
import { NZ_REGIONS } from "./regions.data";

const NZ_POSTCODE_SHAPE = /^\d{4}$/;

const lookups = postcodeLookups({
  shape: NZ_POSTCODE_SHAPE,
  length: 4,
  packed: NZ_POSTCODES_PACKED,
  runs: NZ_POSTCODE_REGION_RUNS,
  normalize: (postcode) => postcode.trim(),
});

const plain = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

/**
 * Finds a region of New Zealand by its code (`AUK`, `NZ-AUK`) or its name in English, ignoring macrons, hyphens and
 * letter case.
 *
 * @param query - The region's code or name.
 * @returns The region, or `undefined` when none has that code or name.
 * @example
 * ```ts
 * import { findNewZealandRegion } from "@johnmorrisdotca/address-plus/nz";
 *
 * console.log([findNewZealandRegion("auk")?.name, findNewZealandRegion("Hawke's Bay")?.code, findNewZealandRegion("x")]);
 * // → ["Auckland","HKB",null]
 * ```
 */
function findNewZealandRegion(query: string): PostcodeRegion | undefined {
  const wanted = plain(String(query ?? "")).replace(/^NZ(?=[A-Z]{3}$)/, "");
  if (wanted === "") return undefined;

  return NZ_REGIONS.find((region) => region.code === wanted || plain(region.name) === wanted);
}

export { findNewZealandRegion, lookups as newZealandPostcodes, NZ_POSTCODE_SHAPE, NZ_REGIONS };
