import levenshtein from "fast-levenshtein";

import { findPrefecture } from "../constants/jp/index.js";
import { REGIONS } from "../constants/regions.js";
import { UTILITY_PATTERNS } from "../patterns/parser-patterns";
import type { Region } from "../types/region.js";

// Region normalization utilities for fuzzy matching

/**
 * Finds the US state or Canadian province a name, code or misspelling means: `Calfornia`, `Que.`, `British Columbia`,
 * `nfld`.
 *
 * @param input - A state or province name, code or abbreviation, in English or French.
 * @returns Its code and country, or `null` when nothing is close enough.
 * @example
 * ```ts
 * import { normalizeRegion } from "@johnmorrisdotca/address-plus";
 *
 * console.log(normalizeRegion("Calfornia"));
 * // → {"abbr":"CA","country":"US"}
 * ```
 */
function normalizeRegion(input: string): { abbr: string; country: "CA" | "US" } | null {
  if (!input) {
    return null;
  }

  const clean = input.trim().replace(UTILITY_PATTERNS.REMOVE_PERIODS, "").toLowerCase();

  // Return null for empty strings after trimming
  if (clean === "") {
    return null;
  }

  // 1. Exact match on abbreviation
  const exactAbbr = REGIONS.find((r) => r.abbr.toLowerCase() === clean);
  if (exactAbbr) {
    return { abbr: exactAbbr.abbr, country: exactAbbr.country };
  }

  // 2. Exact match on full name
  const exactName = REGIONS.find((r) => r.name.toLowerCase() === clean);
  if (exactName) {
    return { abbr: exactName.abbr, country: exactName.country };
  }

  // A Japanese prefecture's name is never a misspelt state or province: Osaka is not Alaska, nor Kyoto
  // Colorado.
  if (findPrefecture(clean)) {
    return null;
  }

  // 3. Fuzzy match on name: the whole input must be close to the whole name, within one edit for five
  // letters or fewer and within a quarter of its length beyond that.
  let best: { region: Region; dist: number } | null = null;
  for (const region of REGIONS) {
    const dist = levenshtein.get(clean, region.name.toLowerCase());
    if (!best || dist < best.dist) {
      best = { region, dist };
    }
  }

  const threshold = clean.length <= 5 ? 1 : Math.max(1, Math.floor(clean.length / 4));
  if (best && best.dist <= threshold) {
    return { abbr: best.region.abbr, country: best.region.country };
  }

  return null;
}

export { normalizeRegion };
