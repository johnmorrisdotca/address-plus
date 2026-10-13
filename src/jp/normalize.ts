// Normalising the text of a Japanese address before it is parsed: one width of digit, one kind of
// dash, one kind of space, and the block numbers as digits whichever way they were written.

import { parseJapaneseNumber } from "@johnmorrisdotca/hikidashi/numerals";

import {
  DASH_BETWEEN_DIGITS,
  JAPANESE_SCRIPT,
  KANJI_BLOCK_NUMERAL,
  KANJI_DIGITS,
  KANJI_NUMERAL_AFTER_CHOME,
  KANJI_NUMERAL_GO,
  KANJI_POSITIONAL_DIGITS,
  LOOKALIKE_CITY,
  NO_BETWEEN_DIGITS,
  SPACES,
} from "./patterns";

// The text with full-width digits, letters and punctuation folded to ASCII and half-width katakana to
// full-width. NFKC does both, and leaves the long-vowel mark ー alone. 巿 (futsu, U+5DFF), which looks like 市
// and is typed for it by mistake, becomes 市: no place in Japan is named with it.
function foldWidth(text: string): string {
  return text.normalize("NFKC").replace(LOOKALIKE_CITY, "市");
}

// A run of kanji numerals as a number: 二十三 is 23, and 一〇一 is 101, read digit by digit, since a
// room or block number is often written that way.
function kanjiNumeralValue(numeral: string): string {
  if (KANJI_POSITIONAL_DIGITS.test(numeral)) {
    return [...numeral].map((character) => String(KANJI_DIGITS.indexOf(character))).join("");
  }
  const value = parseJapaneseNumber(numeral);

  return value === null ? numeral : String(value);
}

/**
 * Turns the kanji numerals that stand for block, floor or room numbers into digits: `一丁目二番三号` becomes `1丁目2番3号`. A
 * numeral that is part of a name stays: `北一条西`, `三番町`, `麻布十番`, `二階堂`.
 *
 * @param text - Japanese text.
 * @returns The text with those numerals as digits.
 * @example
 * ```ts
 * import { kanjiNumeralsToDigits } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(kanjiNumeralsToDigits("二丁目十五番"));
 * // → "2丁目15番"
 * ```
 */
function kanjiNumeralsToDigits(text: string): string {
  return text
    .replace(KANJI_BLOCK_NUMERAL, kanjiNumeralValue)
    .replace(KANJI_NUMERAL_AFTER_CHOME, kanjiNumeralValue)
    .replace(KANJI_NUMERAL_GO, kanjiNumeralValue);
}

/**
 * Makes the text of a Japanese address uniform, as the parser reads it: widths folded, spaces tidied, numerals as
 * digits, and `1の2の3`, `１－２－３` or any other dash written `1-2-3`. The postal mark 〒 is kept.
 *
 * @param text - Japanese text.
 * @returns The text made uniform.
 * @example
 * ```ts
 * import { normalizeJapaneseAddressText } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(normalizeJapaneseAddressText("〒１００-０００５ 東京都千代田区丸の内一丁目二番三号"));
 * // → "〒100-0005 東京都千代田区丸の内1丁目2番3号"
 * ```
 */
function normalizeJapaneseAddressText(text: string): string {
  const folded = foldWidth(text).replace(SPACES, " ").trim();

  return kanjiNumeralsToDigits(folded).replace(NO_BETWEEN_DIGITS, "-").replace(DASH_BETWEEN_DIGITS, "-");
}

// Whether the text is in Japanese script at all.
function hasJapaneseScript(text: string): boolean {
  return JAPANESE_SCRIPT.test(text);
}

export { foldWidth, hasJapaneseScript, kanjiNumeralsToDigits, normalizeJapaneseAddressText };
