// Main address parser implementation - based on the original parse-address library patterns. This file reads the country
// and the kind of address and hands it to the parser for it; the standard (US and Canadian) street address is read by the
// stages in src/parsers/standard/.

import { pickCountryModule } from "./country/pick";
import { looksJapanese, parseJapaneseAddress } from "./jp/parse";
import { parseInformalAddress } from "./parsers/informal-address-parser";
import { parseIntersection } from "./parsers/intersection-parser";
import { parseMilitary } from "./parsers/military-parser";
import { createParser, parseAddress, parser, setParseLocationImpl } from "./parsers/parser-orchestrator";
import { parsePoBox } from "./parsers/po-box-parser";
import { parseRuralRoute } from "./parsers/rural-route-parser";
import { takeLeadingPlace } from "./parsers/standard/leading-place";
import { standardRegexes } from "./parsers/standard/patterns";
import { parseStandardAddress } from "./parsers/standard/standard-parser";
import type { ParsedAddress, ParseOptions } from "./types";
import { toSnakeCase } from "./utils/case-converter";
import { prepareInput } from "./utils/prepare-input";
import { abbreviateRegionConnectors } from "./utils/region-connectors";

/**
 * Parses a US, Canadian or Japanese address into its parts. The country is detected from the text (a state, a
 * province, a postal code, Japanese script or romaji designators) unless `options.country` names it. A Japanese
 * address fills its own fields (`prefecture`, `municipality`, `town`, `chome`, `ban`, `go`) and the shared ones that
 * stand for them. Australia and the United Kingdom are read too when their modules are passed in `options.countries`
 * (`australia` from `/au`, `unitedKingdom` from `/gb`): `options.country` picks one, or each module's own detection
 * decides, before the US, Canada and Japan are tried.
 *
 * @param address - The address as one string; commas, line breaks and full-width characters are all read.
 * @param options - How to parse: the country, strict postal codes, snake_case keys and the rest (see `ParseOptions`).
 * @returns The parts found, or `null` when the text is empty or holds nothing that can be read as an address. A part
 * that is not in the address is absent from the result, never an empty string.
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseLocation("1600 Pennsylvania Ave NW, Washington, DC 20500"));
 * // → {"number":"1600","street":"Pennsylvania","type":"Ave","suffix":"NW","city":"Washington","state":"DC","zip":"20500","zipValid":true,"country":"US"}
 * ```
 */
function parseLocation(address: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!address || typeof address !== "string") {
    return null;
  }

  let original = address.trim();

  // Strip surrounding parentheses if present
  if (original.startsWith("(") && original.endsWith(")")) {
    original = original.slice(1, -1).trim();
  }

  // "N/A", "-", "?": no word of two letters and no digit is not an address.
  if (!/\p{L}{2}/u.test(original) && !/\d/.test(original)) {
    return null;
  }

  // A country read by a module the caller handed in (Australia, the United Kingdom): the hint names it, or the
  // module's own detection is sure of the address. Without countries, nothing here changes.
  const countryModule = pickCountryModule(original, options.country, options.countries);
  if (countryModule) return countryModule.parse(original, options);

  // Japan writes addresses differently enough to have a parser of its own.
  if (options.country === "JP" || (options.country !== "US" && options.country !== "CA" && looksJapanese(original))) {
    return parseJapaneseAddress(original, options);
  }

  // Tidy spacing, a trailing country, a province in parentheses and the comma placements that only
  // move a part around, so the parsers below see one form of each.
  const prepared = prepareInput(original);
  // "Newfoundland and Labrador" is a province, not two streets meeting: names holding a connector are
  // written as their code before anything else reads the text.
  const text = abbreviateRegionConnectors(prepared.text);
  const finish = (result: ParsedAddress | null): ParsedAddress | null => {
    if (!result) return null;
    if (!result.country && prepared.country) result.country = prepared.country;
    return options.useSnakeCase ? (toSnakeCase(result) as unknown as ParsedAddress) : result;
  };

  // Check for intersection first
  const regexes = standardRegexes();
  if (regexes.intersection.test(text)) {
    const result = parseIntersection(text, options);
    if (result && options.useSnakeCase) {
      return toSnakeCase(result) as unknown as ParsedAddress;
    }
    return result;
  }

  // Delivery lines that are not streets: military, rural and highway contract routes, PO boxes.
  const special = parseMilitary(text, options) ?? parseRuralRoute(text, options);
  if (special) return finish(special);

  // A place's name run straight into its address, with no comma: "Barboncino 781 Franklin Ave".
  const leadingPlace = takeLeadingPlace(text);
  const addressText = leadingPlace ? leadingPlace.rest : text;
  const withPlace = (result: ParsedAddress | null): ParsedAddress | null => {
    if (result && leadingPlace && !result.place) result.place = leadingPlace.place;
    return finish(result);
  };

  const poBoxMatch = addressText.match(regexes.poBoxStart);
  if (poBoxMatch) {
    return withPlace(parsePoBox(addressText, options));
  }

  // Try standard address parsing
  return withPlace(
    parseStandardAddress(addressText, options, prepared.country) || parseInformalAddress(addressText, options),
  );
}

// Inject parseLocation implementation to break circular dependency
setParseLocationImpl(parseLocation);

// Re-export main functions
export { createParser, parseAddress, parseInformalAddress, parseIntersection, parseLocation, parser };
