// How the country modules sit beside the core. Three promises are held here: handing the modules to parseLocation
// changes nothing for a US, Canadian or Japanese address (every case of those corpora gives the same result with the
// modules as without); an Australian or British address is told apart with no hint wherever its own country's signs
// are at its end; and a hint naming a country no module was given for is refused, not guessed at.

import { describe, expect, it } from "vitest";

import { australia, looksAustralian } from "../../au";
import { looksBrazilian } from "../../br";
import { looksGerman } from "../../de";
import { looksSpanish } from "../../es";
import { france, looksFrench } from "../../fr";
import { looksBritish, unitedKingdom } from "../../gb";
import { looksIndian } from "../../in";
import { looksItalian } from "../../it";
import { looksKorean } from "../../kr";
import { looksDutch } from "../../nl";
import { looksNewZealand } from "../../nz";
import { parseLocation } from "../../parser";
import { validateAddress } from "../../utils/comprehensive-validation";
import { allCases, COUNTRY_MODULES, parseCase } from "../corpus/corpus-support";

describe("the US, Canadian and Japanese corpora with the country modules handed in", () => {
  for (const country of ["us", "canada", "japan"]) {
    it(`gives every ${country} case the same result as without them`, () => {
      const changed: string[] = [];
      for (const testCase of allCases(country)) {
        const without = parseCase(testCase);
        const withModules = parseLocation(testCase.input, { ...testCase.options, countries: COUNTRY_MODULES });
        if (JSON.stringify(without) !== JSON.stringify(withModules)) changed.push(testCase.input);
      }

      expect(changed).toEqual([]);
      // Each corpus is parsed twice over, which takes longer than the default five seconds on a busy machine.
    }, 60_000);
  }
});

