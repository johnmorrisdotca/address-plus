import type { AddressParser, ParsedAddress, ParseOptions } from "../types";

import { parseInformalAddress } from "./informal-address-parser";
import { parseIntersection } from "./intersection-parser";

// Forward declaration - parseLocation will be injected
let parseLocationImpl: (address: string, options?: ParseOptions) => ParsedAddress | null;

// Set the parseLocation implementation (used to break circular dependency)
function setParseLocationImpl(impl: (address: string, options?: ParseOptions) => ParsedAddress | null): void {
  parseLocationImpl = impl;
}

/**
 * Parses a street address. The same as `parseLocation`, kept under the name parse-address's users know.
 *
 * @param address - The address as one string.
 * @param options - How to parse (see `ParseOptions`).
 * @returns The parts found, or `null` when nothing can be read as an address.
 * @example
 * ```ts
 * import { parseAddress } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseAddress("123 Main St Apt 4, Anytown, NY 12345")?.secUnitNum);
 * // → "4"
 * ```
 */
function parseAddress(address: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!parseLocationImpl) {
    throw new Error("parseLocation implementation not set");
  }
  return parseLocationImpl(address, options);
}

// Create address parser instance
function createParser(defaultOptions: ParseOptions = {}): AddressParser {
  return {
    parseAddress: (address: string, options?: ParseOptions) => parseAddress(address, { ...defaultOptions, ...options }),
    parseInformalAddress: (address: string, options?: ParseOptions) =>
      parseInformalAddress(address, { ...defaultOptions, ...options }),
    parseIntersection: (address: string, options?: ParseOptions) =>
      parseIntersection(address, { ...defaultOptions, ...options }),
    parseLocation: (address: string, options?: ParseOptions) =>
      parseLocationImpl(address, { ...defaultOptions, ...options }),
  };
}

// Export default parser instance
const parser = createParser();

export { createParser, parseAddress, parser, setParseLocationImpl };
