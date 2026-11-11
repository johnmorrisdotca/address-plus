// What is Spanish about an address in Spain: the postcode of five digits before the place, the street's type first and its
// number after it (after a comma or not), the floor and the door written as `3º B`, and the province in brackets.

import { spanishPostcodes } from "../constants/es";
import type { PostcodeCountrySpec } from "../country/postcode-country";
import type { ParsedAddress } from "../types/parsed-address";

// A postcode, with E- or ES- before it when written. Any five digits are read as one, so that a code with no province's
// number first is flagged by the validator.
const POSTCODE = /(?<!\d)(?:ES?[-\s]?)?(\d{5})(?!\d)/gi;
const NUMBER =
  "(?:n[ºo°.]?\\.?\\s*|núm\\.?\\s*|num\\.?\\s*)?(\\d{1,5}(?:\\s?(?:bis|duplicado))?(?:\\s?[A-Za-z](?![A-Za-z]))?(?:\\s?[-–/]\\s?\\d{1,5}[A-Za-z]?)?|s\\/n|sn)";
const NUMBER_AT_END = new RegExp(`^(.*?\\S)[\\s,]+${NUMBER}$`, "i");
const NUMBER_ALONE = new RegExp(`^${NUMBER}$`, "i");
const STREET_START =
  /^(?:calle|c\/|c\.\s|cl\.?\s|avenida|avda\.?|av\.?\s|paseo|p\.º|pº|plaza|pza\.?|pl\.?\s|camino|cmno\.?|carretera|ctra\.?|ronda|rda\.?|travesía|trva\.?|glorieta|gta\.?|urbanización|urb\.?|barrio|polígono|pol\.\s|vía|callejón|cjón\.?|bulevar|rambla|costanilla|cuesta|pasaje|pje\.?|plazuela|gran vía|carrer|passeig|plaça|avinguda|rúa|praza|kalea|etorbidea|plaza)(?=[\s./]|$)/i;
const CARE_OF = /^(?:a\/a|a\/at\.?|a la atención de|at\.?n\.?|c\/o|attn\.?)\s*:?\s*(.+)$/i;
const BOX = /^(?:apartado de correos|apartado|apdo\.?)\s*(?:n[ºo°.]?\s*)?(\d+)$/i;
const FLOOR_DOOR = /^(\d{1,2})\s?[ºª°]\.?\s*[-,]?\s*([A-Za-z0-9]{1,6}[ºª]?|izq(?:uierda)?|izda|dcha|derecha)?$/i;
const FLOOR_WORD = /^(bajo|bajos|entresuelo|ático|atico|sótano|sotano|principal)\s*([A-Za-z0-9]{1,6})?$/i;
const FLOOR_NAMED = /^(?:piso|planta)\s+(\d{1,2})\s*([A-Za-z0-9]{1,6})?$/i;
const DOOR = /^(?:puerta|pta\.?)\s+([A-Za-z0-9]{1,6})$/i;
const STAIRCASE = /^(?:escalera|esc\.?)\s+([A-Za-z0-9]{1,4})$/i;
const ENTRANCE = /^portal\s+([A-Za-z0-9]{1,4})$/i;
const UNIT = /^(local|oficina|despacho|nave|edificio)\s+([A-Za-z0-9-]{1,6})$/i;

const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
// A door as written: a letter or a number in capitals, a word (izda, dcha) in lower case.
const doorForm = (text: string): string => {
  const door = text.replace(/[ºª]$/, "");

  return door.length <= 2 ? door.toUpperCase() : door.toLowerCase();
};

