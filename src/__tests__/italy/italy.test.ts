// The Italian module beyond parsing: the postcode lookups (GeoNames' list, the provinces from kuni), the validator, the
// Poste Italiane formatter, the comparer and the module. Parsing has its corpus under test-data/corpus/it.

import { describe, expect, it } from "vitest";

import { parseLocation, validateAddress } from "../..";
import {
  compareItalianAddresses,
  findItalianProvince,
  formatPosteItaliane,
  getProvinceFromItalianPostcode,
  isKnownItalianPostcode,
  isValidItalianPostcode,
  IT_PROVINCES,
  italy,
  looksItalian,
  parseItalianAddress,
  parseItalianPostcode,
  validateItalianAddress,
} from "../../it";
import type { ParsedAddress } from "../../types";

const parsed = (text: string): ParsedAddress => {
  const address = parseItalianAddress(text);
  if (!address) throw new Error(`no parse: ${text}`);
  return address;
};
const codes = (text: string, options = {}): string[] => {
  const { errors, warnings } = validateItalianAddress(parsed(text), options);
  return [...errors, ...warnings].map((one) => one.code);
};

describe("the postcode", () => {
  it.each(["00186", "20121", " 80132 ", "98168"])("has the shape: %s", (postcode) => {
    expect(isValidItalianPostcode(postcode)).toBe(true);
  });

  it.each(["0018", "001866", "0018a", ""])("has not the shape: %s", (postcode) => {
    expect(isValidItalianPostcode(postcode)).toBe(false);
  });

  it("is known when GeoNames' list has it", () => {
    expect(["00186", "20121", "80132", "10121", "50123", "40121"].map(isKnownItalianPostcode)).toEqual(
      new Array(6).fill(true),
    );
    expect(["00000", "99999", "20199x"].map(isKnownItalianPostcode)).toEqual(new Array(3).fill(false));
  });

  it("is in the province of the list, by its sigla", () => {
    expect(
      ["00186", "20121", "80132", "10121", "50123", "40121", "90133", "16121"].map(getProvinceFromItalianPostcode),
    ).toEqual(["RM", "MI", "NA", "TO", "FI", "BO", "PA", "GE"]);
    expect(getProvinceFromItalianPostcode("00000")).toBeUndefined();
  });

  it("is taken apart", () => {
    expect(parseItalianPostcode("20121")).toEqual({ postcode: "20121", region: "MI", known: true });
    expect(parseItalianPostcode("00000")).toEqual({ postcode: "00000", known: false });
  });
});

describe("the provinces", () => {
  it("are the second-level divisions with their names in English and Japanese, and Aosta by its sigla", () => {
    expect(IT_PROVINCES.find((province) => province.code === "MI")).toMatchObject({ iso: "IT-MI", name: "Milan" });
    expect(IT_PROVINCES.find((province) => province.code === "AO")).toMatchObject({ iso: "IT-23" });
    expect(IT_PROVINCES.every((province) => province.nameJa !== "")).toBe(true);
  });

  it("are found by sigla or name", () => {
    expect(findItalianProvince("rm")?.code).toBe("RM");
    expect(findItalianProvince("IT-NA")?.code).toBe("NA");
    expect(findItalianProvince("ZZ")).toBeUndefined();
  });
});

describe("the validator", () => {
  it("has nothing to say about an address that is complete and whose postcode is listed", () => {
    expect(codes("Via del Corso, 12, 00186 Roma RM")).toEqual([]);
  });

  it("warns of a postcode that is not listed, and makes it an error when asked", () => {
    expect(codes("Via Roma 12, 00000 Roma")).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
    expect(
      validateItalianAddress(parsed("Via Roma 12, 00000 Roma"), { strictPostalValidation: true }).errors.map(
        (one) => one.code,
      ),
    ).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });

  it("warns of a sigla that is not the postcode's", () => {
    expect(codes("Via Roma 12, 20121 Milano RM")).toEqual(["POSTAL_REGION_MISMATCH"]);
    expect(codes("Via Roma 12, 20121 Milano MI")).toEqual([]);
  });

  it("warns of what is missing", () => {
    expect(codes("Via Roma 12, Milano, Italia")).toEqual(["MISSING_POSTAL_CODE"]);
    expect(codes("Via Roma 12, 20121")).toEqual(["MISSING_CITY"]);
    expect(codes("Via Roma, 20121 Milano")).toEqual(["MISSING_STREET_NUMBER"]);
  });

  it("is the validator validateAddress uses when the module is handed in", () => {
    const result = validateAddress("Via Roma 12, 20121 Milano RM, Italia", { countries: [italy] });

    expect(result.parsedAddress?.country).toBe("IT");
    expect(result.warnings.map((one) => one.code)).toEqual(["POSTAL_REGION_MISMATCH"]);
  });
});

describe("the Poste Italiane format", () => {
  it("writes the street and its number, then the postcode, the place and the sigla", () => {
    expect(formatPosteItaliane(parsed("Via del Corso, 12/A, 00186 Roma"))).toEqual({
      lines: ["Via del Corso 12/A", "00186 Roma RM"],
      singleLine: "Via del Corso 12/A, 00186 Roma RM",
      deliveryLine: "Via del Corso 12/A",
      lastLine: "00186 Roma RM",
      country: "IT",
      format: "poste-italiane",
    });
  });

  it("writes the staircase, the floor and the flat after the number, and bis with a space", () => {
    expect(formatPosteItaliane(parsed("V.le Monza 12 bis, Scala B, 3° piano, Int. 5, 20127 Milano")).lines).toEqual([
      "V.le Monza 12 bis, Scala B, Piano 3, Interno 5",
      "20127 Milano MI",
    ]);
  });

  it("writes a Casella Postale, who it is care of and the country when asked", () => {
    expect(
      formatPosteItaliane(parsed("c/o Rossi, Casella Postale 123, 00186 Roma"), { includeCountry: true }).lines,
    ).toEqual(["c/o Rossi", "Casella Postale 123", "00186 Roma RM", "ITALIA"]);
  });
});

describe("the comparer", () => {
  it("takes the street's type, its article and letter case for no difference", () => {
    expect(
      compareItalianAddresses(parsed("Via del Corso 1, 00186 Roma"), parsed("V. Corso, 1, 00186 ROMA")).isSame,
    ).toBe(true);
    expect(
      compareItalianAddresses(parsed("Viale Monza 12, 20127 Milano"), parsed("V.le Monza 12, 20127 Milano")).isSame,
    ).toBe(true);
  });

  it("names what differs", () => {
    const result = compareItalianAddresses(
      parsed("Via Roma 12/A, 20121 Milano"),
      parsed("Via Roma 12/B, 20121 Milano"),
    );

    expect(result.differences).toEqual([{ field: "numberExtension", first: "A", second: "B" }]);
  });
});

describe("the module", () => {
  it("reads an Italian address with no hint and not an American one", () => {
    expect(looksItalian("Via Roma 12, 20121 Milano")).toBe(true);
    expect(looksItalian("Via Appia Way, Brooklyn, NY 11201")).toBe(false);
    expect(parseLocation("Via del Corso, 12/A, 00186 Roma", { countries: [italy] })?.state).toBe("RM");
  });

  it("is a module of Italy only", () => {
    expect(italy.codes).toEqual(["IT"]);
  });
});
