// The Dutch module beyond parsing: the postcode lookups (CBS's list of four-digit postcode areas), the validator, the PostNL
// formatter, the comparer and the module. Parsing has its corpus under test-data/corpus/nl.

import { describe, expect, it } from "vitest";

import { parseLocation, validateAddress } from "../..";
import {
  compareDutchAddresses,
  formatPostNL,
  isKnownDutchPostcode,
  isValidDutchPostcode,
  looksDutch,
  netherlands,
  parseDutchAddress,
  parseDutchPostcode,
  validateDutchAddress,
} from "../../nl";
import type { ParsedAddress } from "../../types";

const parsed = (text: string): ParsedAddress => {
  const address = parseDutchAddress(text);
  if (!address) throw new Error(`no parse: ${text}`);
  return address;
};
const codes = (text: string, options = {}): string[] => {
  const { errors, warnings } = validateDutchAddress(parsed(text), options);
  return [...errors, ...warnings].map((one) => one.code);
};

describe("the postcode", () => {
  it.each(["1015 CJ", "1015CJ", "1015cj", " 9711 LM ", "2513 AA"])("has the shape: %s", (postcode) => {
    expect(isValidDutchPostcode(postcode)).toBe(true);
  });

  it.each(["1015", "0123 AB", "1015 SA", "1015 SD", "1015 SS", "1015 C", "1015 CJA", "ABCD 12", ""])(
    "has not the shape: %s",
    (postcode) => {
      expect(isValidDutchPostcode(postcode)).toBe(false);
    },
  );

  it("is known when CBS's list has its digits", () => {
    expect(["1015 CJ", "1012 JS", "3511 AA", "9711 LM", "6811 DG"].map(isKnownDutchPostcode)).toEqual(
      new Array(5).fill(true),
    );
    expect(["1000 AA", "3500 GE", "1015", "0123 AB"].map(isKnownDutchPostcode)).toEqual(new Array(4).fill(false));
  });

  it("is given in its canonical form", () => {
    expect(parseDutchPostcode("1015cj")).toEqual({ postcode: "1015 CJ", known: true });
    expect(parseDutchPostcode("1000AA")).toEqual({ postcode: "1000 AA", known: false });
    expect(parseDutchPostcode("nonsense")).toEqual({ postcode: "nonsense", known: false });
  });
});

describe("the validator", () => {
  it("has nothing to say about an address that is complete and whose postcode is listed", () => {
    expect(codes("Keizersgracht 123, 1015 CJ Amsterdam")).toEqual([]);
  });

  it("warns of a postcode that is not listed, and makes it an error when asked", () => {
    expect(codes("Keizersgracht 123, 1000 AA Amsterdam")).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
    expect(
      validateDutchAddress(parsed("Keizersgracht 123, 1000 AA Amsterdam"), { strictPostalValidation: true }).errors.map(
        (one) => one.code,
      ),
    ).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });

  it("warns of a postcode that is not four digits and two letters", () => {
    expect(codes("Keizersgracht 123, 0123 AB Amsterdam")).toEqual(["INVALID_POSTAL_FORMAT"]);
    expect(codes("Keizersgracht 123, 1015 SS Amsterdam")).toEqual(["INVALID_POSTAL_FORMAT"]);
  });

  it("warns of what is missing", () => {
    expect(codes("Keizersgracht 123, Amsterdam, Nederland")).toEqual(["MISSING_POSTAL_CODE"]);
    expect(codes("Keizersgracht 123, 1015 CJ")).toEqual(["MISSING_CITY"]);
    expect(codes("Keizersgracht, 1015 CJ Amsterdam")).toEqual(["MISSING_STREET_NUMBER"]);
  });

  it("does not ask a Postbus for a house number", () => {
    expect(codes("Postbus 1234, 3500 GE Utrecht")).toEqual([]);
  });

  it("is the validator validateAddress uses when the module is handed in", () => {
    const result = validateAddress("Keizersgracht 123, 1000 AA Amsterdam", { countries: [netherlands] });

    expect(result.parsedAddress?.country).toBe("NL");
    expect(result.warnings.map((one) => one.code)).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });
});

describe("the PostNL format", () => {
  it("writes the street with its number and addition, then the postcode and the place", () => {
    expect(formatPostNL(parsed("Keizersgracht 123 A, 1015cj Amsterdam"))).toEqual({
      lines: ["Keizersgracht 123 A", "1015 CJ Amsterdam"],
      singleLine: "Keizersgracht 123 A, 1015 CJ Amsterdam",
      deliveryLine: "Keizersgracht 123 A",
      lastLine: "1015 CJ Amsterdam",
      country: "NL",
      format: "postnl",
    });
  });

  it("joins a floor with a hyphen and a word with a space", () => {
    expect(formatPostNL(parsed("Keizersgracht 123 2, 1015 CJ Amsterdam")).deliveryLine).toBe("Keizersgracht 123-2");
    expect(formatPostNL(parsed("Damstraat 1 bis, 1012 JL Amsterdam")).deliveryLine).toBe("Damstraat 1 bis");
  });

  it("writes a Postbus, who it is care of and the country when asked", () => {
    expect(
      formatPostNL(parsed("t.a.v. De Vries, Postbus 1234, 3500 GE Utrecht"), { includeCountry: true }).lines,
    ).toEqual(["t.a.v. De Vries", "Postbus 1234", "3500 GE Utrecht", "NEDERLAND"]);
  });

  it("gives nothing for no address", () => {
    expect(formatPostNL(undefined as unknown as ParsedAddress).lines).toEqual([]);
  });
});

describe("the comparer", () => {
  it("takes letter case, the postcode's space and the street's spelling for no difference", () => {
    expect(
      compareDutchAddresses(parsed("Hoofdstraat 5, 9711 LM Groningen"), parsed("HOOFDSTR. 5, 9711LM GRONINGEN")).isSame,
    ).toBe(true);
  });

  it("names what differs", () => {
    const result = compareDutchAddresses(
      parsed("Keizersgracht 123A, 1015 CJ Amsterdam"),
      parsed("Keizersgracht 123B, 1015 CJ Amsterdam"),
    );

    expect(result.isSame).toBe(false);
    expect(result.differences).toEqual([{ field: "numberExtension", first: "A", second: "B" }]);
  });
});

describe("the module", () => {
  it("reads a Dutch address with no hint", () => {
    expect(looksDutch("Keizersgracht 123, 1015 CJ Amsterdam")).toBe(true);
    expect(parseLocation("Keizersgracht 123A, 1015 CJ Amsterdam", { countries: [netherlands] })?.numberExtension).toBe(
      "A",
    );
  });

  it("gives snake_case keys when asked", () => {
    expect(parseDutchAddress("Keizersgracht 123A, 1015 CJ Amsterdam", { useSnakeCase: true })).toMatchObject({
      number_extension: "A",
    });
  });

  it("is a module of the Netherlands only", () => {
    expect(netherlands.code).toBe("NL");
    expect(netherlands.codes).toEqual(["NL"]);
  });
});
