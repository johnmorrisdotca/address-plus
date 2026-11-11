// What is Brazilian about an address in Brazil: the street's type first and its number after a comma (`Avenida Paulista, 1578`),
// the complement (apartment, block, room), the bairro after a hyphen or a comma, the city and the state's code (`São Paulo -
// SP`), and the CEP of eight digits last, written 01310-200.

import {
  findBrazilianState,
  getStateFromBrazilianPostcode,
  isKnownBrazilianPostcode,
  isValidBrazilianPostcode,
  normalizeBrazilianPostcode,
} from "../constants/br";
import type { PostcodeCountrySpec } from "../country/postcode-country";
import type { ParsedAddress } from "../types/parsed-address";

const POSTCODE = /(?<!\d)(?:CEP\s*[:\-.]?\s*)?(\d{5}-?\d{3})(?!\d)(?=[\s,.]*$)/gi;
const STREET_START =
  /^(?:rua|r\.|avenida|av\.?|alameda|al\.|travessa|tv\.|trav\.|pra[cç]a|p[cç]a\.?|rodovia|rod\.|estrada|estr\.|largo|viela|beco|via|parque|quadra|setor|passagem|vila)(?=[\s.]|$)/i;
const NUMBER = "(?:n[ºo°.]?\\.?\\s*)?(\\d{1,6}[A-Za-z]?(?:\\s?[-/]\\s?\\d{1,6}[A-Za-z]?)?|s\\/n|sn|s\\.n\\.)";
const NUMBER_AT_END = new RegExp(`^(.*?\\S)[\\s,]+${NUMBER}$`, "i");
const NUMBER_PART = new RegExp(`^${NUMBER}(?:\\s*[-–]\\s*(.+))?$`, "i");
const UNIT =
  /^(apto|ap\.?|apartamento|sala|conjunto|cj\.?|casa|loja|fundos|sobreloja|box)\.?\s*(?:n[ºo°.]?\s*)?([A-Za-z0-9/-]+)?$/i;
const BLOCK = /^(?:bloco|bl\.?|torre|edif[ií]cio|ed\.?)\s+(.+)$/i;
const FLOOR = /^(?:(\d{1,3})\s*[ºo°]?\s*andar|andar\s+(\d{1,3}))$/i;
const CARE_OF = /^(?:a\/c|aos cuidados de|ac|att\.?|c\/o)\s*:?\s*(.+)$/i;
const BOX = /^(?:caixa postal|cx\.?\s*postal|cp)\s*(\d+)$/i;

const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

function takeDelivery(part: string, result: ParsedAddress): string {
  const careOf = CARE_OF.exec(part);
  if (careOf && !result.careOf) {
    result.careOf = careOf[1].trim();

    return "";
  }
  const box = BOX.exec(part);
  if (box && !result.secUnitType) {
    result.secUnitType = "Caixa Postal";
    result.secUnitNum = box[1];

    return "";
  }
  if (!result.number) {
    const number = NUMBER_PART.exec(part);
    if (number) {
      result.number = number[1].replace(/\s+/g, "").toUpperCase();
      if (number[2]) return number[2].trim();

      return "";
    }
  }
  const floor = FLOOR.exec(part);
  if (floor && !result.floorType) {
    result.floorType = "Andar";
    result.floor = floor[1] ?? floor[2];

    return "";
  }
  const block = BLOCK.exec(part);
  if (block && !result.building) {
    result.building = part;

    return "";
  }
  const unit = UNIT.exec(part);
  if (unit && !result.secUnitType) {
    const kind = unit[1].replace(/\.$/, "").toLowerCase();
    result.secUnitType = /^ap(to|artamento)?$/.test(kind) ? "Apto" : kind === "cj" ? "Conjunto" : capital(kind);
    if (unit[2]) result.secUnitNum = unit[2].toUpperCase();

    return "";
  }

  return part;
}

