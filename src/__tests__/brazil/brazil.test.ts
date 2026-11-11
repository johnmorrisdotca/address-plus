// The Brazilian module beyond parsing: the CEP lookups (a state told from the range of the first five digits, with no list of
// CEPs), the validator, the Correios formatter, the comparer and the module. Parsing has its corpus under test-data/corpus/br.

import { describe, expect, it } from "vitest";

import { parseLocation, validateAddress } from "../..";
import {
  BR_STATES,
  brazil,
  compareBrazilianAddresses,
  findBrazilianState,
  formatBrazilianPost,
  getStateFromBrazilianPostcode,
  isKnownBrazilianPostcode,
  isValidBrazilianPostcode,
  looksBrazilian,
  parseBrazilianAddress,
  validateBrazilianAddress,
} from "../../br";
import { BR_RANGES } from "../../constants/br/ranges";
import type { ParsedAddress } from "../../types";

const parsed = (text: string): ParsedAddress => {
  const address = parseBrazilianAddress(text);
  if (!address) throw new Error(`no parse: ${text}`);
  return address;
};
const codes = (text: string, options = {}): string[] => {
  const { errors, warnings } = validateBrazilianAddress(parsed(text), options);
  return [...errors, ...warnings].map((one) => one.code);
};

describe("the CEP", () => {
  it.each(["01310-200", "01310200", " 70040-010 "])("has the shape: %s", (postcode) => {
    expect(isValidBrazilianPostcode(postcode)).toBe(true);
  });

  it.each(["01310-20", "1310-200", "01310-2000", "0131a-200", ""])("has not the shape: %s", (postcode) => {
    expect(isValidBrazilianPostcode(postcode)).toBe(false);
  });

  it("is in the state whose range holds its first five digits", () => {
    const cases: [string, string][] = [
      ["01310-200", "SP"],
      ["20040-020", "RJ"],
      ["29010-120", "ES"],
      ["30130-010", "MG"],
      ["40020-000", "BA"],
      ["50030-000", "PE"],
      ["60060-000", "CE"],
      ["70040-010", "DF"],
      ["72800-000", "GO"],
      ["78900-000", "RO"],
      ["80010-000", "PR"],
      ["90010-000", "RS"],
      ["69900-000", "AC"],
      ["69300-000", "RR"],
    ];

    expect(cases.map(([cep]) => getStateFromBrazilianPostcode(cep))).toEqual(cases.map(([, state]) => state));
  });

  it("is known only when a state's range holds it", () => {
    expect(["01310-200", "99999-999"].map(isKnownBrazilianPostcode)).toEqual([true, true]);
    expect(["00999-000", "01310"].map(isKnownBrazilianPostcode)).toEqual([false, false]);
  });

  it("has ranges that do not overlap and that give every state of the table one", () => {
    const flat = Object.entries(BR_RANGES).flatMap(([state, ranges]) =>
      ranges.map(([from, to]) => ({ state, from, to })),
    );
    const overlaps = flat.filter((one) =>
      flat.some((other) => other !== one && one.from <= other.to && other.from <= one.to),
    );

    expect(overlaps).toEqual([]);
    expect(Object.keys(BR_RANGES).sort()).toEqual(BR_STATES.map((state) => state.code).sort());
  });
});

describe("the states", () => {
  it("are kuni's twenty-seven, with their names in English and Japanese", () => {
    expect(BR_STATES).toHaveLength(27);
    expect(BR_STATES.find((state) => state.code === "SP")).toMatchObject({ iso: "BR-SP", name: "São Paulo" });
    expect(BR_STATES.every((state) => state.nameJa !== "")).toBe(true);
  });

  it("are found by code or name, with no regard to accents", () => {
    expect(findBrazilianState("BR-RJ")?.name).toBe("Rio de Janeiro");
    expect(findBrazilianState("sao paulo")?.code).toBe("SP");
    expect(findBrazilianState("Distrito Federal")?.code).toBe("DF");
    expect(findBrazilianState("xx")).toBeUndefined();
  });
});