describe("telling Australian, British, French and German addresses apart with no hint", () => {
  const sure = (country: string): string[] =>
    allCases(country)
      .filter((testCase) => testCase.expected !== null)
      .map((testCase) => testCase.input);

  it("reads every Australian case that ends with a state and its postcode, or Australia, as Australian", () => {
    const misread = sure("au")
      .filter((input) => looksAustralian(input))
      .filter((input) => parseLocation(input, { countries: COUNTRY_MODULES })?.country !== "AU");

    expect(misread).toEqual([]);
  });

  it("reads every British case with a postcode in Royal Mail's grammar, or a country at its end, as British", () => {
    const misread = sure("gb")
      .filter((input) => looksBritish(input))
      .filter(
        (input) =>
          !["GB", "JE", "GY", "IM"].includes(parseLocation(input, { countries: COUNTRY_MODULES })?.country ?? ""),
      );

    expect(misread).toEqual([]);
  });

  it("reads every French case that ends with France, holds a CEDEX or has a French street and a postcode first, as French", () => {
    const misread = sure("fr")
      .filter((input) => looksFrench(input))
      .filter(
        (input) =>
          !["FR", "MC", "PM", "BL", "MF", "WF", "PF", "NC"].includes(
            parseLocation(input, { countries: COUNTRY_MODULES })?.country ?? "",
          ),
      );

    expect(misread).toEqual([]);
  });

  it("reads every German case that ends with Germany, or has a German street and a postcode first, as German", () => {
    const misread = sure("de")
      .filter((input) => looksGerman(input))
      .filter((input) => parseLocation(input, { countries: COUNTRY_MODULES })?.country !== "DE");

    expect(misread).toEqual([]);
  });

  it("detects most of each corpus without a hint", () => {
    const share = (country: string, detect: (text: string) => boolean): number =>
      sure(country).filter(detect).length / sure(country).length;

    expect(share("au", looksAustralian)).toBeGreaterThan(0.9);
    expect(share("gb", looksBritish)).toBeGreaterThan(0.9);
    expect(share("fr", looksFrench)).toBeGreaterThan(0.9);
    expect(share("de", looksGerman)).toBeGreaterThan(0.85);
  });

  it("claims no US, Canadian or Japanese case", () => {
    const claimed = [...allCases("us"), ...allCases("canada"), ...allCases("japan")]
      .map((testCase) => testCase.input)
      .filter((input) => looksAustralian(input) || looksBritish(input) || looksFrench(input) || looksGerman(input));

    expect(claimed).toEqual([]);
  });

  it("claims no case of another country's corpus for France or for Germany", () => {
    const others = (...countries: string[]): string[] =>
      countries.flatMap((country) => allCases(country)).map((testCase) => testCase.input);

    expect(others("au", "gb", "de").filter(looksFrench)).toEqual([]);
    expect(others("au", "gb", "fr").filter(looksGerman)).toEqual([]);
  });

  it("is not claimed by the Australian or British modules for any French or German case", () => {
    const claimed = [...allCases("fr"), ...allCases("de")]
      .map((testCase) => testCase.input)
      .filter((input) => looksAustralian(input) || looksBritish(input));

    expect(claimed).toEqual([]);
  });

  it.each([
    ["12 Smith St, Parramatta NSW 2150", "AU"],
    ["3/12 Smith St, Parramatta NSW 2150", "AU"],
    ["1 Main St, Perth WA 6000", "AU"],
    ["10 Downing Street, London SW1A 2AA", "GB"],
    ["Flat 2, 14 Byres Road, Glasgow G11 5RD", "GB"],
    ["12 Bath Street, St Helier JE2 4ST", "JE"],
    ["12 rue de la Paix, 75002 Paris", "FR"],
    ["15 boulevard Haussmann, 75009 PARIS CEDEX 09", "FR"],
    ["12 rue de la Paix, 75099 Paris", "FR"],
    ["1 place du Casino, 98000 Monaco", "MC"],
    ["Hauptstraße 12, 10115 Berlin", "DE"],
    ["Am Markt 5, 01067 Dresden", "DE"],
    ["Kastanienallee 4, 12345 Musterstadt, Deutschland", "DE"],
    ["Postfach 12 34 56, 50667 Köln", "DE"],
    ["Avenue Pouvanaa a Oopa, 98714 Papeete, Polynésie française", "PF"],
    ["100 Queen St W, Toronto, ON M5H 2N2", "CA"],
    ["4-123 Main St, Vancouver BC V5Y 1V4", "CA"],
    ["123 Main St, Seattle, WA 98101", "US"],
    ["〒100-0005 東京都千代田区丸の内1-2-3", "JP"],
    ["100 Avenue of the Americas, New York, NY 10036", "US"],
    ["100 Avenue of the Americas, New York, NY 10036 USA", "US"],
    ["1 Place Ville Marie, Montréal, QC H3B 4S6", "CA"],
    ["2 Court Square, Long Island City, NY 11101", "US"],
  ])("reads %s as %s", (input, country) => {
    expect(parseLocation(input, { countries: COUNTRY_MODULES })?.country).toBe(country);
  });

  it("leaves a postcode that names no department to the core, with a French street beside it", () => {
    const input = "12 rue de la Paix, 96000 Paris";

    expect(parseLocation(input, { countries: COUNTRY_MODULES })).toEqual(parseLocation(input));
  });

  it("leaves a Washington ZIP code cut to four digits to the core, as without the modules", () => {
    const input = "123 Main St, Seattle, WA 9810";

    expect(parseLocation(input, { countries: [australia, unitedKingdom] })).toEqual(parseLocation(input));
  });

  it("reads a Sydney postcode under the wrong state as Australian, for the validator to catch", () => {
    expect(parseLocation("1 Main St, Sydney VIC 2000", { countries: [australia] })?.country).toBe("AU");
  });
});

