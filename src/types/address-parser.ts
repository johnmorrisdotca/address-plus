// Address parser interface for API compatibility

import type { ParseOptions } from "./parse-options";
import type { ParsedAddress } from "./parsed-address";
import type { ParsedIntersection } from "./parsed-intersection";

/**
 * The shape of the default export: the four parsers parse-address's users call on one object.
 *
 * @example
 * ```ts
 * import parser from "@johnmorrisdotca/address-plus";
 * import type { AddressParser } from "@johnmorrisdotca/address-plus";
 *
 * console.log(Object.keys(parser));
 * // → ["parseLocation","parseIntersection","parseInformalAddress","parseAddress"]
 * ```
 */
interface AddressParser {
  parseAddress(address: string, options?: ParseOptions): ParsedAddress | null;
  parseInformalAddress(address: string, options?: ParseOptions): ParsedAddress | null;
  parseIntersection(address: string, options?: ParseOptions): ParsedIntersection | null;
  parseLocation(address: string, options?: ParseOptions): ParsedAddress | null;
}

export type { AddressParser };
