// The Spanish module beyond parsing: the postcode lookups (GeoNames' list, the provinces from kuni), the validator, the
// Correos formatter, the comparer and the module. Parsing has its corpus under test-data/corpus/es.

import { describe, expect, it } from "vitest";

import { parseLocation, validateAddress } from "../..";
import {
  compareSpanishAddresses,
  ES_PROVINCES,
  findSpanishProvince,
  formatCorreos,
  getProvinceFromSpanishPostcode,
  isKnownSpanishPostcode,
  isValidSpanishPostcode,
  looksSpanish,
  parseSpanishAddress,
  parseSpanishPostcode,
  spain,
  validateSpanishAddress,
} from "../../es";
import type { ParsedAddress } from "../../types";

const parsed = (text: string): ParsedAddress => {
  const address = parseSpanishAddress(text);
  if (!address) throw new Error(`no parse: ${text}`);
  return address;
};
const codes = (text: string, options = {}): string[] => {
  const { errors, warnings } = validateSpanishAddress(parsed(text), options);
  return [...errors, ...warnings].map((one) => one.code);
};

describe("the postcode", () => {
  it.each(["28014", "01001", "52080", " 08001 ", "35001"])("has the shape: %s", (postcode) => {
    expect(isValidSpanishPostcode(postcode)).toBe(true);
  });

  it.each(["2801", "00100", "53000", "99999", "280145", "2801a", ""])("has not the shape: %s", (postcode) => {
    expect(isValidSpanishPostcode(postcode)).toBe(false);
  });

  it("is known when GeoNames' list has it", () => {
    expect(["28014", "08001", "41001", "46001", "48001", "35001"].map(isKnownSpanishPostcode)).toEqual(
      new Array(6).fill(true),
    );
    expect(["28999", "00100", "52999", "abcde"].map(isKnownSpanishPostcode)).toEqual(new Array(4).fill(false));
  });

  it("is in the province its first two digits name", () => {
    expect(
      ["28014", "08001", "41001", "46001", "48001", "35001", "07001", "03001"].map(getProvinceFromSpanishPostcode),
    ).toEqual(["M", "B", "SE", "V", "BI", "GC", "PM", "A"]);
    expect(getProvinceFromSpanishPostcode("28999")).toBe("M");
    expect(getProvinceFromSpanishPostcode("99999")).toBeUndefined();
  });

  it("has a province of the table for every province of a postcode in the list", () => {
    const found = new Set(
      Array.from({ length: 52 }, (_, at) => getProvinceFromSpanishPostcode(`${String(at + 1).padStart(2, "0")}001`)),
    );

    expect([...found].filter((code) => !findSpanishProvince(code ?? ""))).toEqual([]);
    expect(found.size).toBe(52);
  });

  it("is taken apart", () => {
    expect(parseSpanishPostcode("28014")).toEqual({ postcode: "28014", region: "M", known: true });
    expect(parseSpanishPostcode("28999")).toEqual({ postcode: "28999", region: "M", known: false });
  });
});

describe("the provinces", () => {
  it("are the fifty and Ceuta and Melilla, with their names in English and Japanese", () => {
    expect(ES_PROVINCES).toHaveLength(52);
    expect(ES_PROVINCES.find((province) => province.code === "M")).toEqual({
      code: "M",
      iso: "ES-M",
      name: "Madrid Province",
      nameJa: "マドリード県",
    });
    expect(ES_PROVINCES.every((province) => province.nameJa !== "")).toBe(true);
  });

  it("are found by code or name, with no regard to accents or case", () => {
    expect(findSpanishProvince("ES-B")?.name).toBe("Barcelona");
    expect(findSpanishProvince("seville")?.code).toBe("SE");
    expect(findSpanishProvince("zz")).toBeUndefined();
  });
});