describe("the country hint", () => {
  it("reads an address as Australian when told to, whatever it ends with", () => {
    expect(parseLocation("3/12 Smith St, Parramatta", { country: "AU", countries: [australia] })).toEqual({
      secUnitType: "Unit",
      secUnitNum: "3",
      number: "12",
      street: "Smith",
      type: "St",
      city: "Parramatta",
      country: "AU",
    });
  });

  it("reads an address as French when told to, with the country's code or an overseas department's", () => {
    expect(parseLocation("12 rue de la Paix, Paris", { country: "FR", countries: [france] })?.country).toBe("FR");
    expect(
      parseLocation("5 rue Victor Hugo, 97200 Fort-de-France", { country: "MQ", countries: [france] })?.state,
    ).toBe("972");
  });

  it("reads Jersey with the British module", () => {
    expect(
      parseLocation("12 Bath Street, St Helier JE2 4ST", { country: "JE", countries: [unitedKingdom] })?.country,
    ).toBe("JE");
  });

  it("refuses a country whose module was not handed in", () => {
    expect(() => parseLocation("12 Smith St, Parramatta NSW 2150", { country: "AU" })).toThrow(/countries/);
    expect(() =>
      parseLocation("10 Downing Street, London SW1A 2AA", { country: "GB", countries: [australia] }),
    ).toThrow(/country module/);
    expect(() => parseLocation("12 rue de la Paix, 75002 Paris", { country: "FR" })).toThrow(/countries/);
  });

  it("keeps US, Canada and Japan in the core", () => {
    expect(
      parseLocation("100 Queen St W, Toronto, ON M5H 2N2", { country: "CA", countries: [australia] })?.country,
    ).toBe("CA");
  });

  it("gives snake_case keys through a module", () => {
    expect(
      parseLocation("Level 6, 51 Jacobson St, Brisbane QLD 4000", { countries: [australia], useSnakeCase: true }),
    ).toMatchObject({ floor_type: "Level", floor: "6" });
  });
});

