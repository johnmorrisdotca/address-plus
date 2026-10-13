// The words of an address in France, written here in our own words from La Poste's guidance on addressing (NF
// Z10-011): the types of voie (street) the parser splits from a street's name, the abbreviations people type for
// them, the lines that go above the street (a floor, a staircase, a residence), the ways a box is written, and the
// names the overseas territories go by at the end of an address.

/**
 * The types of voie the parser takes off the front of a street's name and reports, in full, as `type` (`rue de la
 * Paix` is street `de la Paix`, type `Rue`), with the abbreviations it reads for each. In French the type comes
 * first. A street with none of them (`Le Vieux Pont`) has no type.
 *
 * @example
 * ```ts
 * import { FR_STREET_TYPES } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(FR_STREET_TYPES.Boulevard);
 * // → ["BD","BLD","BOUL","BVD","BLVD"]
 * ```
 */
const FR_STREET_TYPES: Readonly<Record<string, readonly string[]>> = {
  Allée: ["ALL", "ALLEE", "ALLEES"],
  Autoroute: ["AUT"],
  Avenue: ["AV", "AVE", "AVEN"],
  Boulevard: ["BD", "BLD", "BOUL", "BVD", "BLVD"],
  Carrefour: ["CAR", "CARR"],
  Chaussée: ["CHAUSSEE", "CHS"],
  Chemin: ["CHE", "CHEM", "CH"],
  Cité: ["CITE"],
  Clos: [],
  Cour: [],
  Cours: ["CRS"],
  Domaine: ["DOM"],
  Esplanade: ["ESP"],
  Faubourg: ["FG", "FBG", "FAUB"],
  Hameau: ["HAM"],
  Impasse: ["IMP"],
  Jardin: ["JARD"],
  Lotissement: ["LOT", "LOTISS"],
  Mail: [],
  Montée: ["MONTEE", "MTE"],
  Parc: [],
  Parvis: ["PARV"],
  Passage: ["PAS", "PASS"],
  Place: ["PL"],
  Pont: [],
  Port: [],
  Promenade: ["PROM"],
  Quai: ["QU"],
  "Rond-point": ["RPT", "ROND POINT", "RD PT", "RDPT"],
  Route: ["RTE"],
  Rue: ["R"],
  Ruelle: ["RLE"],
  Sentier: ["SENT"],
  Square: ["SQ", "SQUARE"],
  Traverse: ["TRA"],
  Venelle: ["VEN"],
  Villa: ["VLA"],
  Village: ["VGE", "VLGE"],
  Voie: ["VOI"],
};

/**
 * The words that may follow the number as its indice de répétition: `bis`, `ter`, `quater` and the rest of the Latin
 * series. A single letter (the B of `12 B rue Hugo`) is read as one too, when a type of voie follows it.
 *
 * @example
 * ```ts
 * import { FR_NUMBER_EXTENSIONS } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(FR_NUMBER_EXTENSIONS.slice(0, 3));
 * // → ["bis","ter","quater"]
 * ```
 */
const FR_NUMBER_EXTENSIONS: readonly string[] = ["bis", "ter", "quater", "quinquies", "sexies", "septies"];

/**
 * The types of the part of a building that an address names below the number: an apartment or a door, which the parser
 * reports as `secUnitType` and `secUnitNum`, with the abbreviations it reads for each.
 *
 * @example
 * ```ts
 * import { FR_UNIT_TYPES } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(FR_UNIT_TYPES.Appartement);
 * // → ["APPT","APT","APP","APPART"]
 * ```
 */
const FR_UNIT_TYPES: Readonly<Record<string, readonly string[]>> = {
  Appartement: ["APPT", "APT", "APP", "APPART"],
  Bureau: ["BUR"],
  Chambre: ["CH", "CHAMB"],
  Local: [],
  Porte: ["PTE"],
  Studio: [],
};

/**
 * The words that open the line naming a building, a residence or a zone (La Poste's third line), which the parser keeps
 * whole as `building` (`Résidence Les Lilas`, `Bâtiment A`, `Zone industrielle Nord`, `ZAC des Prés`), with their
 * abbreviations.
 *
 * @example
 * ```ts
 * import { FR_BUILDING_WORDS } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(FR_BUILDING_WORDS.Bâtiment);
 * // → ["BAT","BATIMENT","BÂT"]
 * ```
 */
const FR_BUILDING_WORDS: Readonly<Record<string, readonly string[]>> = {
  Bâtiment: ["BAT", "BATIMENT", "BÂT"],
  Immeuble: ["IMM"],
  Résidence: ["RES", "RESIDENCE", "RÉS"],
  Tour: [],
  Hall: [],
  Pavillon: ["PAV"],
  Palais: [],
  Maison: [],
  Zone: [],
  ZI: [],
  ZA: [],
  ZAC: [],
  ZAD: [],
  Centre: ["CTRE", "CCAL"],
};

/**
 * The Roman numerals a Paris, Lyon or Marseille arrondissement may be written in (`IXe`), by their value.
 *
 * @example
 * ```ts
 * FR_ROMAN_NUMERALS.IX
 * // → 9
 * ```
 */
const FR_ROMAN_NUMERALS: Readonly<Record<string, number>> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
  XIII: 13,
  XIV: 14,
  XV: 15,
  XVI: 16,
  XVII: 17,
  XVIII: 18,
  XIX: 19,
  XX: 20,
};

/**
 * What an address in France may end with, by the country or territory it names, in capitals and without accents: the
 * country code the parser reports. `FRANCE` and the overseas departments are `FR`; Monaco and the collectivities have
 * codes of their own.
 *
 * @example
 * ```ts
 * [FR_COUNTRY_NAMES["POLYNESIE FRANCAISE"], FR_COUNTRY_NAMES.MONACO, FR_COUNTRY_NAMES["LA REUNION"]]
 * // → ["PF","MC","FR"]
 * ```
 */
const FR_COUNTRY_NAMES: Readonly<Record<string, "BL" | "FR" | "MC" | "MF" | "NC" | "PF" | "PM" | "WF">> = {
  FRANCE: "FR",
  "REPUBLIQUE FRANCAISE": "FR",
  "FRANCE METROPOLITAINE": "FR",
  GUADELOUPE: "FR",
  MARTINIQUE: "FR",
  GUYANE: "FR",
  "GUYANE FRANCAISE": "FR",
  REUNION: "FR",
  "LA REUNION": "FR",
  MAYOTTE: "FR",
  MONACO: "MC",
  "SAINT PIERRE ET MIQUELON": "PM",
  "SAINT BARTHELEMY": "BL",
  "SAINT MARTIN": "MF",
  "WALLIS ET FUTUNA": "WF",
  "POLYNESIE FRANCAISE": "PF",
  "NOUVELLE CALEDONIE": "NC",
};

export { FR_BUILDING_WORDS, FR_COUNTRY_NAMES, FR_NUMBER_EXTENSIONS, FR_ROMAN_NUMERALS, FR_STREET_TYPES, FR_UNIT_TYPES };
