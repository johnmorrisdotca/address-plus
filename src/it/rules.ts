// What is Italian about an address in Italy: the postcode (CAP) of five digits before the place and the province's sigla
// after it, the street's type first and its number after it (`Via Roma, 12/A`), and the staircase, the flat and the floor.

import { findItalianProvince, italianPostcodes } from "../constants/it";
import type { PostcodeCountrySpec } from "../country/postcode-country";
import type { ParsedAddress } from "../types/parsed-address";

const POSTCODE = /(?<!\d)(?:I[-\s]?|IT[-\s]?)?(\d{5})(?!\d)/gi;
const STREET_START =
  /^(?:via|v\.|viale|v\.le|vle|corso|c\.so|piazza|p\.zza|p\.za|piazzale|p\.le|largo|l\.go|vicolo|strada|str\.|lungotevere|lungarno|lungomare|borgo|contrada|salita|calata|traversa|stradone|galleria|ponte|rampa|vico|rione|via)(?=[\s./]|$)/i;
// The civic number: 12, 12A, 12/A, 12 bis, 12/2, 12-14, "n. 12", or snc (senza numero civico).
const NUMBER =
  "(?:n[°º.]?\\.?\\s*|civico\\s+)?(\\d{1,5})(?:\\s?\\/\\s?([A-Za-z0-9]{1,2})|\\s?-\\s?(\\d{1,5}[A-Za-z]?)|\\s+(bis|ter|quater)|\\s?([A-Za-z])(?![A-Za-z]))?|(s\\.?n\\.?c\\.?)";