describe("the validator", () => {
  it("has nothing to say about an address that is complete and whose postcode is listed", () => {
    expect(codes("Calle de Alcalá, 42, 28014 Madrid")).toEqual([]);
  });

  it("warns of a postcode that is not listed, and makes it an error when asked", () => {
    expect(codes("Calle Mayor 5, 28999 Madrid")).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
    expect(
      validateSpanishAddress(parsed("Calle Mayor 5, 28999 Madrid"), { strictPostalValidation: true }).errors.map(
        (one) => one.code,
      ),
    ).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });

  it("warns of a postcode that names no province", () => {
    expect(codes("Calle Mayor 5, 99999 Madrid")).toEqual(["INVALID_POSTAL_FORMAT"]);
  });

  it("warns of what is missing", () => {
    expect(codes("Calle Mayor 5, Madrid, España")).toEqual(["MISSING_POSTAL_CODE"]);
    expect(codes("Calle Mayor 5, 28013")).toEqual(["MISSING_CITY"]);
    expect(codes("Calle Mayor, 28013 Madrid")).toEqual(["MISSING_STREET_NUMBER"]);
  });

  it("asks for no number of a street that has none (s/n) or of an Apartado", () => {
    expect(codes("Plaza Mayor s/n, 28012 Madrid")).toEqual([]);
    expect(codes("Apartado de Correos 123, 41080 Sevilla")).toEqual([]);
  });

  it("is the validator validateAddress uses when the module is handed in", () => {
    const result = validateAddress("Calle Mayor 5, 28999 Madrid, España", { countries: [spain] });

    expect(result.parsedAddress?.country).toBe("ES");
    expect(result.warnings.map((one) => one.code)).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });
});

describe("the Correos format", () => {
  it("writes the street, the number, the floor and the door, then the postcode and the place", () => {
    expect(formatCorreos(parsed("Calle de Alcalá 42, 3º B, 28014 Madrid"))).toEqual({
      lines: ["Calle de Alcalá, 42, 3º B", "28014 Madrid"],
      singleLine: "Calle de Alcalá, 42, 3º B, 28014 Madrid",
      deliveryLine: "Calle de Alcalá, 42, 3º B",
      lastLine: "28014 Madrid",
      country: "ES",
      format: "correos",
    });
  });

  it("writes the province in brackets, the staircase, the ground floor and the country when asked", () => {
    expect(
      formatCorreos(parsed("C/ Sierpes 10, Escalera 2, Bajo, 41004 Sevilla (Sevilla)"), { includeCountry: true }).lines,
    ).toEqual(["C/ Sierpes, 10, Esc. 2, Bajo", "41004 Sevilla (Sevilla)", "ESPAÑA"]);
  });

  it("writes an Apartado de Correos and who it is care of", () => {
    expect(formatCorreos(parsed("A/A Sr. García, Apartado de Correos 123, 41080 Sevilla")).lines).toEqual([
      "A/A Sr. García",
      "Apartado de Correos 123",
      "41080 Sevilla",
    ]);
  });
});

describe("the comparer", () => {
  it("takes the street's type, its article, accents and letter case for no difference", () => {
    expect(
      compareSpanishAddresses(parsed("Calle de Alcalá, 42, 28014 Madrid"), parsed("C/ ALCALA 42, 28014 MADRID")).isSame,
    ).toBe(true);
    expect(
      compareSpanishAddresses(
        parsed("Avenida Diagonal 405, 08008 Barcelona"),
        parsed("Avda. Diagonal, 405, 08008 Barcelona"),
      ).isSame,
    ).toBe(true);
  });

  it("names what differs", () => {
    const result = compareSpanishAddresses(
      parsed("Calle Mayor 5, 28013 Madrid"),
      parsed("Calle Mayor 7, 28013 Madrid"),
    );

    expect(result.differences).toEqual([{ field: "number", first: "5", second: "7" }]);
  });
});

describe("the module", () => {
  it("reads a Spanish address with no hint and not a Miami one", () => {
    expect(looksSpanish("Calle Mayor 5, 28013 Madrid")).toBe(true);
    expect(looksSpanish("Calle Ocho, Miami, FL 33135")).toBe(false);
    expect(parseLocation("Calle de Alcalá, 42, 28014 Madrid", { countries: [spain] })?.state).toBe("M");
  });

  it("is a module of Spain only", () => {
    expect(spain.codes).toEqual(["ES"]);
  });
});
