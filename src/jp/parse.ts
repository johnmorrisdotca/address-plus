// Parsing a Japanese address, written in Japanese or in romaji, into one set of fields.
//
// Japanese order runs from the largest part to the smallest: postal code, prefecture, municipality,
// town, then the block as 丁目 (chome), 番 (ban) and 号 (go), then a building, floor and room.
// English order runs the other way, comma-separated, with the block written 1-2-3 before the town.
// Both end up in the same ParsedAddress: the Japan-specific fields, plus the shared ones so that
// formatting, comparison and validation treat the result like any other address.
//
// How a pair of numbers is read. 1-2-3 is always chome, ban and go. Two numbers are ambiguous: 丸の内1-2 could be
// 1丁目2番, and 寿町2-31 is 2番31号. A pair written straight after the town is read as ban and go, because that is
// what it almost always is: of the 907 addresses in Geolonia's test set that end in a bare pair after the town,
// 899 are ban and go, since a person in a town of chome writes all three numbers. A chome written as such (1丁目2-3)
// is kept, and the pair after it is ban and go. Three numbers in a town named with 大字 or 字, or whose first
// number is 100 or more (too high for a chome), are ban, go and a room. The block is "2-31" either way, so a caller
// that needs certainty should read block rather than the parts.

import { findMunicipalitiesByRomaji, findPrefecture } from "../constants/jp";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";
import { toSnakeCase } from "../utils/case-converter";
import { hasJapaneseScript } from "./normalize";
import { parseRomaji } from "./parse-romaji";
import { parseJapaneseScript } from "./parse-script";
import {
  CAMEL_CASE_CAPITAL,
  COMMA_SPLIT,
  DIGITS_ONLY,
  ENGLISH_MUNICIPALITY_WORD,
  HYPHENATED_POSTAL_CODE,
  LATIN_LETTER,
  PART_TRIM,
  POSTAL_MARK,
  ROMAJI_DESIGNATOR_WORD,
  TRAILING_COUNTRY,
  TRAILING_POSTAL_CODE,
  WORD_SPLIT,
} from "./patterns";

/**
 * Whether a text is a Japanese address: in Japanese script, ending with Japan, or naming a prefecture beside a
 * Japanese postal code, a romaji designator (`-ku`, `-shi`) or a municipality written with an English word (`Chiyoda
 * City`). A US address that only mentions a Japanese name (`100 Tokyo Ave`) does not count.
 *
 * @param text - The text.
 * @returns `true` when the text should be read as Japanese.
 * @example
 * ```ts
 * import { looksJapanese } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(looksJapanese("1-2-3 Marunouchi, Chiyoda-ku, Tokyo"));
 * // → true
 * ```
 */
function looksJapanese(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  if (hasJapaneseScript(text)) return true;
  const plain = text.normalize("NFKC").trim();
  if (TRAILING_COUNTRY.test(plain)) return true;
  const hasPostal = HYPHENATED_POSTAL_CODE.test(plain) || TRAILING_POSTAL_CODE.test(plain);
  const hasDesignator = ROMAJI_DESIGNATOR_WORD.test(plain);
  // Every Japanese reading needs one of these besides the prefecture, and they cost a pattern each, where finding a
  // prefecture normalizes every word: an address with none of them is not Japanese, however it spells its words.
  if (!hasPostal && !hasDesignator && !hasEnglishMunicipalityWord(plain)) return false;
  const words = plain.split(WORD_SPLIT);
  // A prefecture by name: findPrefecture also reads a JIS code, and 34 in a street number is not Hiroshima.
  const namesPrefecture = words.some(
    (word, index) =>
      !DIGITS_ONLY.test(word) &&
      (findPrefecture(word) !== null || findPrefecture(`${word} ${words[index + 1] ?? ""}`) !== null),
  );

  return namesPrefecture && (hasPostal || hasDesignator || namesMunicipality(plain));
}

// Whether a comma-separated part of a romaji text ends in an English word for a municipality (City, Village).
function hasEnglishMunicipalityWord(text: string): boolean {
  return text.split(COMMA_SPLIT).some((part) => ENGLISH_MUNICIPALITY_WORD.test(part.replace(PART_TRIM, "")));
}

// Whether a comma-separated part of a romaji text is a municipality the tables know written with an English word,
// Chiyoda City or Kiso Village, for an address that has no -ku or -shi. The word is required: without it, USA
// would be 宇佐市 (Usa-shi).
function namesMunicipality(text: string): boolean {
  return text.split(COMMA_SPLIT).some((part) => {
    const name = part.replace(PART_TRIM, "");

    return ENGLISH_MUNICIPALITY_WORD.test(name) && findMunicipalitiesByRomaji(name).length > 0;
  });
}

// The result with snake_case keys, the Japanese fields included: postal_code, prefecture_code.
function snakeCased(address: ParsedAddress): ParsedAddress {
  const shared = toSnakeCase(address);

  return Object.fromEntries(
    Object.entries(shared).map(([key, value]) => [
      key.replace(CAMEL_CASE_CAPITAL, (capital) => `_${capital.toLowerCase()}`),
      value,
    ]),
  ) as ParsedAddress;
}

/**
 * Parses a Japanese address, in Japanese script or in romaji, into the Japanese fields and the shared ones.
 * `parseLocation` calls it for any address that looks Japanese; call it directly to skip the detection.
 *
 * @param text - The address as one string, in either script, with or without 〒 and the postal code.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are ignored.
 * @returns The parts found, or `null` when nothing in the text names a place in Japan (no prefecture, municipality or
 * postal code).
 * @example
 * ```ts
 * import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室")?.block);
 * // → "1-2-3"
 * ```
 */
function parseJapaneseAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!text || typeof text !== "string") return null;
  // 〒 or 郵便番号 on an address otherwise in romaji does not make it Japanese script.
  const withoutMark = text.replace(POSTAL_MARK, "");
  const inRomaji = !hasJapaneseScript(text) || (!hasJapaneseScript(withoutMark) && LATIN_LETTER.test(withoutMark));
  const result = inRomaji ? parseRomaji(text) : parseJapaneseScript(text);
  if (result && options.useSnakeCase) return snakeCased(result);

  return result;
}

export { looksJapanese, parseJapaneseAddress };
