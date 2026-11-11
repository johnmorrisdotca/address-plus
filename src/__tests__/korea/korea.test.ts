// The Korean module beyond parsing: the postcode lookups (GeoNames' list, the provinces from kuni and the names addresses write),
// the validator, the Korea Post formatter, the comparer and the module. Parsing has its corpus under test-data/corpus/kr.

import { describe, expect, it } from "vitest";

import { parseLocation, validateAddress } from "../..";
import {
  compareKoreanAddresses,
  findKoreanProvince,
  formatKoreaPost,
  getProvinceFromKoreanPostcode,
  isKnownKoreanPostcode,
  isValidKoreanPostcode,
  KR_PROVINCES,
  looksKorean,
  parseKoreanAddress,
  parseKoreanPostcode,
  southKorea,
  validateKoreanAddress,
} from "../../kr";
import type { ParsedAddress } from "../../types";

const parsed = (text: string): ParsedAddress => {
  const address = parseKoreanAddress(text);
  if (!address) throw new Error(`no parse: ${text}`);
  return address;
};
const codes = (text: string, options = {}): string[] => {
  const { errors, warnings } = validateKoreanAddress(parsed(text), options);
  return [...errors, ...warnings].map((one) => one.code);
};

describe("the postcode", () => {
  it.each(["04524", "63000", " 48058 "])("has the shape: %s", (postcode) => {
    expect(isValidKoreanPostcode(postcode)).toBe(true);
  });

  it.each(["0452", "045244", "0452a", ""])("has not the shape: %s", (postcode) => {
    expect(isValidKoreanPostcode(postcode)).toBe(false);
  });

  it("is known when GeoNames' list has it", () => {
    expect(["04524", "06236", "48058", "63000", "16490"].map(isKnownKoreanPostcode)).toEqual(new Array(5).fill(true));
    expect(["00000", "99999", "0452x"].map(isKnownKoreanPostcode)).toEqual(new Array(3).fill(false));
  });

  it("is in the province of the list", () => {
    expect(["04524", "48058", "63000", "16490", "41940", "34126", "61945"].map(getProvinceFromKoreanPostcode)).toEqual([
      "11",
      "26",
      "49",
      "41",
      "27",
      "30",
      "29",
    ]);
    expect(getProvinceFromKoreanPostcode("00000")).toBeUndefined();
  });

  it("is taken apart", () => {
    expect(parseKoreanPostcode("04524")).toEqual({ postcode: "04524", region: "11", known: true });
    expect(parseKoreanPostcode("00000")).toEqual({ postcode: "00000", known: false });
  });
});

describe("the provinces", () => {
  it("are kuni's seventeen, with their names in English and Japanese", () => {
    expect(KR_PROVINCES).toHaveLength(17);
    expect(KR_PROVINCES.find((province) => province.code === "11")).toMatchObject({ iso: "KR-11", name: "Seoul" });
    expect(KR_PROVINCES.every((province) => province.nameJa !== "")).toBe(true);
  });

  it("are found by code, by English name and by Korean name", () => {
    expect(findKoreanProvince("KR-26")?.name).toBe("Busan");
    expect(findKoreanProvince("서울")?.code).toBe("11");
    expect(findKoreanProvince("경기도")?.code).toBe("41");
    expect(findKoreanProvince("gyeonggi-do")?.code).toBe("41");
    expect(findKoreanProvince("North Jeolla")?.code).toBe("45");
    expect(findKoreanProvince("xx")).toBeUndefined();
  });
});

