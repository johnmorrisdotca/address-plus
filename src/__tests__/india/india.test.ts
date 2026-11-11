// The Indian module beyond parsing: the PIN code lookups (GeoNames' list, the states from kuni), the validator, the India Post
// formatter, the comparer and the module. Parsing has its corpus under test-data/corpus/in.

import { describe, expect, it } from "vitest";

import { parseLocation, validateAddress } from "../..";
import {
  compareIndianAddresses,
  findIndianState,
  formatIndiaPost,
  getStateFromIndianPostcode,
  IN_STATES,
  india,
  isKnownIndianPostcode,
  isValidIndianPostcode,
  looksIndian,
  parseIndianAddress,
  parseIndianPostcode,
  validateIndianAddress,
} from "../../in";
import type { ParsedAddress } from "../../types";

const parsed = (text: string): ParsedAddress => {
  const address = parseIndianAddress(text);
  if (!address) throw new Error(`no parse: ${text}`);
  return address;
};
const codes = (text: string, options = {}): string[] => {
  const { errors, warnings } = validateIndianAddress(parsed(text), options);
  return [...errors, ...warnings].map((one) => one.code);
};

describe("the PIN code", () => {
  it.each(["560038", "560 038", " 110001 ", "999999"])("has the shape: %s", (postcode) => {
    expect(isValidIndianPostcode(postcode)).toBe(true);
  });

  it.each(["060038", "56003", "5600381", "56003a", ""])("has not the shape: %s", (postcode) => {
    expect(isValidIndianPostcode(postcode)).toBe(false);
  });

  it("is known when GeoNames' list has it", () => {
    expect(["560038", "110001", "400001", "600001", "700016", "500034", "380001"].map(isKnownIndianPostcode)).toEqual(
      new Array(7).fill(true),
    );
    expect(["999999", "100000", "560 099x"].map(isKnownIndianPostcode)).toEqual(new Array(3).fill(false));
  });

  it("is in the state of the list", () => {
    expect(
      ["560038", "110001", "400001", "600001", "700016", "500034", "160015", "682001"].map(getStateFromIndianPostcode),
    ).toEqual(["KA", "DL", "MH", "TN", "WB", "TS", "CH", "KL"]);
    expect(getStateFromIndianPostcode("999999")).toBeUndefined();
  });

  it("is taken apart, with no space", () => {
    expect(parseIndianPostcode("560 038")).toEqual({ postcode: "560038", region: "KA", known: true });
    expect(parseIndianPostcode("999999")).toEqual({ postcode: "999999", known: false });
  });
});

describe("the states", () => {
  it("are kuni's, with their names in English and Japanese", () => {
    expect(IN_STATES).toHaveLength(36);
    expect(IN_STATES.find((state) => state.code === "KA")).toMatchObject({ iso: "IN-KA", name: "Karnataka" });
    expect(IN_STATES.every((state) => state.nameJa !== "")).toBe(true);
  });

  it("are found by code or name, with & for and, and the old names", () => {
    expect(findIndianState("IN-MH")?.name).toBe("Maharashtra");
    expect(findIndianState("Jammu & Kashmir")?.code).toBe("JK");
    expect(findIndianState("Pondicherry")?.code).toBe("PY");
    expect(findIndianState("Orissa")?.code).toBe("OD");
    expect(findIndianState("xx")).toBeUndefined();
  });
});

