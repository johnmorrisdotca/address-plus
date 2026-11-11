// What is Dutch about an address in the Netherlands: the postcode of four digits and two letters before the place, the
// house number after the street with its addition (a letter, a floor, `bis`), and the box.

import { dutchPostcodes, normalizeDutchPostcode } from "../constants/nl";
import type { PostcodeCountrySpec } from "../country/postcode-country";
import type { ParsedAddress } from "../types/parsed-address";

// A postcode, with NL- before it when written: "1015 CJ", "1015CJ", "NL-1015 CJ".
// Any four digits and two letters are read as a postcode, so that one that is none (0123 AB, 1015 SS) is flagged by the validator
// and not taken for a part of the street.
const POSTCODE = /(?<![\dA-Za-z])(?:NL[-\s]?)?(\d{4}\s?[A-Za-z]{2})(?![A-Za-z\d])/gi;
// The house number and its addition at the end: "123", "123A", "123 A", "123-2", "123 bis", "123 hs", "123-III".
const NUMBER_AT_END =
  /^(.*?\S)\s+(?:nr\.?\s*)?(\d{1,5})(?:(?:\s*[-/]\s*|\s+)(\d{1,4}|[IVX]{1,4}|[A-Za-z]{1,3}|bis|huis)|([A-Za-z]))?$/;
const BOX = /^(postbus|antwoordnummer)\s*(?:nr\.?\s*)?(\d+)$/i;
const CARE_OF = /^(?:t\.?a\.?v\.?|ter attentie van|per adres|p\/a|c\/o)\s+(.+)$/i;
const STREET_ENDING =
  /(?:straat|laan|gracht|weg|plein|kade|singel|dijk|steeg|pad|hof|park|dreef|markt|baan|brug|plantsoen|boulevard|haven|loop|ring|poort|erf|weide)$/i;

const wordsOf = (text: string): string[] => text.split(/\s+/).filter((word) => word !== "");

function takeDelivery(part: string, result: ParsedAddress): string {
  const careOf = CARE_OF.exec(part);
  if (careOf && !result.careOf) {
    result.careOf = careOf[1].trim();

    return "";
  }
  const box = BOX.exec(part);
  if (box && !result.secUnitType) {
    result.secUnitType = "Postbus";
    result.secUnitNum = box[2];

    return "";
  }

  return part;
}

// An addition as written on the door: a floor's digits, a letter or a roman numeral in capitals, a word in lower case.
const additionForm = (addition: string): string =>
  /^\d+$/.test(addition) ||
  /^[A-Za-z]$/.test(addition) ||
  (/^[IVX]+$/i.test(addition) && addition === addition.toUpperCase())
    ? addition.toUpperCase()
    : addition.toLowerCase();

function readStreet(part: string, result: ParsedAddress): boolean {
  const found = NUMBER_AT_END.exec(part);
  if (found) {
    result.street = found[1];
    result.number = found[2];
    const addition = found[3] ?? found[4];
    if (addition) result.numberExtension = additionForm(addition);

    return true;
  }
  const last = wordsOf(part).pop() ?? "";
  if (STREET_ENDING.test(last)) {
    result.street = part;

    return true;
  }

  return false;
}

// A line that begins with four digits and two letters, then a place, and ends the address, with no digit after it (a ZIP code
// at the end is another country's).
const POSTCODE_LINE = /(?:^|,\s*)(?:NL[-\s]?)?[1-9]\d{3}\s?(?!SA|SD|SS)[A-Za-z]{2}\s+\p{L}[^,\d]*$/u;

const dutchSpec: PostcodeCountrySpec = {
  code: "NL",
  name: "the Netherlands",
  names: ["NETHERLANDS", "THE NETHERLANDS", "NEDERLAND", "HOLLAND"],
  codes: ["NL"],
  postcode: POSTCODE,
  list: "CBS's list of Dutch postcode areas",
  shape: "four digits and two letters",
  isValid: dutchPostcodes.isValid,
  isKnown: dutchPostcodes.isKnown,
  normalize: normalizeDutchPostcode,
  regionOf: () => undefined,
  takeDelivery,
  readStreet,
  detectShape: (text) => POSTCODE_LINE.test(text),
  streetForm: (folded) => folded.replace(/(\p{L})STR$/u, "$1STRAAT"),
  // A Postbus has a postcode of its own, which no area of CBS's list holds.
  skipsList: (address) => address.secUnitType === "Postbus",
};

export { dutchSpec };
