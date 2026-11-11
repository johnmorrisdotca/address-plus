// What the countries that come with a postcode table share: reading an address as parts split by commas, with the line of
// the postcode and the place found first, the street and its number read by the country's own rules, and every other part
// taken for what its country's words say it is; the validator, the comparer and the detection that go with it. A country
// is a `PostcodeCountrySpec`, with its postcode's shape, its lookups and the few rules of its own.

import type { CountryComparison, CountryModule, CountryValidation } from "../types/country-module";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";
import type { ValidationOptions } from "../types/validation";
import { comparable, compareFields, finding, partsOf, snakeCased, tidyAddressText } from "./shared";

interface PostcodeCountrySpec {
  code: string; // NL
  name: string; // the Netherlands
  names: readonly string[]; // The country's names at the end of an address, in capitals with no accents
  codes: readonly string[]; // The ISO codes that follow a comma at the end of an address: NL
  postcode: RegExp; // One postcode in a text, global and case-insensitive, with any country code before it; group 1 is the postcode
  placeFirst?: boolean; // The place stands before the postcode (New Zealand), not after it
  list: string; // The list the postcode is looked up in, for a message: CBS's list of postcode areas
  shape: string; // What a postcode looks like, for a message: four digits and two letters
  isValid(postcode: string): boolean;
  isKnown(postcode: string): boolean;
  normalize(postcode: string): string;
  regionOf(postcode: string): string | undefined;
  // What a part holds apart from the street: a floor, a flat, a box, a care-of line. Sets what it finds and returns what is
  // left of the part (nothing when the part was all of it).
  takeDelivery(part: string, result: ParsedAddress): string;
  // The street and its number from one part; false when the part is no street.
  readStreet(part: string, result: ParsedAddress): boolean;
  // The place after the postcode (or before it, with `placeFirst`): the city, and what else is on the line.
  readPlace?(text: string, result: ParsedAddress): void;
  // With `placeFirst`: the region's code when a text is the name of one (a state written on its own part before the postcode).
  regionFromName?(text: string, previous?: string): string | undefined;
  // A part of the address that is several (Brazil's `1578 - Apto 45 - Bela Vista`): the parts it holds.
  splitPart?(part: string): string[];
  // Whether an address with no country written is surely this country's, given its text and the address as read.
  detectShape(text: string): boolean;
  // A street's form for comparing: the type written in full or short, in one spelling.
  streetForm?(folded: string): string;
  // Whether a street with no number is as it should be (a street alone, a box, a place with no number).
  requiresNumber?: boolean;
  // Whether the list is no judge of an address's postcode: a box's postcode may be none of an area's (Postbus).
  skipsList?(address: ParsedAddress): boolean;
  // The region of a postcode is the one most places of a list are in, so a postcode can cross a border: a region that disagrees is
  // a warning even when postal findings are errors.
  approximateRegion?: boolean;
}

// Letters with no accents, in capitals: the form a name is looked up in.
function folded(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "SS").toUpperCase();
}

const FIELD_ORDER: readonly (keyof ParsedAddress)[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "entrance",
  "number",
  "numberExtension",
  "street",
  "place",
  "locality",
  "city",
  "county",
  "state",
  "zip",
  "zipValid",
  "country",
];

function ordered(result: ParsedAddress): ParsedAddress {
  const out: Record<string, unknown> = {};
  for (const field of FIELD_ORDER) if (result[field] !== undefined) out[field] = result[field];

  return out as ParsedAddress;
}

// A country at the end of the text, written out or as its code after a comma: what is before it, or null.
function takeCountry(text: string, spec: PostcodeCountrySpec): string | null {
  const caps = folded(text);
  for (const name of [...spec.names].sort((a, b) => b.length - a.length)) {
    const at = caps.length - name.length;
    if (at < 0 || caps.slice(at) !== name || (at > 0 && !/[\s,]/.test(caps[at - 1]))) continue;

    return text.slice(0, at);
  }
  // A code after a comma ends the address; after a space only when there is a postcode, so that a place is not taken for one.
  // A country with no code of its own here (India's IN is Indiana's too) is told by its name alone.
  if (spec.codes.length === 0) return null;
  const separator = spec.postcode.test(text) ? "[,\\s]" : ",";
  spec.postcode.lastIndex = 0;
  const code = new RegExp(`${separator}\\s*(?:${spec.codes.join("|")})\\s*$`, "i").exec(text);

  return code ? text.slice(0, code.index) : null;
}

