/**
 * A US state or Canadian province: its code, its country and its name, as `normalizeRegion` matches them.
 *
 * @example
 * ```ts
 * import { CA_REGIONS } from "@johnmorrisdotca/address-plus";
 * import type { Region } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CA_REGIONS[0]);
 * // → {"abbr":"AB","country":"CA","name":"alberta"}
 * ```
 */
type Region = {
  abbr: string;
  country: "CA" | "US";
  name: string;
};

export type { Region };
