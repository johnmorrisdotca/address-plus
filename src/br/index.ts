// Addresses in Brazil: import "@johnmorrisdotca/address-plus/br" for the parser, the validator, the Correios formatter, the
// comparer, the CEP lookups and the states, and pass `brazil` to parseLocation in `countries` to read Brazilian addresses beside
// the US, Canadian and Japanese ones. There is no list of CEPs: a state is told from the range of the CEP's first five digits.
// Nothing here is in the main entry point.

import {
  BR_STATES,
  findBrazilianState,
  getStateFromBrazilianPostcode,
  isKnownBrazilianPostcode,
  isValidBrazilianPostcode,
} from "../constants/br";
import {
  comparePostcodeCountry,
  looksLikePostcodeCountry,
  parsePostcodeCountry,
  postcodeCountryModule,
  validatePostcodeCountry,
} from "../country/postcode-country";
import type { CountryComparison, CountryModule, CountryValidation } from "../types/country-module";
import type { FormattedAddress } from "../types/formatting";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";
import type { ValidationOptions } from "../types/validation";
import { brazilianSpec } from "./rules";

/**
 * Options for `formatBrazilianPost`.
 *
 * @example
 * ```ts
 * import { formatBrazilianPost, parseBrazilianAddress } from "@johnmorrisdotca/address-plus/br";
 * import type { BrazilianPostFormattingOptions } from "@johnmorrisdotca/address-plus/br";
 *
 * const options: BrazilianPostFormattingOptions = { includeCountry: true };
 * const parsedAddress1 = parseBrazilianAddress("Avenida Paulista, 1578, São Paulo - SP, 01310-200");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatBrazilianPost(parsedAddress1, options).lines);
 * // → ["Avenida Paulista, 1578","01310-200 São Paulo SP","BRASIL"]
 * ```
 */
interface BrazilianPostFormattingOptions {
  includeCountry?: boolean; // BRASIL as the last line, for mail from abroad
}

/**
 * Writes an address in Brazil as the Correios ask: who it is care of, the street with its number and the complement
 * (`Avenida Paulista, 1578, Apto 45`), the bairro, then the CEP, the city and the state's code, each on its own line.
 *
 * @param address - The address as `parseBrazilianAddress` returns it.
 * @param options - Whether to add the country (see `BrazilianPostFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line and the last line.
 * @example
 * ```ts
 * import { formatBrazilianPost, parseBrazilianAddress } from "@johnmorrisdotca/address-plus/br";
 *
 * const parsedAddress1 = parseBrazilianAddress("Av. Paulista, 1578 - Apto 45 - Bela Vista, São Paulo - SP, 01310200");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatBrazilianPost(parsedAddress1).lines);
 * // → ["Av. Paulista, 1578, Apto 45","Bela Vista","01310-200 São Paulo SP"]
 * ```
 */
function formatBrazilianPost(address: ParsedAddress, options: BrazilianPostFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "BR", format: "correios" };
  if (address.careOf) lines.push(`A/C ${address.careOf}`);
  const box = address.secUnitType === "Caixa Postal";
  const complement = [
    address.building,
    address.floorType ? `${address.floor}º andar` : undefined,
    !box && address.secUnitType ? `${address.secUnitType} ${address.secUnitNum ?? ""}`.trim() : undefined,
  ].filter(Boolean);
  const deliveryLine = box
    ? `Caixa Postal ${address.secUnitNum}`
    : [address.street, address.number, ...complement].filter(Boolean).join(", ");
  if (deliveryLine) lines.push(deliveryLine);
  if (address.locality) lines.push(address.locality);
  const lastLine = [address.zip, address.city, address.state].filter(Boolean).join(" ");
  if (lastLine) lines.push(lastLine);
  if (options.includeCountry) lines.push("BRASIL");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: "BR",
    format: "correios",
  };
}