// The last postcode of a text, with where it stands.
function lastPostcode(work: string, spec: PostcodeCountrySpec): { code: string; index: number; end: number } | null {
  const found = [...work.matchAll(spec.postcode)];
  const last = found[found.length - 1];
  if (!last || last.index === undefined) return null;

  return { code: last[1], index: last.index, end: last.index + last[0].length };
}

// The parts before the line of the place, in order: what each is decides where it goes. A name before the street is the
// building's, one after it the locality's.
function readDelivery(parts: string[], result: ParsedAddress, spec: PostcodeCountrySpec): void {
  const before: string[] = [];
  const after: string[] = [];
  let found = false;
  for (const part of parts) {
    const rest = spec.takeDelivery(part, result);
    if (rest === "") continue;
    if (!found && spec.readStreet(rest, result)) found = true;
    else (found ? after : before).push(rest);
  }
  const boxed = result.secUnitType !== undefined && result.street === undefined;
  if (!found && !boxed && before.length > 0 && !result.locality) result.locality = before.pop();
  if (before.length > 0) result.building = before.join(", ");
  if (after.length > 0) {
    if (!result.locality) result.locality = after.shift();
    if (after.length > 0) result.building = [result.building, ...after].filter(Boolean).join(", ");
  }
}

// What the line of the postcode and the place gives: the place's name is the city; a second name after a comma is the
// county, and so is one in brackets.
function readPlaceDefault(text: string, result: ParsedAddress): void {
  const bracket = /^(.*?)\s*[([]([^)\]]+)[)\]]\s*$/.exec(text);
  const [city, county] = bracket ? [bracket[1], bracket[2]] : partsOf(text);
  if (city) result.city = city.replace(/[\s,]+$/, "");
  if (county) result.county = county.trim();
}

/**
 * Reads an address for a country with a postcode table: splits it into its parts and gives what it finds in the fields.
 * Used by each country's own parser, which passes its rules.
 */
function parsePostcodeCountry(
  text: string,
  spec: PostcodeCountrySpec,
  options: ParseOptions = {},
): ParsedAddress | null {
  if (!text || typeof text !== "string") return null;
  let work = tidyAddressText(text);
  const result: ParsedAddress = {};
  const rest = takeCountry(work, spec);
  const namesCountry = rest !== null;
  if (rest !== null) work = tidyAddressText(rest);

  const postcode = lastPostcode(work, spec);
  let placeText = "";
  if (postcode) {
    result.zip = spec.normalize(postcode.code);
    if (spec.placeFirst) {
      // The place is the words before the postcode in its part, or the part before when the postcode stands alone.
      const before = work.slice(0, postcode.index);
      const cut = before.lastIndexOf(",");
      placeText = before
        .slice(cut + 1)
        .replace(/[\s\-–:]+$/, "")
        .trim();
      work = tidyAddressText(before.slice(0, cut < 0 ? 0 : cut));
      // With nothing between the last comma and the postcode, the part before is the place.
      if (placeText === "") {
        const parts = partsOf(work);
        const probe: ParsedAddress = {};
        const before = parts[parts.length - 1];
        if (before !== undefined && spec.takeDelivery(before, probe) === before && !spec.readStreet(before, probe)) {
          placeText = parts.pop() ?? "";
          work = tidyAddressText(parts.join(", "));
        }
      }
      // A region written on its own before the postcode: the place is the part before it, unless that is a street.
      const regionName = placeText === "" ? undefined : spec.regionFromName?.(placeText, partsOf(work).pop());
      if (regionName) {
        result.state = regionName;
        const parts = partsOf(work);
        const probe: ParsedAddress = {};
        const before = parts[parts.length - 1];
        const isStreet =
          before !== undefined && (spec.takeDelivery(before, probe) !== before || spec.readStreet(before, probe));
        if (parts.length > 0 && !isStreet) {
          placeText = parts.pop() ?? "";
          work = tidyAddressText(parts.join(", "));
        }
      }
    } else {
      placeText = work.slice(postcode.end).replace(/^[\s,]+/, "");
      work = tidyAddressText(work.slice(0, postcode.index));
    }
  }
  const parts = partsOf(work).flatMap((part) => spec.splitPart?.(part) ?? [part]);
  if (placeText !== "") (spec.readPlace ?? readPlaceDefault)(placeText, result);
  else if (!postcode && parts.length >= 2 && namesCountry) {
    // With no postcode, the last part is the place unless it reads as a street.
    const probe: ParsedAddress = {};
    const last = parts[parts.length - 1];
    if (spec.takeDelivery(last, probe) === last && !spec.readStreet(last, probe))
      (spec.readPlace ?? readPlaceDefault)(parts.pop() ?? "", result);
  }
  readDelivery(parts, result, spec);

  // Words with nothing that makes them an address (no postcode, street or box, and no country written) are not one.
  const anchored = namesCountry || [result.zip, result.street, result.secUnitType, result.number].some(Boolean);
  if (!anchored || Object.keys(result).length === 0) return null;
  if (result.zip) {
    result.zipValid = spec.isValid(result.zip);
    const region = spec.regionOf(result.zip);
    if (region && !result.state) result.state = region;
  }
  result.country = spec.code as ParsedAddress["country"];

  return options.useSnakeCase ? snakeCased(ordered(result)) : ordered(result);
}

