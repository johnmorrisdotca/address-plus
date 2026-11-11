import { expectType } from "tsd";

import type { AddressParser, ParsedAddress, ParsedIntersection, ParseOptions } from "../types";

// Test ParsedAddress type
const address: ParsedAddress = {
  number: "123",
  street: "Main",
  type: "St",
  city: "New York",
  state: "NY",
  zip: "10001",
  country: "US",
};

expectType<string | undefined>(address.number);
expectType<string | undefined>(address.street);
expectType<
  | "CA"
  | "US"
  | "JP"
  | "AU"
  | "GB"
  | "GY"
  | "IM"
  | "JE"
  | "BL"
  | "DE"
  | "FR"
  | "MC"
  | "MF"
  | "NC"
  | "PF"
  | "PM"
  | "WF"
  | "NL"
  | "ES"
  | "IT"
  | "NZ"
  | "IN"
  | "KR"
  | "BR"
  | undefined
>(address.country);

// Test ParseOptions type
const options: ParseOptions = {
  country: "US",
  normalize: true,
  language: "en",
};

expectType<
  | "CA"
  | "US"
  | "JP"
  | "AU"
  | "GB"
  | "GY"
  | "IM"
  | "JE"
  | "BL"
  | "DE"
  | "FR"
  | "MC"
  | "MF"
  | "NC"
  | "PF"
  | "PM"
  | "WF"
  | "GP"
  | "MQ"
  | "GF"
  | "RE"
  | "YT"
  | "NL"
  | "ES"
  | "IT"
  | "NZ"
  | "IN"
  | "KR"
  | "BR"
  | "auto"
  | undefined
>(options.country);
expectType<"en" | "fr" | "auto" | undefined>(options.language);

// Test ParsedIntersection type
const intersection: ParsedIntersection = {
  street1: "Main",
  type1: "St",
  street2: "Broadway",
  type2: "Ave",
  city: "New York",
  state: "NY",
  country: "US",
};

expectType<string | undefined>(intersection.street1);
expectType<string | undefined>(intersection.street2);

// Test AddressParser interface
declare const parser: AddressParser;

expectType<ParsedAddress | null>(parser.parseLocation("123 Main St"));
expectType<ParsedIntersection | null>(parser.parseIntersection("Main St & Broadway"));
expectType<ParsedAddress | null>(parser.parseAddress("123 Main St", { country: "US" }));
