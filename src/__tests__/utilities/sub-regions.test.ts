// The packed sub-region table: what unpacking gives back, and that the generator's packing is the reader's reverse.

import { describe, expect, it } from "vitest";

import { packSubRegion, packSubRegions, renderSubRegionsData } from "../../../scripts/sub-regions/pack";
import { allSubRegions, isSubRegionName, subRegionsOf } from "../../constants/sub-regions";
import { CA_SUB_REGIONS_PACKED, US_SUB_REGIONS_PACKED } from "../../constants/sub-regions.data";
import type { SubRegion } from "../../types";

describe("sub-regions", () => {
  it("unpacks every country's table, Canada first", () => {
    expect(subRegionsOf("CA")).toHaveLength(28);
    expect(subRegionsOf("US")).toHaveLength(1229);
    expect(allSubRegions().slice(0, 28)).toEqual(subRegionsOf("CA"));
    expect(subRegionsOf("CA").every((row) => row.country === "CA")).toBe(true);
    expect(subRegionsOf("US").every((row) => row.country === "US")).toBe(true);
  });

  it("unpacks the fields of a row and its aliases", () => {
    expect(subRegionsOf("CA").find((row) => row.name === "east york")).toEqual({
      name: "east york",
      parentCity: "toronto",
      state: "ON",
      country: "CA",
      type: "district",
      aliases: ["eastyork", "est york"],
    });
  });

  it("gives a row with no aliases no aliases field", () => {
    expect(subRegionsOf("CA").find((row) => row.name === "calgary")).toEqual({
      name: "calgary",
      parentCity: "",
      state: "AB",
      country: "CA",
      type: "district",
    });
  });

  it("looks up a name or an alias, and nothing else", () => {
    expect(isSubRegionName("calgary")).toBe(true);
    expect(isSubRegionName("eastyork")).toBe(true);
    expect(isSubRegionName("lawardcity,texas")).toBe(true);
    expect(isSubRegionName("atlantis")).toBe(false);
  });

  it("is the reverse of the generator's packing", () => {
    const rows = allSubRegions();
    expect(packSubRegions(rows.filter((row) => row.country === "CA"))).toBe(CA_SUB_REGIONS_PACKED.slice(1));
    expect(packSubRegions(rows.filter((row) => row.country === "US"))).toBe(US_SUB_REGIONS_PACKED.slice(1));
  });

  it("writes the whole data file from sorted rows", () => {
    const file = renderSubRegionsData(allSubRegions(), "2025-09-19");
    expect(file).toContain("- Total sub-regions: 1257");
    expect(file).toContain(`const CA_SUB_REGIONS_PACKED = \`\n${packSubRegions(subRegionsOf("CA"))}\`;`);
  });

  it("refuses a row holding a separator or a character that would end the template literal", () => {
    const row: SubRegion = { name: "a|b", parentCity: "", state: "ON", country: "CA", type: "district" };
    expect(() => packSubRegion(row)).toThrow(/separator/);
    expect(() => packSubRegion({ ...row, name: "ok", aliases: ["a~b"] })).toThrow(/separator/);
    expect(() => packSubRegion({ ...row, name: "`" })).toThrow(/separator/);
  });
});
