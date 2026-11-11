// Export all types from the types directory

export type { AddressParser } from "./address-parser";
export type {
  AustralianAddressFields,
  AustralianPostcodeRange,
  AustralianState,
  AustralianStateCode,
} from "./australia";
export type { BatchParseError, BatchParseOptions, BatchParseResult, BatchParseStats } from "./batch-parse";
export type { CleanAddressOptions, CleanAddressResult } from "./clean-address";
export type {
  AddressComparisonOptions,
  AddressComparisonResult,
  AddressDifference,
  AddressMatchType,
  AddressSimilarityResult,
  FuzzyMatchOptions,
} from "./comparison";
export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "./country-module";
export type {
  AddressAbbreviations,
  AddressFormattingOptions,
  CanadaPostFormattingOptions,
  FormattedAddress,
  USPSFormattingOptions,
} from "./formatting";
export type {
  FrenchAddressFields,
  FrenchCollectivity,
  FrenchDepartment,
  FrenchPostalCountry,
  FrenchPostcode,
} from "./france";
export type { GermanAddressFields, GermanPostcode, GermanState, GermanStateCode } from "./germany";
export type { JapaneseAddressFields, JapaneseMunicipality, JapanesePrefecture } from "./japan";
export type { ParseOptions } from "./parse-options";
export type { ParsedAddress } from "./parsed-address";
export type { ParsedIntersection } from "./parsed-intersection";
export type { PostcodeLookup, PostcodeRegion } from "./postcode-country";
export type { UKAddressFields, UKNation, UKNationCode, UKPostcode } from "./united-kingdom";

export type { Region } from "./region";

export type { SubRegion } from "./sub-region";

export type {
  AddressComparisonTestCase,
  AddressFormattingTestCase,
  AddressParsingTestCase,
  AddressValidationTestCase,
  BatchProcessingTestCase,
  CleanAddressTestCase,
  TestCase,
  TestCaseBase,
} from "./test-schema";

export type { AddressValidationResult, ValidationError, ValidationOptions } from "./validation";
