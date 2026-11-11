// Italy's postcodes (CAP): five digits, whether GeoNames' list has one, and the province it is in, by the sigla addresses
// write (RM for Roma).

import { postcodeLookups } from "../../country/postcode-lookups";
import type { PostcodeRegion } from "../../types/postcode-country";
import { IT_POSTCODE_REGION_RUNS, IT_POSTCODES_PACKED } from "./postcodes.data";
import { IT_PROVINCES } from "./regions.data";

const IT_POSTCODE_SHAPE = /^\d{5}$/;

const lookups = postcodeLookups({
  shape: IT_POSTCODE_SHAPE,
  length: 5,
  packed: IT_POSTCODES_PACKED,
  runs: IT_POSTCODE_REGION_RUNS,
  normalize: (postcode) => postcode.trim(),
});

const plain = (text: string): string => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

/**
 * Finds a province of Italy by its sigla (`RM`, `IT-RM`) or its name in English, ignoring accents and letter case.
 *
 * @param query - The province's sigla or name.
 * @returns The province, or `undefined` when none has that sigla or name.
 * @example
 * ```ts
 * import { findItalianProvince } from "@johnmorrisdotca/address-plus/it";
 *
 * console.log([findItalianProvince("rm")?.name, findItalianProvince("IT-MI")?.code, findItalianProvince("ZZ")]);
 * // → ["Rome","MI",null]
 * ```
 */
function findItalianProvince(query: string): PostcodeRegion | undefined {
  const wanted = plain(String(query ?? "")).replace(/^IT-/, "");
  if (wanted === "") return undefined;

  return IT_PROVINCES.find((province) => province.code === wanted || plain(province.name) === wanted);
}

export { findItalianProvince, IT_POSTCODE_SHAPE, IT_PROVINCES, lookups as italianPostcodes };
