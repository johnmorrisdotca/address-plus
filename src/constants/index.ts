// Export all data constants from organized modules
// Provides centralized access to all address parsing data structures

export {
  FACILITY_DELIMITER_PATTERN,
  FACILITY_INDICATORS,
  FACILITY_PATTERNS,
  MUSIC_SQUARE_EAST_PATTERN,
  PARENTHETICAL_PATTERN,
  SECONDARY_UNIT_PATTERN,
  STREET_TYPE_DETECTION_PATTERN,
  UNIT_TYPE_KEYWORDS,
  UNIT_TYPE_NUMBER_PATTERN,
  WRITTEN_NUMBERS,
} from "../patterns/address-patterns";
export {
  COMMON_STREET_NAMES_PATTERN,
  CONNECTOR_WORDS,
  FACILITY_DELIMITER_PATTERNS,
  GENERAL_DELIVERY_PATTERNS,
  ISLAND_TYPE_PATTERN,
  VALIDATION_PATTERNS,
  ZIP_VALIDATION_PATTERNS,
} from "../patterns/core-patterns";
export {
  CANADIAN_POSTAL_CODE_PATTERN,
  CANADIAN_POSTAL_LIBERAL_PATTERN,
  CITY_PATTERNS,
  ZIP_CODE_PATTERN,
  ZIP_CODE_REGEX_PATTERN,
} from "../patterns/location-patterns";
export { validatePostalCode } from "../utils/postal-validation";
export type { PostalValidationResult } from "../utils/postal-validation";
export {
  CA_PROVINCES,
  CA_PROVINCE_ALTERNATIVES,
  CA_PROVINCE_NAMES,
  CA_PROVINCE_NAMES_EN,
  CA_PROVINCE_NAMES_FR,
  CA_REGIONS,
  PROVINCE_EXPANSIONS,
  PROVINCE_EXPANSIONS_EN,
  PROVINCE_EXPANSIONS_FR,
} from "./ca-provinces";
export { CA_STREET_TYPES } from "./ca-street-types";
export { COUNTRIES } from "./countries";
export type { CountryCode } from "./countries";
export { DIRECTIONAL_MAP, DIRECTION_EXPANSIONS } from "./directionals";
export { FRENCH_PREPOSITIONS } from "./french-prepositions";
export {
  JP_DESIGNATED_CITIES,
  JP_MUNICIPALITIES,
  JP_POSTAL_EXCEPTIONS,
  JP_POSTAL_PREFIXES,
  JP_PREFECTURES,
  findMunicipalitiesByName,
  findMunicipalitiesByRomaji,
  findMunicipalityByCode,
  findPrefecture,
  getPostalPrefixesForPrefecture,
  getPrefectureFromJapanesePostalCode,
  municipalitiesOf,
} from "./jp";
export { COMMON_PARSER_PATTERNS, INTERSECTION_PATTERNS, PO_BOX_PATTERNS } from "./parser-patterns";
export {
  POSTAL_CODE_TO_PROVINCE,
  TERRITORY_POSTAL_PREFIXES,
  TERRITORY_POSTAL_RANGES,
  getPostalPrefixesForProvince,
  getProvinceFromPostalCode,
} from "./postal-code-provinces";
export { SECONDARY_UNIT_TYPES } from "./secondary-unit-types";
export { STREET_NAME_ACRONYMS } from "./street-name-acronyms";
export { STREET_TYPE_EXPANSIONS } from "./street-type-expansions";
export { STREET_TYPE_PROPER_CASE } from "./street-type-proper-case";
export {
  US_REGIONS,
  US_STATES,
  US_STATE_ALTERNATIVES,
  US_STATE_EXPANSIONS,
  US_STATE_NAMES,
  normalizeStateProvinceName,
} from "./us-states";
export { US_STREET_TYPES } from "./us-street-types.data";
export { getStateFromZip, getZipPrefixesForState } from "./zip-code-states";
export type { StateCode } from "./zip-code-states";
