// The packed municipality table: that the text in municipalities.data.ts is exactly what the generator's packing
// writes for the table it unpacks to, and that the packing refuses what the reader could not read back.

import { describe, expect, it } from "vitest";

import { packMunicipalities, packMunicipality } from "../../../scripts/jp/pack";
import { unpackMunicipalities } from "../../constants/jp/unpack-municipalities";
import { JP_MUNICIPALITIES } from "../../jp";

const SAPPORO_CHUO = {
  code: "01101",
  prefecture: "01",
  name: "札幌市中央区",
  kana: "サッポロシチュウオウク",
  romaji: "Sapporo-shi Chuo-ku",
};

describe("packed municipalities", () => {
  it("unpacks a row into the five fields, the prefecture from the code", () => {
    expect(unpackMunicipalities(packMunicipality(SAPPORO_CHUO))).toEqual([SAPPORO_CHUO]);
  });

  it("round-trips the whole table", () => {
    expect(unpackMunicipalities(packMunicipalities(JP_MUNICIPALITIES))).toEqual(JP_MUNICIPALITIES);
  });

  it("ignores blank lines", () => {
    expect(unpackMunicipalities(`\n${packMunicipality(SAPPORO_CHUO)}\n\n`)).toEqual([SAPPORO_CHUO]);
  });

  it("refuses a prefecture its code does not start with", () => {
    expect(() => packMunicipality({ ...SAPPORO_CHUO, prefecture: "13" })).toThrow(/prefecture/);
  });

  it("refuses a separator or a template-literal character in a field", () => {
    expect(() => packMunicipality({ ...SAPPORO_CHUO, name: "a|b" })).toThrow(/separator/);
    expect(() => packMunicipality({ ...SAPPORO_CHUO, romaji: "a`b" })).toThrow(/separator/);
  });
});