const NUMBER_AT_END = new RegExp(`^(.*?\\S)[\\s,]+(?:${NUMBER})$`, "i");
const NUMBER_ALONE = new RegExp(`^(?:${NUMBER})$`, "i");
const CARE_OF = /^(?:presso|c\/o|a\/c|all'att\.?(?:ne)?|att\.?(?:ne)?|alla c\.a\.)\s*:?\s*(.+)$/i;
const BOX = /^(?:casella postale|c\.p\.|cp)\s*(?:n[°º.]?\s*)?(\d+)$/i;
const STAIRCASE = /^(?:scala|sc\.)\s+([A-Za-z0-9]{1,3})$/i;
const INTERNAL = /^(?:interno|int\.?)\s*(?:n[°º.]?\s*)?([A-Za-z0-9]{1,4})$/i;
const FLOOR =
  /^(?:(?:piano|p\.)\s*(\d{1,2}|terra|rialzato|primo|secondo|terzo|quarto|quinto)|(\d{1,2})\s*[°º]\s*piano)$/i;
const BUILDING = /^(?:palazzo|condominio|residence|edificio|torre)\s+.+$/i;
const LOCALITY = /^(?:loc\.?|località|localita|fraz\.?|frazione)\s+(.+)$/i;

function takeDelivery(part: string, result: ParsedAddress): string {
  const careOf = CARE_OF.exec(part);
  if (careOf && !result.careOf) {
    result.careOf = careOf[1].trim();

    return "";
  }
  const box = BOX.exec(part);
  if (box && !result.secUnitType) {
    result.secUnitType = "Casella Postale";
    result.secUnitNum = box[1];

    return "";
  }
  if (result.street && !result.number) {
    const alone = NUMBER_ALONE.exec(part);
    if (alone) {
      readNumber(alone, result);

      return "";
    }
  }
  const staircase = STAIRCASE.exec(part);
  if (staircase && !result.staircase) {
    result.staircase = staircase[1].toUpperCase();

    return "";
  }
  const internal = INTERNAL.exec(part);
  if (internal && !result.secUnitType) {
    result.secUnitType = "Interno";
    result.secUnitNum = internal[1].toUpperCase();

    return "";
  }
  const floor = FLOOR.exec(part);
  if (floor && !result.floorType) {
    result.floorType = "Piano";
    result.floor = (floor[1] ?? floor[2]).toLowerCase();

    return "";
  }
  if (BUILDING.test(part) && !result.building) {
    result.building = part;

    return "";
  }
  const locality = LOCALITY.exec(part);
  if (locality && !result.locality) {
    result.locality = locality[1];

    return "";
  }

  return part;
}

// A match of NUMBER gives the number (1), its letter or sub-number after a slash (2), a range's end (3), bis/ter/quater
// (4), a letter written close (5), or snc (6).
function readNumber(found: RegExpExecArray, result: ParsedAddress, offset = 0): void {
  const at = (index: number): string | undefined => found[index + offset];
  if (at(6)) {
    result.number = "SNC";

    return;
  }
  result.number = at(3) ? `${at(1)}-${at(3)?.toUpperCase()}` : at(1);
  const extension = at(2) ?? at(4) ?? at(5);
  if (extension)
    result.numberExtension = /^(bis|ter|quater)$/i.test(extension) ? extension.toLowerCase() : extension.toUpperCase();
}

function readStreet(part: string, result: ParsedAddress): boolean {
  const found = NUMBER_AT_END.exec(part);
  if (found) {
    result.street = found[1].replace(/,$/, "");
    readNumber(found, result, 1);

    return true;
  }
  if (STREET_START.test(part)) {
    result.street = part;

    return true;
  }

  return false;
}

// "Roma RM", "Roma (RM)", "Reggio Emilia - RE": the city, and the province's sigla when it is one that exists.
function readPlace(text: string, result: ParsedAddress): void {
  const cleaned = text.replace(/[\s,]+$/, "");
  const sigla = /^(.*?\S)\s*(?:\(\s*([A-Za-z]{2})\s*\)|[\s/-]+([A-Z]{2}))$/.exec(cleaned);
  const code = sigla ? (sigla[2] ?? sigla[3]).toUpperCase() : undefined;
  if (sigla && code && findItalianProvince(code)?.code === code) {
    result.city = sigla[1].replace(/[\s,-]+$/, "");
    result.state = code;

    return;
  }
  result.city = cleaned;
}

const POSTCODE_LINE = /(?:^|[\s,])(?:I[-\s]?|IT[-\s]?)?\d{5}\s+\p{L}[^,]*$/iu;

function detectShape(text: string): boolean {
  const line = POSTCODE_LINE.exec(text);
  if (!line) return false;
  const before = text.slice(0, line.index + (/^[\s,]/.test(line[0]) ? 1 : 0));
  if (/\b[A-Z]{2}[\s,]+$/.test(before)) return false;

  return before.split(",").some((part) => STREET_START.test(part.trim()) || BOX.test(part.trim()));
}

const TYPE_FORMS: readonly (readonly [RegExp, string])[] = [
  [/^(?:VLE|VIALE)(?=\s|$)/, "VIALE"],
  [/^(?:V|VIA)(?=\s|$)/, "VIA"],
  [/^(?:CSO|CORSO)(?=\s|$)/, "CORSO"],
  [/^(?:PZZA|PZA|PIAZZA)(?=\s|$)/, "PIAZZA"],
  [/^(?:PLE|PIAZZALE)(?=\s|$)/, "PIAZZALE"],
  [/^(?:LGO|LARGO)(?=\s|$)/, "LARGO"],
  [/^(?:STR|STRADA)(?=\s|$)/, "STRADA"],
];

// A street's type in one form (Via, V. and via are one; so are Piazza, P.zza and P.za), and the article after it left out.
function streetForm(folded: string): string {
  let text = folded;
  for (const [pattern, type] of TYPE_FORMS) text = text.replace(pattern, type);

  return text.replace(/^(\S+) (?:DEL|DELLO|DELLA|DEI|DEGLI|DELLE|DI|D'|DE) ?/, "$1 ").replace(/\s+/g, " ");
}

const italianSpec: PostcodeCountrySpec = {
  code: "IT",
  name: "Italy",
  names: ["ITALY", "ITALIA", "REPUBBLICA ITALIANA"],
  codes: ["IT"],
  postcode: POSTCODE,
  list: "GeoNames' list for Italy",
  shape: "five digits",
  isValid: italianPostcodes.isValid,
  isKnown: italianPostcodes.isKnown,
  normalize: (postcode) => postcode.trim(),
  regionOf: italianPostcodes.regionOf,
  takeDelivery,
  readStreet,
  readPlace,
  detectShape,
  streetForm,
};

export { italianSpec };
