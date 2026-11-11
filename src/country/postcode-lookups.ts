// The lookups a country's postcode table gives: whether a postcode has the shape, whether the list has it, and the region
// it is in. The list and the runs are unpacked the first time they are asked for, so a country that is imported and never
// asked costs the text and nothing more.

import type { PostcodeLookup } from "../types/postcode-country";
import { codeOfRuns, unpackPostcodes, unpackRuns } from "./shared";

interface PostcodeTable {
  shape: RegExp; // A whole postcode, as written
  length: number; // Digits of the number the table lists (4 for Dutch postcode areas, 5 for Spain)
  packed: string; // The list, packed
  runs?: string; // The regions' runs, packed
  regionOfAnyValid?: boolean; // The region is read from the number alone, so a postcode not in the list has one too (Spain)
  normalize(postcode: string): string;
}

interface PostcodeLookups {
  isValid(postcode: string): boolean;
  isKnown(postcode: string): boolean;
  regionOf(postcode: string): string | undefined;
  lookup(postcode: string): PostcodeLookup;
}

// The digits of the postcode's number the table is made of: the first `length`.
const numberOf = (postcode: string, length: number): string => postcode.replace(/\D/g, "").slice(0, length);

function postcodeLookups(table: PostcodeTable): PostcodeLookups {
  let known: Set<string> | undefined;
  let runs: { start: number; code: string }[] | undefined;
  const isValid = (postcode: string): boolean => table.shape.test(String(postcode ?? "").trim());
  const isKnown = (postcode: string): boolean => {
    if (!isValid(postcode)) return false;
    known ??= unpackPostcodes(table.packed, table.length);

    return known.has(numberOf(postcode, table.length));
  };
  const regionOf = (postcode: string): string | undefined => {
    if (!table.runs || !(table.regionOfAnyValid ? isValid(postcode) : isKnown(postcode))) return undefined;
    runs ??= unpackRuns(table.runs);

    return codeOfRuns(runs, Number(numberOf(postcode, table.length)));
  };
  const lookup = (postcode: string): PostcodeLookup => {
    const text = String(postcode ?? "").trim();
    const region = regionOf(text);

    return {
      postcode: isValid(text) ? table.normalize(text) : text,
      ...(region ? { region } : {}),
      known: isKnown(text),
    };
  };

  return { isValid, isKnown, regionOf, lookup };
}

export { postcodeLookups };
export type { PostcodeLookups, PostcodeTable };
