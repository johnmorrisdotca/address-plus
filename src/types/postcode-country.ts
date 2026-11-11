// What the countries that come with a postcode table and nothing more share: a region of the table (a Spanish province,
// an Italian province, a region of New Zealand) and a postcode taken apart.

/**
 * A region a postcode can be in, as a country's table holds it: its code, its ISO 3166-2 code, and its name in English
 * and in Japanese (from kuni, which takes them from Unicode CLDR and Wikidata).
 *
 * @example
 * ```ts
 * import { ES_PROVINCES } from "@johnmorrisdotca/address-plus/es";
 * import type { PostcodeRegion } from "@johnmorrisdotca/address-plus/es";
 *
 * const madrid: PostcodeRegion | undefined = ES_PROVINCES.find((province) => province.code === "M");
 * console.log(madrid);
 * // → {"code":"M","iso":"ES-M","name":"Madrid Province","nameJa":"マドリード県"}
 * ```
 */
interface PostcodeRegion {
  code: string; // M
  iso: string; // ES-M
  name: string; // Madrid
  nameJa: string; // マドリード県
}

/**
 * A postcode taken apart: its canonical form, the region it is in (when the country's table has regions), and whether the
 * country's list has it.
 *
 * @example
 * ```ts
 * import { parseSpanishPostcode } from "@johnmorrisdotca/address-plus/es";
 * import type { PostcodeLookup } from "@johnmorrisdotca/address-plus/es";
 *
 * const found: PostcodeLookup = parseSpanishPostcode("28014");
 * console.log(found);
 * // → {"postcode":"28014","region":"M","known":true}
 * ```
 */
interface PostcodeLookup {
  postcode: string; // 28014
  region?: string; // M; absent when the country has no regions in its table, or the postcode is not in the list
  known: boolean; // Whether the country's list has it
}

export type { PostcodeLookup, PostcodeRegion };
