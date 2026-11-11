// The New Zealand module beyond parsing: the postcode lookups (GeoNames' list, the regions from kuni), the validator, the NZ
// Post formatter, the comparer and the module. Parsing has its corpus under test-data/corpus/nz.

import { describe, expect, it } from "vitest";

import { parseLocation, validateAddress } from "../..";
import {
  compareNewZealandAddresses,
  findNewZealandRegion,
  formatNZPost,
  getRegionFromNewZealandPostcode,
  isKnownNewZealandPostcode,
  isValidNewZealandPostcode,
  looksNewZealand,
  newZealand,
  NZ_REGIONS,
  parseNewZealandAddress,
  parseNewZealandPostcode,
  validateNewZealandAddress,
} from "../../nz";
import type { ParsedAddress } from "../../types";

const parsed = (text: string): ParsedAddress => {
  const address = parseNewZealandAddress(text);
  if (!address) throw new Error(`no parse: ${text}`);
  return address;
};
const codes = (text: string, options = {}): string[] => {
  const { errors, warnings } = validateNewZealandAddress(parsed(text), options);
  return [...errors, ...warnings].map((one) => one.code);
};

describe("the postcode", () => {
  it.each(["1010", "0110", " 6011 "])("has the shape: %s", (postcode) => {
    expect(isValidNewZealandPostcode(postcode)).toBe(true);
  });

  it.each(["101", "10100", "10a0", ""])("has not the shape: %s", (postcode) => {
    expect(isValidNewZealandPostcode(postcode)).toBe(false);
  });

  it("is known when GeoNames' list has it", () => {
    expect(["1010", "6011", "8011", "9016", "0110", "3204", "8140"].map(isKnownNewZealandPostcode)).toEqual(
      new Array(7).fill(true),
    );
    expect(["9999", "0000", "12a4"].map(isKnownNewZealandPostcode)).toEqual(new Array(3).fill(false));
  });

  it("is in the region the list gives", () => {
    expect(
      ["1010", "6011", "8011", "9016", "0200", "3204", "7010", "5010"].map(getRegionFromNewZealandPostcode),
    ).toEqual(["AUK", "WGN", "CAN", "OTA", "NTL", "WKO", "NSN", "WGN"]);
    expect(getRegionFromNewZealandPostcode("9999")).toBeUndefined();
  });

  it("is taken apart", () => {
    expect(parseNewZealandPostcode("1010")).toEqual({ postcode: "1010", region: "AUK", known: true });
    expect(parseNewZealandPostcode("9999")).toEqual({ postcode: "9999", known: false });
  });
});

describe("the regions", () => {
  it("are kuni's, with their names in English and Japanese", () => {
    expect(NZ_REGIONS).toHaveLength(17);
    expect(NZ_REGIONS.find((region) => region.code === "AUK")).toEqual({
      code: "AUK",
      iso: "NZ-AUK",
      name: "Auckland",
      nameJa: "オークランド地方",
    });
  });

  it("are found by code or name, with no regard to hyphens or case", () => {
    expect(findNewZealandRegion("NZ-WGN")?.name).toBe("Wellington");
    expect(findNewZealandRegion("hawke's bay")?.code).toBe("HKB");
    expect(findNewZealandRegion("x")).toBeUndefined();
  });
});

describe("the validator", () => {
  it("has nothing to say about an address that is complete and whose postcode is listed", () => {
    expect(codes("1 Queen Street, Auckland 1010")).toEqual([]);
  });

  it("warns of a postcode that is not listed, and makes it an error when asked", () => {
    expect(codes("1 Queen Street, Auckland 9999")).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
    expect(
      validateNewZealandAddress(parsed("1 Queen Street, Auckland 9999"), { strictPostalValidation: true }).errors.map(
        (one) => one.code,
      ),
    ).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });

  it("warns of what is missing", () => {
    expect(codes("1 Queen Street, Auckland, New Zealand")).toEqual(["MISSING_POSTAL_CODE"]);
    expect(codes("Queen Street, Auckland 1010")).toEqual(["MISSING_STREET_NUMBER"]);
  });

  it("is the validator validateAddress uses when the module is handed in", () => {
    const result = validateAddress("1 Queen Street, Auckland 9999, New Zealand", { countries: [newZealand] });

    expect(result.parsedAddress?.country).toBe("NZ");
    expect(result.warnings.map((one) => one.code)).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });
});

describe("the NZ Post format", () => {
  it("writes the unit, the street with its number, the suburb, then the city and the postcode", () => {
    expect(formatNZPost(parsed("3/45 Dominion Rd, Mount Eden, Auckland 1024"))).toEqual({
      lines: ["Unit 3", "45 Dominion Rd", "Mount Eden", "Auckland 1024"],
      singleLine: "Unit 3, 45 Dominion Rd, Mount Eden, Auckland 1024",
      deliveryLine: "45 Dominion Rd",
      lastLine: "Auckland 1024",
      country: "NZ",
      format: "nz-post",
    });
  });

  it("writes a PO Box, a level, who it is care of and the country when asked", () => {
    expect(formatNZPost(parsed("C/- Smith, PO Box 123, Christchurch 8140"), { includeCountry: true }).lines).toEqual([
      "C/- Smith",
      "PO Box 123",
      "Christchurch 8140",
      "NEW ZEALAND",
    ]);
    expect(formatNZPost(parsed("Level 5, 100 Willis Street, Wellington 6011")).lines).toEqual([
      "Level 5",
      "100 Willis Street",
      "Wellington 6011",
    ]);
  });
});

describe("the comparer", () => {
  it("takes the street's type, Mt for Mount and letter case for no difference", () => {
    expect(
      compareNewZealandAddresses(parsed("45 Dominion Road, Auckland 1024"), parsed("45 DOMINION RD, AUCKLAND 1024"))
        .isSame,
    ).toBe(true);
    expect(
      compareNewZealandAddresses(
        parsed("1 Hill St, Mt Eden, Auckland 1024"),
        parsed("1 Hill Street, Mount Eden, Auckland 1024"),
      ).isSame,
    ).toBe(true);
  });

  it("names what differs", () => {
    const result = compareNewZealandAddresses(
      parsed("45 Dominion Road, Auckland 1024"),
      parsed("47 Dominion Road, Auckland 1024"),
    );

    expect(result.differences).toEqual([{ field: "number", first: "45", second: "47" }]);
  });
});

describe("the module", () => {
  it("claims an address only on the country's name or a sign of its own", () => {
    expect(looksNewZealand("1 Queen Street, Auckland 1010, New Zealand")).toBe(true);
    expect(looksNewZealand("123 State Highway 1, RD 2, Hamilton 3282")).toBe(true);
    expect(looksNewZealand("1 Queen Street, Auckland 1010")).toBe(false);
    expect(parseLocation("45 Dominion Road, Auckland 1024, New Zealand", { countries: [newZealand] })?.state).toBe(
      "AUK",
    );
  });

  it("is a module of New Zealand only", () => {
    expect(newZealand.codes).toEqual(["NZ"]);
  });
});
