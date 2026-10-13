// French prepositions for proper street name capitalization

/**
 * French particles that can open a street name, each with the space after it, to the way it is written there (`de la `
 * as `De la `).
 *
 * @example
 * ```ts
 * import { FRENCH_PREPOSITIONS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(FRENCH_PREPOSITIONS.get("de la "));
 * // → "De la "
 * ```
 */
const FRENCH_PREPOSITIONS = new Map([
  ["du ", "Du "],
  ["des ", "Des "],
  ["de la ", "De la "],
  ["de l'", "De l'"],
  ["de ", "De "],
]);

export { FRENCH_PREPOSITIONS };