/**
 * Whether an address is surely a country's: it ends with the country's name or code, or has the shape only its
 * addresses have (the country's rule).
 */
function looksLikePostcodeCountry(text: string, spec: PostcodeCountrySpec): boolean {
  if (!text || typeof text !== "string") return false;
  const work = tidyAddressText(text);

  return takeCountry(work, spec) !== null || spec.detectShape(work);
}

/**
 * The findings for an address in a country with a postcode table: the postcode's shape, whether the list has it, whether
 * the region written agrees with the postcode's, and that the place and the street's number are given.
 */
function validatePostcodeCountry(
  address: ParsedAddress,
  spec: PostcodeCountrySpec,
  options: ValidationOptions = {},
): CountryValidation {
  const errors: CountryValidation["errors"] = [];
  const warnings: CountryValidation["warnings"] = [];
  if (!address) return { errors, warnings };
  const strict = options.strictPostalValidation === true;
  const add = (found: ReturnType<typeof finding>): void => {
    (found.severity === "error" ? errors : warnings).push(found);
  };

  const { zip } = address;
  if (zip) {
    if (!spec.isValid(zip)) {
      add(finding("zip", "INVALID_POSTAL_FORMAT", `Postcode ${zip} is not ${spec.shape}`, strict));
    } else if (!spec.isKnown(zip) && !spec.skipsList?.(address)) {
      add(finding("zip", "UNRECOGNIZED_POSTAL_CODE", `Postcode ${zip} is not in ${spec.list}`, strict));
    } else {
      const region = spec.regionOf(zip);
      if (region && address.state && address.state !== region) {
        add(
          finding(
            "state",
            "POSTAL_REGION_MISMATCH",
            `Postcode ${zip} is in ${region}, not ${address.state}`,
            strict && spec.approximateRegion !== true,
          ),
        );
      }
    }
  } else {
    add(finding("zip", "MISSING_POSTAL_CODE", "Postcode not specified", false));
  }
  if (!address.city) add(finding("city", "MISSING_CITY", "Place not specified", false));
  if (spec.requiresNumber !== false && address.street && !address.number) {
    add(finding("number", "MISSING_STREET_NUMBER", "Street number not specified", false));
  }

  return { errors, warnings };
}

const COMPARED: readonly (keyof ParsedAddress)[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floor",
  "staircase",
  "entrance",
  "street",
  "number",
  "numberExtension",
  "city",
  "zip",
];

// A field in one form: no accents, capitals, no full stops or spaces in a code or a number.
function comparableForm(
  spec: PostcodeCountrySpec,
  field: keyof ParsedAddress,
  value: string | undefined,
): string | undefined {
  const text = comparable(value === undefined ? undefined : folded(value));
  if (text === undefined) return undefined;
  if (field === "street") return spec.streetForm ? spec.streetForm(text) : text;
  if (field === "zip" || field === "number" || field === "numberExtension" || field === "secUnitNum") {
    return text.replace(/[\s-]+/g, "");
  }

  return text;
}

/** Compares two addresses in a country with a postcode table, field by field, each first put in one form. */
function comparePostcodeCountry(
  first: ParsedAddress,
  second: ParsedAddress,
  spec: PostcodeCountrySpec,
): CountryComparison {
  return compareFields(first, second, COMPARED, (field, value) => comparableForm(spec, field, value));
}

// The module a country's entry point exports, from its spec and its formatter.
function postcodeCountryModule(spec: PostcodeCountrySpec, format: CountryModule["format"]): CountryModule {
  return {
    code: spec.code,
    codes: [spec.code],
    name: spec.name,
    detect: (text) => looksLikePostcodeCountry(text, spec),
    parse: (text, options) => parsePostcodeCountry(text, spec, options),
    validate: (address, options) => validatePostcodeCountry(address, spec, options),
    format,
    compare: (first, second) => comparePostcodeCountry(first, second, spec),
  };
}

export {
  comparePostcodeCountry,
  folded,
  looksLikePostcodeCountry,
  parsePostcodeCountry,
  postcodeCountryModule,
  validatePostcodeCountry,
};
export type { PostcodeCountrySpec };
