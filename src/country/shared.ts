// What the country modules share: tidying the text they are given, snake_case results, the severity of a finding,
// and comparing two addresses field by field. Nothing here reads the US or Canadian tables, so a country entry point
// carries only this and its own country.

import type { CountryComparison, CountryDifference } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";
import type { ValidationError } from "../types/validation";
import { toSnakeCase } from "../utils/case-converter";

const CAMEL_CASE_CAPITAL = /[A-Z]/g;
const LINE_BREAKS = /\s*[\r\n]+\s*/g;
const SPACE_RUN = /[ \t\u00a0\u3000]+/g;
const SPACE_BEFORE_COMMA = /\s+,/g;
const COMMA_RUN = /,(?:\s*,)+/g;
const EDGE_COMMAS = /^[\s,]+|[\s,]+$/g;
const PUNCTUATION = /[.,'’]/g;
const HYPHEN_SPACING = /\s*-\s*/g;

// One line of text: line breaks become commas, runs of spaces one space, doubled commas one.
function tidyAddressText(text: string): string {
  return text
    .replace(LINE_BREAKS, ", ")
    .replace(SPACE_RUN, " ")
    .replace(SPACE_BEFORE_COMMA, ",")
    .replace(COMMA_RUN, ",")
    .replace(EDGE_COMMAS, "")
    .trim();
}

// The comma-separated parts of a tidied address, each trimmed, none empty.
function partsOf(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

// The result with snake_case keys, as parseLocation gives with useSnakeCase: sec_unit_type, floor_type.
function snakeCased(address: ParsedAddress): ParsedAddress {
  return Object.fromEntries(
    Object.entries(toSnakeCase(address)).map(([key, value]) => [
      key.replace(CAMEL_CASE_CAPITAL, (capital) => `_${capital.toLowerCase()}`),
      value,
    ]),
  ) as ParsedAddress;
}

// A finding as a warning, or as an error when the caller asked for strict postal codes and the finding is about one.
function finding(
  field: string,
  code: string,
  message: string,
  strict: boolean,
): ValidationError & { severity: "error" | "warning" } {
  return { field, code, message, severity: strict ? "error" : "warning" };
}

// The same value in the same form: capitals, no full stops, commas or apostrophes, one space, no spaces around a
// hyphen. A missing value stays missing.
function comparable(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;

  return value.toUpperCase().replace(PUNCTUATION, "").replace(HYPHEN_SPACING, "-").replace(SPACE_RUN, " ").trim();
}

// Compare two addresses on the fields that make a delivery point, each first put in the same form by `normalize`
// (which also turns a street type or a state written out into its code). They are the same when no field differs.
function compareFields(
  first: ParsedAddress,
  second: ParsedAddress,
  fields: readonly (keyof ParsedAddress)[],
  normalize: (field: keyof ParsedAddress, value: string | undefined) => string | undefined,
): CountryComparison {
  if (!first || !second) return { isSame: false, differences: [] };
  const differences: CountryDifference[] = [];
  for (const field of fields) {
    const one = normalize(field, valueOf(first, field));
    const two = normalize(field, valueOf(second, field));
    if (one !== two) differences.push({ field, ...(one ? { first: one } : {}), ...(two ? { second: two } : {}) });
  }

  return { isSame: differences.length === 0, differences };
}

function valueOf(address: ParsedAddress, field: keyof ParsedAddress): string | undefined {
  const value = address[field];

  return typeof value === "string" ? value : undefined;
}

const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

// Postcodes written as one short string: the first postcode's number, then the step to each next, in base 36 (a step of
// 36 or more is a tilde and three digits). scripts/countries/update-country-data.ts writes them; this reads them.
function unpackPostcodes(packed: string, length: number): Set<string> {
  const found = new Set<string>();
  let number = 0;
  for (let at = 0; at < packed.length;) {
    const long = packed[at] === "~";
    const digits = long ? packed.slice(at + 1, at + 4) : packed[at];
    number += [...digits].reduce((sum, digit) => sum * 36 + BASE36.indexOf(digit), 0);
    found.add(String(number).padStart(length, "0"));
    at += long ? 4 : 1;
  }

  return found;
}

// Regions' runs of postcodes written as one short string: each run is the step from the last run's first postcode in base
// 36 (lower case), then the region's code in capitals (a hyphen where the postcode has no region).
// scripts/countries/postcode-countries.ts writes them; this reads them.
function unpackRuns(packed: string): { start: number; code: string }[] {
  const runs: { start: number; code: string }[] = [];
  let start = 0;
  for (const run of packed.matchAll(/([0-9a-z]+)([A-Z-]+)/g)) {
    start += [...run[1]].reduce((sum, digit) => sum * 36 + BASE36.indexOf(digit), 0);
    runs.push({ start, code: run[2] });
  }

  return runs;
}

// The code of the last run that begins at or before a postcode's number, or undefined before the first run or in a run
// that has no region.
function codeOfRuns(runs: readonly { start: number; code: string }[], postcode: number): string | undefined {
  let low = 0;
  let high = runs.length - 1;
  let found: string | undefined;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (runs[middle].start <= postcode) {
      found = runs[middle].code;
      low = middle + 1;
    } else high = middle - 1;
  }

  return found === "-" ? undefined : found;
}

export {
  codeOfRuns,
  comparable,
  compareFields,
  finding,
  partsOf,
  snakeCased,
  tidyAddressText,
  unpackPostcodes,
  unpackRuns,
};
