// scripts/sub-regions/update-sub-regions.ts
import fs from "node:fs";
import path from "node:path";
import type { SubRegion } from "../../src/types";
import { fetchCASubRegions } from "./fetch-ca-sub-regions.ts";
import { fetchUSSubRegions } from "./fetch-us-sub-regions.ts";
import { renderSubRegionsData } from "./pack.ts";

// Deduplication key generator
const createDeduplicationKey = (subRegion: SubRegion): string => {
  return `${subRegion.name}|${subRegion.state}|${subRegion.country}|${subRegion.type}`;
};

// Validation function for sub-region data
const validateSubRegion = (subRegion: SubRegion): boolean => {
  // Required fields validation
  if (!subRegion.name || typeof subRegion.name !== "string") return false;
  if (!subRegion.state || typeof subRegion.state !== "string") return false;
  if (!subRegion.country || !["US", "CA"].includes(subRegion.country)) return false;
  if (
    !subRegion.type ||
    !["borough", "parish", "district", "ward", "arrondissement", "quadrant"].includes(subRegion.type)
  )
    return false;

  // Optional fields validation
  if (subRegion.parentCity !== undefined && typeof subRegion.parentCity !== "string") return false;

  // Name format validation (should be lowercase and trimmed)
  if (subRegion.name !== subRegion.name.toLowerCase().trim()) return false;

  return true;
};

// Merge and deduplicate sub-regions with priority rules
const mergeAndDeduplicateSubRegions = (subRegions: SubRegion[]): SubRegion[] => {
  const deduplicationMap = new Map<string, SubRegion>();
  const validSubRegions: SubRegion[] = [];
  const invalidSubRegions: SubRegion[] = [];

  console.log("Validating and deduplicating sub-regions...");

  // First pass: validate all sub-regions
  for (const subRegion of subRegions) {
    if (validateSubRegion(subRegion)) {
      validSubRegions.push(subRegion);
    } else {
      invalidSubRegions.push(subRegion);
    }
  }

  console.log(`  Valid: ${validSubRegions.length}, Invalid: ${invalidSubRegions.length}`);

  if (invalidSubRegions.length > 0) {
    console.log("  Invalid sub-regions (first 5):");
    invalidSubRegions.slice(0, 5).forEach((sr) => {
      console.log(`    - ${JSON.stringify(sr)}`);
    });
  }

  // Second pass: deduplicate with priority rules
  for (const subRegion of validSubRegions) {
    const key = createDeduplicationKey(subRegion);
    const existing = deduplicationMap.get(key);

    if (!existing) {
      // First occurrence - add it
      deduplicationMap.set(key, subRegion);
    } else {
      // Duplicate found - apply priority rules
      let keepExisting = true;

      // Priority 1: Prefer entries with parent cities
      if (!existing.parentCity && subRegion.parentCity) {
        keepExisting = false;
      } else if (existing.parentCity && !subRegion.parentCity) {
        keepExisting = true;
      }
      // Priority 2: Prefer more specific types over generic "district"
      else if (existing.type === "district" && subRegion.type !== "district") {
        keepExisting = false;
      } else if (existing.type !== "district" && subRegion.type === "district") {
        keepExisting = true;
      }
      // Priority 3: For same priority, keep the first one (existing)

      if (!keepExisting) {
        deduplicationMap.set(key, subRegion);
      }
    }
  }

  const deduplicatedSubRegions = Array.from(deduplicationMap.values());
  console.log(
    `  Deduplicated: ${validSubRegions.length} → ${deduplicatedSubRegions.length} (removed ${validSubRegions.length - deduplicatedSubRegions.length} duplicates)`,
  );

  return deduplicatedSubRegions;
};

// Sort sub-regions for consistent output
const sortSubRegions = (subRegions: SubRegion[]): SubRegion[] => {
  return subRegions.sort((a, b) => {
    // Primary sort: country (CA first, then US)
    if (a.country !== b.country) {
      return a.country === "CA" ? -1 : 1;
    }

    // Secondary sort: state/province
    if (a.state !== b.state) {
      return a.state.localeCompare(b.state);
    }

    // Tertiary sort: type
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }

    // Final sort: name
    return a.name.localeCompare(b.name);
  });
};

// Main execution function
async function main(): Promise<void> {
  console.log("Starting sub-regions update pipeline...");
  console.log("==================================================");

  const startTime = Date.now();

  try {
    // Step 1: Fetch US sub-regions
    console.log("\nStep 1: Fetching US sub-regions...");
    const usSubRegions = await fetchUSSubRegions();

    // Step 2: Fetch US county subdivisions (optional - can be intensive)
    console.log("\nStep 2: Fetching US county subdivisions...");
    // Uncomment the next line if you want comprehensive county subdivision data
    // const usCountySubdivisions = await fetchUSCountySubdivisions();
    const usCountySubdivisions: SubRegion[] = []; // Skip for now to avoid API limits

    // Step 3: Fetch Canadian sub-regions
    console.log("\nStep 3: Fetching Canadian sub-regions...");
    const caSubRegions = await fetchCASubRegions();

    // Step 4: Merge and process all data
    console.log("\nStep 4: Processing and merging data...");
    const allSubRegions = [...usSubRegions, ...usCountySubdivisions, ...caSubRegions];
    console.log(`  Raw total: ${allSubRegions.length} sub-regions`);

    const deduplicatedSubRegions = mergeAndDeduplicateSubRegions(allSubRegions);
    const sortedSubRegions = sortSubRegions(deduplicatedSubRegions);

    // Step 5: Generate and write output file
    console.log("\nStep 5: Generating output file...");
    const outputPath = path.resolve(process.cwd(), "src/constants/sub-regions.data.ts");
    const fileContent = renderSubRegionsData(sortedSubRegions, new Date().toISOString().slice(0, 10));

    fs.writeFileSync(outputPath, fileContent, "utf8");

    // Step 6: Generate summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\nSub-regions update completed successfully!");
    console.log("==================================================");
    console.log(`Output file: ${outputPath}`);
    console.log(`Total sub-regions: ${sortedSubRegions.length}`);
    console.log(`Total time: ${duration} seconds`);
    console.log(`US sub-regions: ${sortedSubRegions.filter((sr) => sr.country === "US").length}`);
    console.log(`Canadian sub-regions: ${sortedSubRegions.filter((sr) => sr.country === "CA").length}`);

    // Show breakdown by type
    const typeBreakdown = sortedSubRegions.reduce(
      (acc, sr) => {
        acc[sr.type] = (acc[sr.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("\nBreakdown by type:");
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count}`);
    });
  } catch (error) {
    console.error("\nError during sub-regions update:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Execute if run directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