/**
 * Parses an address in Brazil into the parts the Correios lay out: who it is care of (`careOf`), the street as written with its
 * type (`street`: `Avenida Paulista`, `R. Augusta`), its number (`number`: `1578`, `S/N`), the complement (`secUnitType` and
 * `secUnitNum`: `Apto 45`, `Sala 12`; `building` for a bloco or a torre; `floorType` `Andar` and `floor`), the bairro in
 * `locality`, the city in `city`, the CEP in `zip` (written `01310-200`) and the state's code in `state` (`SP`), as written or
 * from the CEP. The number follows the street after a comma or not, and the bairro after a hyphen or a comma.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `BR`, or `null` when the text is empty or holds nothing that makes it an address.
 * @example
 * ```ts
 * import { parseBrazilianAddress } from "@johnmorrisdotca/address-plus/br";
 *
 * console.log(parseBrazilianAddress("Avenida Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200"));
 * // → {"number":"1578","street":"Avenida Paulista","locality":"Bela Vista","city":"São Paulo","state":"SP","zip":"01310-200","zipValid":true,"country":"BR"}
 * ```
 */
function parseBrazilianAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  return parsePostcodeCountry(text, brazilianSpec, options);
}

/**
 * Whether an address is surely Brazilian, with no hint: it ends with Brazil, Brasil or `BR`, or with a CEP written with its
 * hyphen (`01310-200`, five digits, a hyphen and three) in the range of a state, after the word `CEP` or a Brazilian state's
 * code (`SP`). A bare number of that shape claims nothing: a US ZIP+4 has four digits after the hyphen and Portugal's has three
 * before it, but other places may write five and three.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is Brazilian beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksBrazilian } from "@johnmorrisdotca/address-plus/br";
 *
 * console.log([looksBrazilian("Rua Augusta, 100, São Paulo - SP, 01305-000"), looksBrazilian("123 Main St, Seattle, WA 98101-1234")]);
 * // → [true,false]
 * ```
 */
function looksBrazilian(text: string): boolean {
  return looksLikePostcodeCountry(text, brazilianSpec);
}

/**
 * Checks an address in Brazil: the CEP is eight digits and in a range the Correios gave a state, the state written agrees with
 * the CEP's, and the city and the street's number are given. There is no list of CEPs here, so a CEP in a state's range that
 * does not exist is not caught.
 *
 * @param address - The address as `parseBrazilianAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseBrazilianAddress, validateBrazilianAddress } from "@johnmorrisdotca/address-plus/br";
 *
 * const parsedAddress1 = parseBrazilianAddress("Rua Augusta, 100, São Paulo - RJ, 01305-000");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateBrazilianAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["POSTAL_REGION_MISMATCH"]
 * ```
 */
function validateBrazilianAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  return validatePostcodeCountry(address, brazilianSpec, options);
}

/**
 * Compares two addresses in Brazil field by field: the street, its number, the complement, the bairro's city and the CEP.
 * Letter case, accents, `Rua` and `R.`, `Avenida` and `Av.`, a `de` or `da` after the type, and the CEP's hyphen are not
 * differences.
 *
 * @param first - The first address, as `parseBrazilianAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareBrazilianAddresses, parseBrazilianAddress } from "@johnmorrisdotca/address-plus/br";
 *
 * const parsedAddress1 = parseBrazilianAddress("Avenida Paulista, 1578, São Paulo - SP, 01310-200");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2 = parseBrazilianAddress("AV. PAULISTA 1578, SAO PAULO/SP, 01310200");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareBrazilianAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareBrazilianAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return comparePostcodeCountry(first, second, brazilianSpec);
}

/**
 * Brazil's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with Brazil,
 * Brasil or `BR`, or with a CEP written with its hyphen in the range of a state after `CEP` or a state's code, is read as Brazilian; `country: "BR"` reads any
 * address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { brazil } from "@johnmorrisdotca/address-plus/br";
 *
 * console.log(parseLocation("Rua Augusta, 100, São Paulo - SP, 01305-000", { countries: [brazil] })?.state);
 * // → "SP"
 * ```
 */
const brazil: CountryModule = postcodeCountryModule(brazilianSpec, (address) => formatBrazilianPost(address));

export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { PostcodeLookup, PostcodeRegion } from "../types/postcode-country";
export type { ValidationError, ValidationOptions } from "../types/validation";
export {
  BR_STATES,
  brazil,
  compareBrazilianAddresses,
  findBrazilianState,
  formatBrazilianPost,
  getStateFromBrazilianPostcode,
  isKnownBrazilianPostcode,
  isValidBrazilianPostcode,
  looksBrazilian,
  parseBrazilianAddress,
  validateBrazilianAddress,
};
export type { BrazilianPostFormattingOptions };