function takeDelivery(part: string, result: ParsedAddress): string {
  const careOf = CARE_OF.exec(part);
  if (careOf && !result.careOf) {
    result.careOf = careOf[1].trim();

    return "";
  }
  const box = BOX.exec(part);
  if (box && !result.secUnitType) {
    result.secUnitType = "Apartado de Correos";
    result.secUnitNum = box[1];

    return "";
  }
  // A number on its own after a street with none: "Calle Mayor, 12".
  if (result.street && !result.number) {
    const alone = NUMBER_ALONE.exec(part);
    if (alone) {
      result.number = alone[1].replace(/\s+/g, "").toUpperCase();

      return "";
    }
  }
  const floor = FLOOR_DOOR.exec(part) ?? FLOOR_NAMED.exec(part);
  if (floor && !result.floorType) {
    result.floorType = "Piso";
    result.floor = floor[1];
    if (floor[2]) {
      result.secUnitType = "Puerta";
      result.secUnitNum = doorForm(floor[2]);
    }

    return "";
  }
  const word = FLOOR_WORD.exec(part);
  if (word && !result.floorType) {
    result.floorType = capital(word[1].replace(/^atico$/i, "ático").replace(/^sotano$/i, "sótano"));
    if (word[2]) {
      result.secUnitType = "Puerta";
      result.secUnitNum = doorForm(word[2]);
    }

    return "";
  }
  const door = DOOR.exec(part);
  if (door && !result.secUnitType) {
    result.secUnitType = "Puerta";
    result.secUnitNum = doorForm(door[1]);

    return "";
  }
  const staircase = STAIRCASE.exec(part);
  if (staircase && !result.staircase) {
    result.staircase = staircase[1].toUpperCase();

    return "";
  }
  const entrance = ENTRANCE.exec(part);
  if (entrance && !result.entrance) {
    result.entrance = entrance[1].toUpperCase();

    return "";
  }
  const unit = UNIT.exec(part);
  if (unit && !result.secUnitType) {
    result.secUnitType = capital(unit[1]);
    result.secUnitNum = unit[2].toUpperCase();

    return "";
  }

  return part;
}

function readStreet(part: string, result: ParsedAddress): boolean {
  const found = NUMBER_AT_END.exec(part);
  if (found) {
    result.street = found[1].replace(/,$/, "");
    result.number = found[2].replace(/\s+/g, "").toUpperCase();

    return true;
  }
  if (STREET_START.test(part)) {
    result.street = part;

    return true;
  }

  return false;
}

// A postcode and a place that end the address, a Spanish street's type at the start of a part, and no state's code before
// the postcode (Calle Ocho, Miami, FL 33135).
const POSTCODE_LINE = /(?:^|[\s,])(?:ES?[-\s]?)?(?:0[1-9]|[1-4]\d|5[0-2])\d{3}\s+\p{L}[^,]*(?:,[^,]*)?$/iu;

function detectShape(text: string): boolean {
  const line = POSTCODE_LINE.exec(text);
  if (!line) return false;
  const before = text.slice(0, line.index + (/^[\s,]/.test(line[0]) ? 1 : 0));
  if (/\b[A-Z]{2}[\s,]+$/.test(before)) return false;

  return before.split(",").some((part) => STREET_START.test(part.trim()) || BOX.test(part.trim()));
}

// A street's type in one form: Calle, C/ and Cl. are one; so are Avenida, Avda. and Av.; and "de" after the type is left out.
const TYPE_FORMS: readonly (readonly [RegExp, string])[] = [
  [/^(?:CALLE|C\/|C\.|CL\.?)(?=\s|$)/, "CALLE"],
  [/^(?:AVENIDA|AVDA\.?|AV\.?)(?=\s|$)/, "AVENIDA"],
  [/^(?:PASEO|P\.O|PO|PS)(?=\s|$)/, "PASEO"],
  [/^(?:PLAZA|PZA\.?|PL\.?)(?=\s|$)/, "PLAZA"],
  [/^(?:CARRETERA|CTRA\.?)(?=\s|$)/, "CARRETERA"],
  [/^(?:TRAVESIA|TRVA\.?)(?=\s|$)/, "TRAVESIA"],
];

function streetForm(folded: string): string {
  let text = folded.replace(/^C\//, "CALLE ");
  for (const [pattern, type] of TYPE_FORMS) text = text.replace(pattern, type);

  return text.replace(/^(\S+) (?:DE LA|DEL|DE LOS|DE LAS|DE) /, "$1 ").replace(/\s+/g, " ");
}

const spanishSpec: PostcodeCountrySpec = {
  code: "ES",
  name: "Spain",
  names: ["SPAIN", "ESPANA", "REINO DE ESPANA", "KINGDOM OF SPAIN"],
  codes: ["ES"],
  postcode: POSTCODE,
  list: "GeoNames' list for Spain",
  shape: "five digits, the first two a province's number (01 to 52)",
  isValid: spanishPostcodes.isValid,
  isKnown: spanishPostcodes.isKnown,
  normalize: (postcode) => postcode.trim(),
  regionOf: spanishPostcodes.regionOf,
  takeDelivery,
  readStreet,
  detectShape,
  streetForm,
};

export { spanishSpec };