describe("validateAddress with the country modules", () => {
  it("hands an Australian address to the Australian validator", () => {
    const result = validateAddress("1 Main St, Sydney VIC 2000", { countries: [australia] });

    expect(result.parsedAddress?.country).toBe("AU");
    expect(result.warnings.map((one) => one.code)).toEqual(["POSTAL_REGION_MISMATCH"]);
    expect(result.isValid).toBe(true);
  });

  it("makes a postcode finding an error with strict postal validation", () => {
    const result = validateAddress("1 Main St, Sydney VIC 2000", {
      countries: [australia],
      strictPostalValidation: true,
    });

    expect(result.errors.map((one) => one.code)).toEqual(["POSTAL_REGION_MISMATCH"]);
    expect(result.isValid).toBe(false);
  });

  it("does not ask a British address for a state", () => {
    const result = validateAddress("10 Downing Street, London SW1A 2AA", { countries: [unitedKingdom] });

    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("leaves a US address to the core", () => {
    const withModules = validateAddress("123 Main St, Seattle, NY 98101", { countries: [australia, unitedKingdom] });

    expect(withModules).toEqual(validateAddress("123 Main St, Seattle, NY 98101"));
  });
});

describe("telling Dutch, Spanish, Italian and New Zealand addresses apart with no hint", () => {
  const detectors: Readonly<Record<string, (text: string) => boolean>> = {
    nl: looksDutch,
    es: looksSpanish,
    it: looksItalian,
    nz: looksNewZealand,
    in: looksIndian,
    kr: looksKorean,
    br: looksBrazilian,
    au: looksAustralian,
    gb: looksBritish,
    fr: looksFrench,
    de: looksGerman,
  };
  const inputsOf = (country: string): string[] =>
    allCases(country)
      .filter((testCase) => testCase.expected !== null)
      .map((testCase) => testCase.input);
  const nuts = { nl: "NL", es: "ES", it: "IT", nz: "NZ", in: "IN", kr: "KR", br: "BR" } as const;

  it.each(Object.entries(nuts))("reads every %s case that its module claims as %s", (folder, code) => {
    const misread = inputsOf(folder)
      .filter((input) => detectors[folder](input))
      .filter((input) => parseLocation(input, { countries: COUNTRY_MODULES })?.country !== code);

    expect(misread).toEqual([]);
  });

  it("detects most of the Dutch, Spanish and Italian corpora without a hint", () => {
    const share = (folder: string): number =>
      inputsOf(folder).filter(detectors[folder]).length / inputsOf(folder).length;

    expect(share("nl")).toBeGreaterThan(0.85);
    expect(share("es")).toBeGreaterThan(0.8);
    expect(share("it")).toBeGreaterThan(0.8);
  });

  it("claims no case of any other country's corpus", () => {
    const claimed: string[] = [];
    for (const [claimer, detect] of Object.entries(detectors)) {
      if (!(claimer in nuts)) continue;
      for (const folder of [
        "us",
        "canada",
        "japan",
        "au",
        "gb",
        "fr",
        "de",
        "nl",
        "es",
        "it",
        "nz",
        "in",
        "kr",
        "br",
      ]) {
        if (folder === claimer) continue;
        for (const input of inputsOf(folder)) if (detect(input)) claimed.push(`${claimer} claims ${folder}: ${input}`);
      }
    }

    expect(claimed).toEqual([]);
  });

  it("is not claimed by Australia or Britain for a case of the four", () => {
    const claimed = ["nl", "es", "it", "nz", "in", "kr", "br"]
      .flatMap(inputsOf)
      .filter((input) => looksAustralian(input) || looksBritish(input));

    expect(claimed).toEqual([]);
  });

  it.each([
    ["Keizersgracht 123, 1015 CJ Amsterdam", "NL"],
    ["1015 CJ Amsterdam", "NL"],
    ["Calle de Alcalá, 42, 28014 Madrid", "ES"],
    ["Paseo de la Castellana 100, 28046 Madrid, España", "ES"],
    ["Apartado de Correos 123, 41080 Sevilla", "ES"],
    ["Via del Corso, 12, 00186 Roma", "IT"],
    ["Piazza del Duomo 1, 20122 Milano MI", "IT"],
    ["1 Queen Street, Auckland 1010, New Zealand", "NZ"],
    ["Private Bag 92014, Auckland 1142", "NZ"],
    ["12 MG Road, Bengaluru, Karnataka 560038", "IN"],
    ["Tiananmen Square, Beijing 100006", "US"],
    ["123 Main St, Indianapolis, IN 46204", "US"],
    ["서울특별시 중구 세종대로 110", "KR"],
    ["Rua Augusta, 100, São Paulo - SP, 01305-000", "BR"],
    ["123 Main St, Seattle, WA 98101-1234", "US"],
    ["110 Sejong-daero, Jung-gu, Seoul 04524", "KR"],
    ["Calle Ocho, Miami, FL 33135", "US"],
    ["Via Appia Way, Brooklyn, NY 11201", "US"],
    ["4059 Mt Lee Dr Hollywood CA 90068", "US"],
    ["12 Smith St, Parramatta NSW 2150", "AU"],
    ["12 rue de la Paix, 75002 Paris", "FR"],
    ["Hauptstraße 12, 10115 Berlin", "DE"],
  ])("reads %s as %s", (input, country) => {
    expect(parseLocation(input, { countries: COUNTRY_MODULES })?.country).toBe(country);
  });

  it("never reads Indiana's code with no ZIP as India, nor a bare number as a CEP", () => {
    for (const input of [
      "123 Main St, Indianapolis, IN",
      "Springfield, IN",
      "PO Box 12, Gary, IN",
      "Hauptstrasse 5, Berlin 10115-123",
      "Rue de Rivoli 5, Paris 75001-123",
    ]) {
      expect(looksIndian(input), input).toBe(false);
      expect(looksBrazilian(input), input).toBe(false);
      expect(["IN", "BR"], input).not.toContain(parseLocation(input, { countries: COUNTRY_MODULES })?.country);
    }
  });

  it("reads a CEP with its hyphen as Brazilian after CEP or a state's code only", () => {
    expect(looksBrazilian("Rua Augusta, 100, CEP 01305-000")).toBe(true);
    expect(looksBrazilian("Rua Augusta, 100, São Paulo, SP 01305-000")).toBe(true);
    expect(looksBrazilian("Rua Augusta, 100, São Paulo 01305-000")).toBe(false);
  });

  it("leaves four digits after a place to the core, as Australia and others write them", () => {
    const input = "1 Queen Street, Auckland 1010";

    expect(parseLocation(input, { countries: COUNTRY_MODULES })).toEqual(parseLocation(input));
  });

  it("reads an address as Dutch, Spanish, Italian or from New Zealand when told to", () => {
    const countries = COUNTRY_MODULES;

    expect(parseLocation("Damstraat 1, Amsterdam", { country: "NL", countries })?.country).toBe("NL");
    expect(parseLocation("Calle Mayor 1, Madrid", { country: "ES", countries })?.country).toBe("ES");
    expect(parseLocation("Via Roma 1, Milano", { country: "IT", countries })?.country).toBe("IT");
    expect(parseLocation("1 Queen Street, Auckland", { country: "NZ", countries })?.country).toBe("NZ");
    expect(() => parseLocation("Damstraat 1, 1012 JL Amsterdam", { country: "NL" })).toThrow(/countries/);
  });
});
