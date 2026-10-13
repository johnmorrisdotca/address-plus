// Japanese addresses: a prefecture, a municipality, then the town and the numbered block within it.

/**
 * A prefecture (都道府県) in the tables: its JIS code, official name, katakana reading and romaji.
 *
 * @example
 * ```ts
 * import { findPrefecture } from "@johnmorrisdotca/address-plus/jp";
 * import type { JapanesePrefecture } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(findPrefecture("13"));
 * // → {"code":"13","name":"東京都","kana":"トウキョウト","romaji":"Tokyo-to"}
 * ```
 */
interface JapanesePrefecture {
  code: string; // JIS X 0401 code, "01" (Hokkaido) to "47" (Okinawa)
  name: string; // Official name with its designator: 東京都, 大阪府, 北海道, 愛知県
  kana: string; // Reading in katakana: トウキョウト
  romaji: string; // Romaji with the designator hyphenated on: Tokyo-to
}

/**
 * A municipality (市区町村) in the tables: its JIS code, its prefecture's code, its official name with the district for a
 * town or village in one, its reading and its romaji.
 *
 * @example
 * ```ts
 * import { findMunicipalityByCode } from "@johnmorrisdotca/address-plus/jp";
 * import type { JapaneseMunicipality } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(findMunicipalityByCode("13101"));
 * // → {"code":"13101","prefecture":"13","name":"千代田区","kana":"チヨダク","romaji":"Chiyoda-ku"}
 * ```
 */
interface JapaneseMunicipality {
  code: string; // JIS X 0402 code, five digits; the first two are the prefecture's
  prefecture: string; // The prefecture's JIS code
  name: string; // Official name, with the district for towns and villages in one: 千代田区, 札幌市中央区, 石狩郡当別町
  kana: string; // Reading in katakana
  romaji: string; // Romaji with designators hyphenated on: Chiyoda-ku, Sapporo-shi Chuo-ku, Ishikari-gun Tobetsu-cho
}

/**
 * The fields a Japanese address fills on top of the shared ones. Every value is normalised: full-width and kanji
 * numerals become ASCII digits, and the block is split into chome, ban and go whichever way it was written.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { JapaneseAddressFields } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(parseLocation("〒100-0005 東京都千代田区丸の内1丁目2番3号")?.municipalityCode);
 * // → "13101"
 * ```
 */
interface JapaneseAddressFields {
  postalCode?: string; // 〒 code as NNN-NNNN
  prefecture?: string; // 東京都
  prefectureCode?: string; // JIS code: "13"
  prefectureRomaji?: string; // Tokyo
  municipality?: string; // 千代田区
  municipalityCode?: string; // JIS code: "13101"
  municipalityRomaji?: string; // Chiyoda-ku
  streetDirections?: string; // Kyoto's street directions before the town (通り名): 寺町通御池上る
  town?: string; // 丸の内 (大字・町名), without the chome
  chome?: string; // 丁目: "1"
  ban?: string; // 番 (番地): "2"
  go?: string; // 号: "3"
  block?: string; // The numbered block as one string: "1-2-3"
  building?: string; // サンプルビル
  floor?: string; // 階: "5"
  room?: string; // 号室: "501"
}

export type { JapaneseAddressFields, JapaneseMunicipality, JapanesePrefecture };
