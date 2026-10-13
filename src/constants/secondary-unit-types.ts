// Secondary unit types and abbreviations

/**
 * Each secondary unit designator, abbreviated or in full, in lower case, to the word the parser reports in full: USPS
 * Publication 28 Appendix C2, and Canada Post's French unit words, which stay French.
 *
 * @example
 * ```ts
 * import { SECONDARY_UNIT_TYPES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(SECONDARY_UNIT_TYPES["ste"]);
 * // → "Suite"
 * ```
 */
const SECONDARY_UNIT_TYPES: Record<string, string> = {
  app: "Appartement",
  appartement: "Appartement",
  apartment: "Apartment",
  apartme: "Apartment",
  apt: "Apartment",
  basement: "Basement",
  bld: "Building",
  bldg: "Building",
  bsmt: "Basement",
  building: "Building",
  department: "Department",
  dept: "Department",
  fl: "Floor",
  floor: "Floor",
  flr: "Floor",
  front: "Front",
  frnt: "Front",
  gate: "Gate",
  bureau: "Bureau",
  hangar: "Hangar",
  hanger: "Hangar", // A common misspelling of USPS's HANGAR
  hngr: "Hangar",
  key: "Key",
  lbby: "Lobby",
  level: "Level",
  lobby: "Lobby",
  lot: "Lot",
  lt: "Lot",
  lower: "Lower",
  lv: "Level",
  lowr: "Lower",
  ofc: "Office",
  office: "Office",
  penthouse: "Penthouse",
  pmb: "PMB", // Private mailbox, written after the street like a unit (Pub 28 section 2.4)
  ph: "Penthouse",
  pier: "Pier",
  rear: "Rear",
  rm: "Room",
  room: "Room",
  side: "Side",
  slip: "Slip",
  space: "Space",
  spc: "Space",
  ste: "Suite",
  stop: "Stop",
  su: "Suite",
  suite: "Suite",
  trailer: "Trailer",
  trlr: "Trailer",
  unit: "Unit",
  unite: "Unité",
  unité: "Unité",
  upper: "Upper",
  uppr: "Upper",
};

export { SECONDARY_UNIT_TYPES };