function readStreet(part: string, result: ParsedAddress): boolean {
  const found = NUMBER_AT_END.exec(part);
  if (found && STREET_START.test(found[1])) {
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

// "São Paulo - SP", "São Paulo/SP", "São Paulo SP": the city, and the state's code when it is one.
function readPlace(text: string, result: ParsedAddress): void {
  const cleaned = text.replace(/[\s,\-–:]+$/, "");
  const found = /^(.*?\S)\s*(?:[-–/]|\s)\s*([A-Za-z]{2})$/.exec(cleaned);
  const state = found ? findBrazilianState(found[2]) : undefined;
  if (found && state && found[2] === found[2].toUpperCase() && !result.state) {
    result.city = found[1].replace(/[\s,\-–]+$/, "");
    result.state = state.code;

    return;
  }
  result.city = cleaned;
}

// A CEP written with its hyphen, five digits and three, ending the address, whose range a state holds, and a sign of Brazil with
// it: the word CEP before it, or one of the twenty-seven states' codes (SP, RJ) before it.
const CEP_LINE = /(?<!\d)\d{5}-\d{3}\s*$/;
const CEP_WORD = /\bCEP\b\s*[:.-]?\s*\d{5}-\d{3}\s*$/i;
const STATE_BEFORE_CEP = /(?:^|[\s,/-])([A-Z]{2})[\s,]*(?:CEP\s*[:.-]?\s*)?\d{5}-\d{3}\s*$/;

function detectShape(text: string): boolean {
  if (!CEP_LINE.test(text) || !isKnownBrazilianPostcode(text.trim().slice(-9))) return false;
  const state = STATE_BEFORE_CEP.exec(text);

  return CEP_WORD.test(text) || (state !== null && findBrazilianState(state[1]) !== undefined);
}

const TYPE_FORMS: readonly (readonly [RegExp, string])[] = [
  [/^(?:RUA|R)(?=\s|$)/, "RUA"],
  [/^(?:AVENIDA|AV)(?=\s|$)/, "AVENIDA"],
  [/^(?:ALAMEDA|AL)(?=\s|$)/, "ALAMEDA"],
  [/^(?:TRAVESSA|TV|TRAV)(?=\s|$)/, "TRAVESSA"],
  [/^(?:PRACA|PCA)(?=\s|$)/, "PRACA"],
  [/^(?:RODOVIA|ROD)(?=\s|$)/, "RODOVIA"],
  [/^(?:ESTRADA|ESTR)(?=\s|$)/, "ESTRADA"],
];

// A street's type in one form (Rua and R., Avenida and Av., and the preposition after the type left out).
function streetForm(folded: string): string {
  let text = folded;
  for (const [pattern, type] of TYPE_FORMS) text = text.replace(pattern, type);

  return text.replace(/^(\S+) (?:DA|DE|DO|DAS|DOS) /, "$1 ").replace(/\s+/g, " ");
}

const brazilianSpec: PostcodeCountrySpec = {
  code: "BR",
  name: "Brazil",
  names: ["BRAZIL", "BRASIL", "FEDERATIVE REPUBLIC OF BRAZIL", "REPUBLICA FEDERATIVA DO BRASIL"],
  codes: ["BR"],
  postcode: POSTCODE,
  placeFirst: true,
  list: "the ranges of CEPs the Correios gave the states",
  shape: "eight digits, written 01310-200",
  isValid: isValidBrazilianPostcode,
  isKnown: isKnownBrazilianPostcode,
  normalize: normalizeBrazilianPostcode,
  regionOf: getStateFromBrazilianPostcode,
  regionFromName: (text) =>
    text.length === 2 && text === text.toUpperCase() ? findBrazilianState(text)?.code : undefined,
  takeDelivery,
  readStreet,
  readPlace,
  splitPart: (part) => part.split(/\s+[-–]\s+/).filter((piece) => piece !== ""),
  detectShape,
  streetForm,
};

export { brazilianSpec };
