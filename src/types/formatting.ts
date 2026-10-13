// Types for address formatting functions

/**
 * Options for `formatAddress` and `cleanAddress`: what to abbreviate, capitals, the unit, the country and the line
 * separator.
 *
 * @example
 * ```ts
 * import { formatAddress, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { AddressFormattingOptions } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main Street, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatAddress(parsedAddress1, { upperCase: true }).singleLine);
 * // → "123 MAIN ST, ANYTOWN NY 12345"
 * ```
 */
interface AddressFormattingOptions {
  includeCountry?: boolean; // Whether to include country in formatted address
  includeSecondaryUnit?: boolean; // Whether to include unit/suite information
  upperCase?: boolean; // Whether to format in uppercase
  separator?: string; // Line separator for multi-line formatting
  abbreviateStreetTypes?: boolean; // Whether to abbreviate street types (Street -> St)
  abbreviateDirections?: boolean; // Whether to abbreviate directions (North -> N)
  abbreviateStates?: boolean; // Whether to abbreviate state/province names
  usePlusCode?: boolean; // Whether to include Plus Code in formatting
}

/**
 * Options for `formatUSPS`: which lines to include, and whether to set the letter case the USPS way.
 *
 * @example
 * ```ts
 * import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { USPSFormattingOptions } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatUSPS(parsedAddress1, { includeLastLine: false }).lines);
 * // → ["123 MAIN ST"]
 * ```
 */
interface USPSFormattingOptions {
  includeDeliveryLine?: boolean; // Whether to include delivery line
  includeLastLine?: boolean; // Whether to include city/state/ZIP line
  includeBarcode?: boolean; // Whether to include postal barcode
  standardizeCase?: boolean; // Whether to standardize case per USPS guidelines
}

/**
 * Options for `formatCanadaPost`: which lines to include, bilingual labels, and whether to set the letter case the
 * Canada Post way.
 *
 * @example
 * ```ts
 * import { formatCanadaPost, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { CanadaPostFormattingOptions } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("100 Queen St W, Toronto, ON M5H 2N2");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatCanadaPost(parsedAddress1, { includeDeliveryLine: false }).lines);
 * // → ["TORONTO ON M5H 2N2"]
 * ```
 */
interface CanadaPostFormattingOptions {
  includeDeliveryLine?: boolean; // Whether to include delivery line
  includeLastLine?: boolean; // Whether to include city/province/postal line
  bilingualLabels?: boolean; // Whether to include bilingual labels
  standardizeCase?: boolean; // Whether to standardize case per Canada Post guidelines
}

/**
 * A formatted address: its lines, and the same on one line.
 *
 * @example
 * ```ts
 * import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { FormattedAddress } from "@johnmorrisdotca/address-plus/au";
 *
 * const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatUSPS(parsedAddress1));
 * // → {"lines":["123 MAIN ST","ANYTOWN NY 12345"],"singleLine":"123 Main St, Anytown NY 12345","deliveryLine":"123 Main St","lastLine":"Anytown NY 12345","country":"US","format":"usps"}
 * ```
 */
interface FormattedAddress {
  lines: string[]; // Individual address lines
  singleLine: string; // Single-line representation
  deliveryLine?: string; // Street address line
  lastLine?: string; // City/state/postal line
  country?: string; // Country designation
  format:
    | "standard"
    | "usps"
    | "canada-post"
    | "international"
    | "australia-post"
    | "royal-mail"
    | "la-poste"
    | "deutsche-post"; // Formatting standard used
}

/**
 * What `getAddressAbbreviations` returns: one map per kind of abbreviation.
 *
 * @example
 * ```ts
 * import { getAddressAbbreviations } from "@johnmorrisdotca/address-plus";
 * import type { AddressAbbreviations } from "@johnmorrisdotca/address-plus";
 *
 * console.log(Object.keys(getAddressAbbreviations()));
 * // → ["streetTypes","directions","states","provinces","unitTypes"]
 * ```
 */
interface AddressAbbreviations {
  streetTypes: Record<string, string>; // Street type abbreviation mappings
  directions: Record<string, string>; // Directional abbreviation mappings
  states: Record<string, string>; // State abbreviation mappings
  provinces: Record<string, string>; // Province abbreviation mappings
  unitTypes: Record<string, string>; // Unit type abbreviation mappings
}

export type {
  AddressAbbreviations,
  AddressFormattingOptions,
  CanadaPostFormattingOptions,
  FormattedAddress,
  USPSFormattingOptions,
};
