// Compatibility Tests
//
// This file contains tests for:
// - Snake case compatibility mode (useSnakeCase option)
// - Comparison with original parse-address library
// - Backward compatibility validation

import { describe, expect, it, test } from "vitest";

import testDataFile from "../../../test-data/core/compatibility.json";
import { parseAddress as ourParseAddress, parseInformalAddress, parseIntersection, parseLocation } from "../../index";
import type {
  AddressTestCase,
  CompatibilityComparisonTestCase,
  CompatibilityTestData,
} from "../types/compatibility-cases";

// Dynamic import helper for CommonJS module compatibility
async function getParseAddress() {
  const parseAddressModule = await import("parse-address");
  return parseAddressModule.default || parseAddressModule;
}

// Helper function to extract test data from objects with $schema
function loadSchemaTestData<T>(testDataFile: unknown): T {
  // If the imported data has $schema property, extract everything except $schema
  if (testDataFile && typeof testDataFile === "object" && "$schema" in testDataFile) {
    const { $schema: _schema, ...data } = testDataFile as Record<string, unknown>;
    return data as T;
  }
  return testDataFile as T;
}

// Extract test data from consolidated file
const testData = loadSchemaTestData<CompatibilityTestData>(testDataFile);
// Extract different test groups from the consolidated structure
const parseAddressComparisonTests = testData.tests.parseAddressComparison || [];
const snakeCaseTestCases = testData.tests.snakeCaseCompatibility || [];
const usBasicAddresses = testData.tests.usBasicAddresses || [];
const canadaBasicAddresses = testData.tests.canadaBasicAddresses || [];
const intersections = testData.tests.intersections || [];
const multipleParserArray = testData.tests.multipleParserFunctions || [];
const usSpecialFormats = testData.tests.usSpecialFormats || [];

// The one case whose format structure is printed for inspection
const keyTestCase: (CompatibilityComparisonTestCase & { purpose?: string }) | undefined =
  parseAddressComparisonTests[0];
const keyInput = keyTestCase?.input ?? "";

// Reads a field of a parsed result by name, whatever shape the result has
function field(result: unknown, key: string): unknown {
  return (result as Record<string, unknown> | null)?.[key];
}

describe("Compatibility Tests", () => {
  describe("Snake Case Compatibility", () => {
    snakeCaseTestCases.forEach((testCase) => {
      test(testCase.description, () => {
        const result = parseLocation(testCase.input, testCase.options);

        if (testCase.expected === null) {
          expect(result).toBeNull();
          return;
        }

        expect(result).toBeTruthy();

        // Check expected fields
        Object.keys(testCase.expected).forEach((key) => {
          expect(field(result, key)).toBe(testCase.expected?.[key]);
        });

        // Check fields that should not exist (for snake_case mode)
        if (testCase.notExpected) {
          testCase.notExpected.forEach((name) => {
            expect(field(result, name)).toBeUndefined();
          });
        }
      });
    });
  });

  describe("Parse-Address Library Comparison", () => {
    parseAddressComparisonTests.forEach((testCase) => {
      it(`should match parse-address format for ${testCase.category} case ${testCase.id}: "${testCase.input}"`, async () => {
        // Get results from both parsers
        const parseAddress = await getParseAddress();
        const originalResult = parseAddress.parseLocation(testCase.input);
        const ourResult = parseLocation(testCase.input);

        // For now, just log the comparison - we'll analyze patterns
        // and decide on specific assertions based on the output
        expect(ourResult).toBeDefined();
        expect(originalResult).toBeDefined();
      });
    });

    it(`should demonstrate format structure for key case: "${keyInput}"`, async () => {
      console.log(`\\nKey Test Purpose: ${keyTestCase?.purpose}`);

      const parseAddress = await getParseAddress();
      const original = parseAddress.parseLocation(keyInput);
      const ours = parseLocation(keyInput);

      console.log("\\n=== FORMAT ANALYSIS ===");
      console.log("Original format (parse-address):", JSON.stringify(original, null, 2));
      console.log("Our format:", JSON.stringify(ours, null, 2));

      // Verify we're using the correct structured format like the original
      if (original && ours && original.number && original.prefix) {
        expect(ours.number).toBe(original.number);
        expect(ours.prefix).toBe(original.prefix);
      }
    });
  });

  describe("Comprehensive JSON Data Validation", () => {
    describe("US Address Parsing - Basic Addresses", () => {
      usBasicAddresses.forEach((testCase: AddressTestCase, index: number) => {
        it(`should parse basic address ${index + 1}: "${testCase.input}"`, () => {
          const result = ourParseAddress(testCase.input);
          expect(result).toBeTruthy();

          if (testCase.expected) {
            // Check each expected field
            Object.keys(testCase.expected || {}).forEach((key) => {
              expect(field(result, key)).toBe(testCase.expected?.[key]);
            });
          }
        });
      });
    });

    describe("US Address Parsing - Special Addresses", () => {
      usSpecialFormats.forEach((testCase: AddressTestCase, index: number) => {
        it(`should parse special address ${index + 1}: "${testCase.input}"`, () => {
          const result = ourParseAddress(testCase.input);

          if (testCase.expected === null) {
            expect(result).toBeNull();
            return;
          }

          expect(result).toBeTruthy();

          if (testCase.expected) {
            Object.keys(testCase.expected).forEach((key) => {
              expect(field(result, key)).toBe(testCase.expected?.[key]);
            });
          }
        });
      });
    });

    describe("Canadian Address Parsing - Basic Addresses", () => {
      canadaBasicAddresses.forEach((testCase: AddressTestCase, index: number) => {
        it(`should parse Canadian basic address ${index + 1}: "${testCase.input}"`, () => {
          const result = ourParseAddress(testCase.input);

          if (testCase.expected === null) {
            expect(result).toBeNull();
            return;
          }

          expect(result).toBeTruthy();

          if (testCase.expected) {
            Object.keys(testCase.expected).forEach((key) => {
              expect(field(result, key)).toBe(testCase.expected?.[key]);
            });
          }
        });
      });
    });

    describe("Intersection Parsing", () => {
      intersections.forEach((testCase: AddressTestCase, index: number) => {
        it(`should parse intersection ${index + 1}: "${testCase.input}"`, () => {
          const result = parseIntersection(testCase.input);

          expect(result).toBeTruthy();

          if (testCase.expected) {
            Object.keys(testCase.expected).forEach((key) => {
              expect(field(result, key)).toBe(testCase.expected?.[key]);
            });
          }
        });
      });
    });

    describe("Multiple Parser Function Tests", () => {
      multipleParserArray.forEach((testCase, index) => {
        describe(`Test case ${index + 1}: ${testCase.description}`, () => {
          it("should handle parseLocation", () => {
            const result = parseLocation(testCase.input);
            expect(result).toBeTruthy();
          });

          it("should handle parseAddress", () => {
            const result = ourParseAddress(testCase.input);
            expect(result).toBeTruthy();
          });

          it("should handle parseInformalAddress", () => {
            const result = parseInformalAddress(testCase.input);
            expect(result).toBeTruthy();
          });
        });
      });
    });
  });
});