describe("the validator", () => {
  it("has nothing to say about an address that is complete and whose postcode is listed", () => {
    expect(codes("서울특별시 중구 세종대로 110 04524")).toEqual([]);
    expect(codes("110 Sejong-daero, Jung-gu, Seoul 04524")).toEqual([]);
  });

  it("warns of a postcode that is not listed, and makes it an error when asked", () => {
    expect(codes("서울특별시 중구 세종대로 110 00000")).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
    expect(
      validateKoreanAddress(parsed("서울특별시 중구 세종대로 110 00000"), { strictPostalValidation: true }).errors.map(
        (one) => one.code,
      ),
    ).toEqual(["UNRECOGNIZED_POSTAL_CODE"]);
  });

  it("warns of a province that is not the postcode's", () => {
    expect(codes("부산광역시 중구 중앙대로 100 04524")).toEqual(["POSTAL_REGION_MISMATCH"]);
  });

  it("warns of what is missing", () => {
    expect(codes("서울특별시 중구 세종대로 110 대한민국")).toEqual(["MISSING_POSTAL_CODE"]);
    expect(codes("서울특별시 중구 세종대로 04524")).toEqual(["MISSING_STREET_NUMBER"]);
  });

  it("is the validator validateAddress uses when the module is handed in", () => {
    const result = validateAddress("부산광역시 중구 중앙대로 100 04524", { countries: [southKorea] });

    expect(result.parsedAddress?.country).toBe("KR");
    expect(result.warnings.map((one) => one.code)).toEqual(["POSTAL_REGION_MISMATCH"]);
  });
});

describe("the Korea Post format", () => {
  it("writes a Hangul address from the province down, with the floor and the dong, and the postcode on its own line", () => {
    expect(formatKoreaPost(parsed("서울 중구 세종대로 110 3층 (태평로1가) 04524"))).toEqual({
      lines: ["서울특별시 중구 세종대로 110, 3층 (태평로1가)", "04524"],
      singleLine: "서울특별시 중구 세종대로 110, 3층 (태평로1가), 04524",
      deliveryLine: "서울특별시 중구 세종대로 110, 3층 (태평로1가)",
      lastLine: "04524",
      country: "KR",
      format: "korea-post",
    });
  });

  it("writes a Latin address from the unit up, each district on its own line", () => {
    expect(
      formatKoreaPost(parsed("3F, 152 Teheran-ro, Gangnam-gu, Seoul 06236"), { includeCountry: true }).lines,
    ).toEqual(["3F", "152 Teheran-ro", "Gangnam-gu", "Seoul 06236", "SOUTH KOREA"]);
    expect(formatKoreaPost(parsed("206 Worldcup-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do 16490")).lines).toEqual([
      "206 Worldcup-ro",
      "Yeongtong-gu",
      "Suwon-si",
      "Gyeonggi 16490",
    ]);
  });
});

describe("the comparer", () => {
  it("takes letter case and hyphens in a Latin road for no difference", () => {
    expect(
      compareKoreanAddresses(
        parsed("110 Sejong-daero, Jung-gu, Seoul 04524"),
        parsed("110 SEJONGDAERO, JUNG-GU, SEOUL 04524"),
      ).isSame,
    ).toBe(true);
  });

  it("names what differs", () => {
    const result = compareKoreanAddresses(
      parsed("서울특별시 중구 세종대로 110"),
      parsed("서울특별시 중구 세종대로 112"),
    );

    expect(result.differences).toEqual([{ field: "number", first: "110", second: "112" }]);
  });
});

describe("the module", () => {
  it("claims Hangul addresses with a province or a road, and Latin ones with a road, a province and a listed postcode", () => {
    expect(looksKorean("서울특별시 중구 세종대로 110")).toBe(true);
    expect(looksKorean("서울 강남구 테헤란로 152")).toBe(true);
    expect(looksKorean("110 Sejong-daero, Jung-gu, Seoul 04524")).toBe(true);
    expect(looksKorean("110 Sejong-daero, Jung-gu, Seoul, South Korea")).toBe(true);
    expect(looksKorean("123 Main St, Seattle, WA 98101")).toBe(false);
    expect(looksKorean("東京都千代田区丸の内1-2-3")).toBe(false);
    expect(parseLocation("서울특별시 중구 세종대로 110", { countries: [southKorea] })?.number).toBe("110");
  });

  it("gives snake_case keys when asked", () => {
    expect(parseKoreanAddress("서울특별시 중구 세종대로 110 3층", { useSnakeCase: true })).toMatchObject({
      floor_type: "층",
    });
  });

  it("is a module of South Korea only", () => {
    expect(southKorea.codes).toEqual(["KR"]);
  });
});