describe("the validator", () => {
  it("has nothing to say about an address that is complete and whose PIN is listed", () => {
    expect(codes("12 MG Road, Bengaluru, Karnataka 560038")).toEqual([]);
  });

  it("warns of a PIN that is not listed, and makes it an error when asked", () => {
    expect(codes("12 MG Road, Bengaluru 999999")).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
    expect(
      validateIndianAddress(parsed("12 MG Road, Bengaluru 999999"), { strictPostalValidation: true }).errors.map(
        (one) => one.code,
      ),
    ).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });

  it("warns of a state that is not the PIN's", () => {
    expect(codes("12 MG Road, Bengaluru, Kerala 560038")).toEqual(["POSTAL_REGION_MISMATCH"]);
    const strict = validateIndianAddress(parsed("12 MG Road, Bengaluru, Kerala 560038"), {
      strictPostalValidation: true,
    });

    expect(strict.errors).toEqual([]);
    expect(strict.warnings.map((one) => one.code)).toEqual(["POSTAL_REGION_MISMATCH"]);
  });

  it("warns of what is missing", () => {
    expect(codes("12 MG Road, Bengaluru, India")).toEqual(["MISSING_POSTAL_CODE"]);
    expect(codes("12 MG Road, 560038")).toEqual(["MISSING_CITY"]);
    expect(codes("MG Road, Bengaluru 560038")).toEqual(["MISSING_STREET_NUMBER"]);
  });

  it("is the validator validateAddress uses when the module is handed in", () => {
    const result = validateAddress("12 MG Road, Bengaluru, Kerala 560038, India", { countries: [india] });

    expect(result.parsedAddress?.country).toBe("IN");
    expect(result.warnings.map((one) => one.code)).toEqual(["POSTAL_REGION_MISMATCH"]);
  });
});

describe("the India Post format", () => {
  it("writes the building, the flat, the street, the area, the city and PIN, then the state", () => {
    expect(
      formatIndiaPost(parsed("Flat 4B, Sunshine Apartments, 12 MG Road, Indiranagar, Bengaluru, Karnataka 560038")),
    ).toEqual({
      lines: ["Sunshine Apartments", "Flat 4B", "12 MG Road", "Indiranagar", "Bengaluru 560038", "Karnataka"],
      singleLine: "Sunshine Apartments, Flat 4B, 12 MG Road, Indiranagar, Bengaluru 560038, Karnataka",
      deliveryLine: "12 MG Road",
      lastLine: "Bengaluru 560038",
      country: "IN",
      format: "india-post",
    });
  });

  it("writes who it is care of, a Post Box and the country when asked", () => {
    expect(
      formatIndiaPost(parsed("C/o Sharma, Post Box No. 123, Mumbai 400001"), { includeCountry: true }).lines,
    ).toEqual(["C/o Sharma", "Post Box 123", "Mumbai 400001", "Maharashtra", "INDIA"]);
  });
});

describe("the comparer", () => {
  it("takes the street's type, letter case and the PIN's space for no difference", () => {
    expect(
      compareIndianAddresses(parsed("12 MG Road, Bengaluru 560038"), parsed("12 MG RD, BENGALURU 560 038")).isSame,
    ).toBe(true);
  });

  it("names what differs", () => {
    const result = compareIndianAddresses(
      parsed("12 MG Road, Bengaluru 560038"),
      parsed("14 MG Road, Bengaluru 560038"),
    );

    expect(result.differences).toEqual([{ field: "number", first: "12", second: "14" }]);
  });
});

describe("the module", () => {
  it("claims an address only on India, the word PIN or a state's name before a PIN the list has", () => {
    expect(looksIndian("12 MG Road, Bengaluru, Karnataka 560038")).toBe(true);
    expect(looksIndian("12 MG Road, Bengaluru, PIN 560038")).toBe(true);
    expect(looksIndian("12 MG Road, Bengaluru 560038, India")).toBe(true);
    expect(looksIndian("12 MG Road, Bengaluru 560038")).toBe(false);
    expect(looksIndian("12 MG Road, Bengaluru 560038, IN")).toBe(false);
    expect(looksIndian("Tiananmen Square, Beijing 100006")).toBe(false);
    expect(parseLocation("12 MG Road, Bengaluru, Karnataka 560038", { countries: [india] })?.state).toBe("KA");
  });

  it("is a module of India only", () => {
    expect(india.codes).toEqual(["IN"]);
  });
});