describe("the validator", () => {
  it("has nothing to say about an address that is complete and whose CEP is in a range", () => {
    expect(codes("Avenida Paulista, 1578, São Paulo - SP, 01310-200")).toEqual([]);
  });

  it("warns of a CEP that is in no state's range, and makes it an error when asked", () => {
    expect(codes("Rua Augusta, 100, São Paulo - SP, 00999-000")).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
    expect(
      validateBrazilianAddress(parsed("Rua Augusta, 100, São Paulo - SP, 00999-000"), {
        strictPostalValidation: true,
      }).errors.map((one) => one.code),
    ).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });

  it("warns of a state that is not the CEP's", () => {
    expect(codes("Rua Augusta, 100, São Paulo - RJ, 01305-000")).toEqual(["POSTAL_REGION_MISMATCH"]);
  });

  it("makes a state that is not the CEP's an error when postal findings are errors, since the ranges are facts", () => {
    const strict = validateBrazilianAddress(parsed("Rua Augusta, 100, São Paulo - RJ, 01305-000"), {
      strictPostalValidation: true,
    });

    expect(strict.errors.map((one) => one.code)).toEqual(["POSTAL_REGION_MISMATCH"]);
  });

  it("warns of what is missing", () => {
    expect(codes("Rua Augusta, 100, São Paulo - SP, Brasil")).toEqual(["MISSING_POSTAL_CODE"]);
    expect(codes("Rua Augusta, 100, 01305-000")).toEqual(["MISSING_CITY"]);
    expect(codes("Rua Augusta, São Paulo - SP, 01305-000")).toEqual(["MISSING_STREET_NUMBER"]);
  });

  it("is the validator validateAddress uses when the module is handed in", () => {
    const result = validateAddress("Rua Augusta, 100, São Paulo - RJ, 01305-000", { countries: [brazil] });

    expect(result.parsedAddress?.country).toBe("BR");
    expect(result.warnings.map((one) => one.code)).toEqual(["POSTAL_REGION_MISMATCH"]);
  });
});

describe("the Correios format", () => {
  it("writes the street, the number and the complement, the bairro, then the CEP, the city and the state", () => {
    expect(formatBrazilianPost(parsed("Av. Paulista, 1578 - Apto 45 - Bela Vista, São Paulo - SP, 01310200"))).toEqual({
      lines: ["Av. Paulista, 1578, Apto 45", "Bela Vista", "01310-200 São Paulo SP"],
      singleLine: "Av. Paulista, 1578, Apto 45, Bela Vista, 01310-200 São Paulo SP",
      deliveryLine: "Av. Paulista, 1578, Apto 45",
      lastLine: "01310-200 São Paulo SP",
      country: "BR",
      format: "correios",
    });
  });

  it("writes a floor, a Caixa Postal, who it is care of and the country when asked", () => {
    expect(
      formatBrazilianPost(parsed("Rua da Quitanda, 50, 5º andar, Rio de Janeiro - RJ, 20011-030")).deliveryLine,
    ).toBe("Rua da Quitanda, 50, 5º andar");
    expect(
      formatBrazilianPost(parsed("A/C Maria, Caixa Postal 123, Salvador - BA, 40010-970"), { includeCountry: true })
        .lines,
    ).toEqual(["A/C Maria", "Caixa Postal 123", "40010-970 Salvador BA", "BRASIL"]);
  });
});

describe("the comparer", () => {
  it("takes the street's type, accents, letter case and the CEP's hyphen for no difference", () => {
    expect(
      compareBrazilianAddresses(
        parsed("Avenida Paulista, 1578, São Paulo - SP, 01310-200"),
        parsed("AV. PAULISTA 1578, SAO PAULO/SP, 01310200"),
      ).isSame,
    ).toBe(true);
  });

  it("names what differs", () => {
    const result = compareBrazilianAddresses(
      parsed("Rua Augusta, 100, São Paulo - SP, 01305-000"),
      parsed("Rua Augusta, 102, São Paulo - SP, 01305-000"),
    );

    expect(result.differences).toEqual([{ field: "number", first: "100", second: "102" }]);
  });
});

describe("the module", () => {
  it("claims an address that ends with a hyphenated CEP in a state's range, and not a ZIP+4 or a Portuguese postcode", () => {
    expect(looksBrazilian("Rua Augusta, 100, São Paulo - SP, 01305-000")).toBe(true);
    expect(looksBrazilian("Rua Augusta, 100, São Paulo, Brasil")).toBe(true);
    expect(looksBrazilian("123 Main St, Seattle, WA 98101-1234")).toBe(false);
    expect(looksBrazilian("Rua Augusta 100, 1000-001 Lisboa")).toBe(false);
    expect(parseLocation("Rua Augusta, 100, São Paulo - SP, 01305-000", { countries: [brazil] })?.state).toBe("SP");
  });

  it("is a module of Brazil only", () => {
    expect(brazil.codes).toEqual(["BR"]);
  });
});
