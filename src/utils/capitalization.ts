// String capitalization utilities for address parsing

import { STREET_NAME_ACRONYMS } from "../constants/street-name-acronyms";

// Super fast first letter capitalization - minimal footprint
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalizes the first letter of each word.
 *
 * @param text - The text.
 * @returns The text with each word's first letter in capitals and the rest as written.
 * @example
 * ```ts
 * import { capitalizeWords } from "@johnmorrisdotca/address-plus";
 *
 * console.log(capitalizeWords("new york city"));
 * // → "New York City"
 * ```
 */
function capitalizeWords(text: string): string {
  // Capitalize by words and also handle hyphenated compounds (Saint-Laurent, René-Lévesque)
  return text
    .split(" ")
    .map((word) => {
      if (!word.includes("-")) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      // For hyphenated words, capitalize each segment
      return word
        .split("-")
        .map((seg) => (seg ? seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase() : seg))
        .join("-");
    })
    .join(" ");
}

// Small words that stay lowercase inside a name when they were written that way: Canada Post keeps French
// particles lowercase ("rue des Jardins", "chemin de la Côte"), and English joins names with "of the".
const LOWERCASE_PARTICLES = new Set(["de", "du", "des", "la", "le", "les", "of", "the", "and", "et", "aux", "au"]);

// One segment of a word, all one case as written: "farrell" -> "Farrell", "youville" -> "Youville".
function titleSegment(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

// A word written all in one case, title-cased: each hyphenated segment, and the letter after an apostrophe
// ("o'farrell" -> "O'Farrell"). A lowercase French elision keeps its particle: "d'youville" -> "d'Youville".
function titleWord(word: string, keepParticle: boolean): string {
  return word
    .split("-")
    .map((segment: string) => {
      const elision = segment.match(/^([dl])(['’])(.+)$/i);
      if (elision) {
        const particle = keepParticle ? elision[1].toLowerCase() : elision[1].toUpperCase();
        return `${particle}${elision[2]}${titleSegment(elision[3])}`;
      }
      return segment
        .split(/(['’])/)
        .map((piece: string) => (piece === "'" || piece === "’" ? piece : titleSegment(piece)))
        .join("");
    })
    .join("-");
}

/**
 * Capitalizes a street name the way it is signed. A word written in mixed case is kept as written (`O'Farrell`,
 * `McKinley`, `d'Youville`); a word all in lower case or all in capitals is title-cased, except a French particle
 * written in lower case, which stays so (`rue des Jardins`).
 *
 * @param text - The street name.
 * @returns The name capitalized.
 * @example
 * ```ts
 * import { capitalizeStreetName } from "@johnmorrisdotca/address-plus";
 *
 * console.log(capitalizeStreetName("o'brien"));
 * // → "O'Brien"
 * ```
 */
function capitalizeStreetName(text: string): string {
  const words = text.split(" ");
  const result = words.map((word: string) => {
    if (!word) return word;
    const isLower = word === word.toLowerCase();
    const isUpper = word === word.toUpperCase();
    if (!isLower && !isUpper) return word;
    if (isLower && LOWERCASE_PARTICLES.has(word) && words.length > 1) return word;
    return titleWord(word, isLower);
  });

  // Handle acronyms - replace after capitalization
  for (let i = 0; i < result.length; i++) {
    const cleanWord = result[i].replace(/[^\w&]/g, "").toLowerCase();
    if (STREET_NAME_ACRONYMS.has(cleanWord)) {
      result[i] = result[i].replace(
        new RegExp(cleanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        STREET_NAME_ACRONYMS.get(cleanWord)!,
      );
    }
  }

  return result.join(" ");
}

export { capitalize, capitalizeStreetName, capitalizeWords };
