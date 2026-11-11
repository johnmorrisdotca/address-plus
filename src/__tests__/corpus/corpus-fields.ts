// The fields a corpus case is judged on when it does not name them, for each country's corpus folder: a field a case does not name
// must be absent from the result.

import type { ParsedAddress } from "../../types";

// Every field a corpus case can name.
type CorpusField = keyof ParsedAddress;

// The fields every complete case accounts for. A field here that the case does not name must be absent
// from the result, so a parser that invents a prefix or a unit fails as surely as one that loses it.
const CORE_FIELDS: CorpusField[] = [
  "number",
  "prefix",
  "street",
  "type",
  "suffix",
  "secUnitType",
  "secUnitNum",
  "city",
  "state",
  "zip",
  "plus4",
  "country",
];

// Japan's own fields play the part of the core fields in the Japanese corpus. The shared fields a Japanese
// address also fills (state, city, street, number, zip) repeat these, so they are not judged again.
const JAPAN_CORE_FIELDS: CorpusField[] = [
  "postalCode",
  "prefecture",
  "municipality",
  "streetDirections",
  "town",
  "chome",
  "ban",
  "go",
  "building",
  "floor",
  "room",
  "country",
];

// Australia's core fields: the shared ones its addresses fill, with the level, the lot and a building's name.
const AUSTRALIA_CORE_FIELDS: CorpusField[] = [
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "lot",
  "number",
  "street",
  "type",
  "suffix",
  "city",
  "state",
  "zip",
  "country",
];

// The United Kingdom's core fields: the parts of Royal Mail's Postcode Address File, and the nation the postcode
// delivers to.
const UK_CORE_FIELDS: CorpusField[] = [
  "subBuilding",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "building",
  "number",
  "dependentThoroughfare",
  "street",
  "type",
  "doubleDependentLocality",
  "locality",
  "city",
  "county",
  "bfpo",
  "zip",
  "nation",
  "country",
];

// France's core fields: the lines of La Poste's norm, from who it is care of to the commune, and the department.
const FRANCE_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "entrance",
  "number",
  "numberExtension",
  "type",
  "street",
  "lieuDit",
  "postalBoxType",
  "postalBoxNum",
  "city",
  "arrondissement",
  "cedex",
  "state",
  "zip",
  "country",
];

// Germany's core fields: the lines above the street, the street and its number, the place and the Land.
const GERMANY_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "street",
  "number",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

// The Netherlands' core fields: the street and its house number with the addition, a Postbus, the place and the postcode.
const NETHERLANDS_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "street",
  "number",
  "numberExtension",
  "city",
  "zip",
  "country",
];

// Spain's core fields: the street and its number, the staircase, the floor and the door, the place, the province in
// brackets, the province's code and the postcode.
const SPAIN_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "entrance",
  "street",
  "number",
  "locality",
  "city",
  "county",
  "state",
  "zip",
  "country",
];

// Italy's core fields: the street and its civic number with its letter, the staircase, the floor and the flat, the
// frazione, the place, the province's sigla and the postcode.
const ITALY_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "street",
  "number",
  "numberExtension",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

// New Zealand's core fields: the unit and the level, the street's number and name, the suburb, the city, the region and
// the postcode.
const NEW_ZEALAND_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "number",
  "street",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

// India's core fields: the flat, the building, the floor, the house number and the street, a landmark, the area, the city, the
// state and the PIN code.
const INDIA_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "number",
  "street",
  "place",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

// South Korea's core fields: the province, the district, the road and its number, the dong, the building, the floor, the unit
// and the postcode.
const KOREA_CORE_FIELDS: CorpusField[] = [
  "state",
  "city",
  "street",
  "number",
  "locality",
  "building",
  "floorType",
  "floor",
  "secUnitType",
  "secUnitNum",
  "zip",
  "country",
];

// Brazil's core fields: the street and its number, the complement, the bairro, the city, the state and the CEP.
const BRAZIL_CORE_FIELDS: CorpusField[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "street",
  "number",
  "locality",
  "city",
  "state",
  "zip",
  "country",
];

// The core fields each corpus folder is judged by.
const CORE_FIELDS_BY_COUNTRY: Readonly<Record<string, CorpusField[]>> = {
  au: AUSTRALIA_CORE_FIELDS,
  canada: CORE_FIELDS,
  de: GERMANY_CORE_FIELDS,
  es: SPAIN_CORE_FIELDS,
  fr: FRANCE_CORE_FIELDS,
  gb: UK_CORE_FIELDS,
  br: BRAZIL_CORE_FIELDS,
  in: INDIA_CORE_FIELDS,
  kr: KOREA_CORE_FIELDS,
  it: ITALY_CORE_FIELDS,
  japan: JAPAN_CORE_FIELDS,
  nl: NETHERLANDS_CORE_FIELDS,
  nz: NEW_ZEALAND_CORE_FIELDS,
  us: CORE_FIELDS,
};

export {
  AUSTRALIA_CORE_FIELDS,
  BRAZIL_CORE_FIELDS,
  CORE_FIELDS,
  CORE_FIELDS_BY_COUNTRY,
  FRANCE_CORE_FIELDS,
  GERMANY_CORE_FIELDS,
  INDIA_CORE_FIELDS,
  ITALY_CORE_FIELDS,
  JAPAN_CORE_FIELDS,
  KOREA_CORE_FIELDS,
  NETHERLANDS_CORE_FIELDS,
  NEW_ZEALAND_CORE_FIELDS,
  SPAIN_CORE_FIELDS,
  UK_CORE_FIELDS,
};
export type { CorpusField };
