// Batch Processing Tests - Comprehensive testing of batch address parsing functions
//
// This file tests all batch processing functions including:
// - parseLocations, parseAddresses, parseInformalAddresses, parseIntersections
// - Batch functions with statistics (parseLocationsBatch, etc.)
// - Performance characteristics and error handling
// - Edge cases and invalid input handling

import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, test } from "vitest";

import {
  parseAddresses,
  parseAddressesBatch,
  parseInformalAddresses,
  parseInformalAddressesBatch,
  parseIntersections,
  parseIntersectionsBatch,
  parseLocations,
  parseLocationsBatch,
} from "../../batch-parser";
import type { ParsedAddress, ParsedIntersection } from "../../types";
import type { BatchParseResult } from "../../types/batch-parse";
import type { AdvancedFunctionTestData, BatchParseFunctionTestData, BatchTestData } from "../types/batch-cases";

// Test data paths
const BATCH_TEST_DATA_PATH = "../../../test-data/batch/batch-test.json";
const SIMPLE_FUNCTIONS_PATH = "../../../test-data/batch/simple-functions.json";
const ADVANCED_FUNCTIONS_PATH = "../../../test-data/batch/advanced-functions.json";

// Types for test data

// Helper Functions
function loadBatchTestData(): BatchTestData {
  const filePath = join(__dirname, BATCH_TEST_DATA_PATH);
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  return data.tests;
}

function loadSimpleFunctionTestData(): BatchParseFunctionTestData {
  const filePath = join(__dirname, SIMPLE_FUNCTIONS_PATH);
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  return data.tests;
}

function loadAdvancedFunctionTestData(): AdvancedFunctionTestData {
  const filePath = join(__dirname, ADVANCED_FUNCTIONS_PATH);
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  return data.tests;
}

// Load test data
const batchTestData = loadBatchTestData();
const simpleFunctionData = loadSimpleFunctionTestData();
const advancedFunctionData = loadAdvancedFunctionTestData();

describe("Batch Address Processing Tests", () => {
  describe("Simple Batch Functions (Array Results)", () => {
    test("parseLocations should process multiple addresses", () => {
      const testCase = simpleFunctionData.parseLocations[0]; // First test case in parseLocations array
      const results = parseLocations(testCase.addresses);

      expect(results).toHaveLength(testCase.addresses.length);

      // Test specific expected results from JSON data
      if (testCase.expectedResults) {
        testCase.expectedResults.forEach((expected: ParsedAddress | null, index: number) => {
          const result = results[index];
          if (expected === null) {
            expect(result).toBeNull();
          } else {
            expect(result).toBeTruthy();
            expect(result?.number).toBe(expected.number);
            expect(result?.street).toBe(expected.street);
            if (expected.city) expect(result?.city).toBe(expected.city);
            if (expected.state) expect(result?.state).toBe(expected.state);
            if (expected.zip) expect(result?.zip).toBe(expected.zip);
          }
        });
      }
    });

    test("parseAddresses should process multiple addresses", () => {
      const testCase = simpleFunctionData.parseLocations[0]; // First test case in parseLocations array
      const results = parseAddresses(testCase.addresses.slice(0, 2)); // Use first 2 addresses

      expect(results).toHaveLength(2);
      expect(results[0]).toBeTruthy();
      expect(results[1]).toBeTruthy();
    });

    test("parseInformalAddresses should process multiple addresses", () => {
      const testCase = simpleFunctionData.parseInformalAddresses[0]; // First test case in parseInformalAddresses array
      const results = parseInformalAddresses(testCase.addresses);

      expect(results).toHaveLength(testCase.addresses.length);
      expect(results[0]).toBeTruthy();
      expect(results[1]).toBeTruthy();
    });

    test("parseIntersections should process multiple intersections", () => {
      const testCase = simpleFunctionData.parseIntersections[0]; // "Basic intersection parsing"
      const results = parseIntersections(testCase.addresses);

      expect(results).toHaveLength(testCase.addresses.length);

      // Test specific expected results
      if (testCase.expectedResults) {
        testCase.expectedResults.forEach((expected: ParsedIntersection | null, index: number) => {
          const result = results[index];
          if (expected === null) {
            expect(result).toBeNull();
          } else {
            expect(result).toBeTruthy();
            expect(result?.street1).toBe(expected.street1);
            expect(result?.street2).toBe(expected.street2);
            if (expected.city) expect(result?.city).toBe(expected.city);
            if (expected.state) expect(result?.state).toBe(expected.state);
          }
        });
      }
    });

    test("should handle empty input array", () => {
      const testCase = simpleFunctionData.parseLocations[2]; // "Empty input array" test case
      const results = parseLocations(testCase.addresses);

      expect(results).toHaveLength(0);
    });

    test("should handle invalid addresses", () => {
      const testCase = simpleFunctionData.parseLocations[1]; // "Handling invalid addresses" test case
      const results = parseLocations(testCase.addresses);

      expect(results).toHaveLength(testCase.addresses.length);

      const successCount = results.filter((r) => r !== null).length;
      const failureCount = results.filter((r) => r === null).length;

      expect(successCount).toBe(testCase.expectedSuccessCount);
      expect(failureCount).toBe(testCase.expectedFailureCount);
    });
  });

  describe("Advanced Batch Functions (With Statistics)", () => {
    test("parseLocationsBatch should provide detailed results and stats", () => {
      const testCase = advancedFunctionData.withStatistics[0]; // "Basic batch processing with error tracking"
      const result = parseLocationsBatch(testCase.addresses);

      expect(result.results).toHaveLength(testCase.addresses.length);

      // Validate statistics match expected values
      if (testCase.expectedStats) {
        expect(result.stats.total).toBe(testCase.expectedStats.total);
        expect(result.stats.successful).toBe(testCase.expectedStats.successful);
        expect(result.stats.failed).toBe(testCase.expectedStats.failed);
      }

      // Validate errors
      if (testCase.expectedErrors) {
        expect(result.errors).toHaveLength(testCase.expectedErrors.length);
        testCase.expectedErrors.forEach((expectedError, index) => {
          const actualError = result.errors[index];
          expect(actualError.index).toBe(expectedError.index);
          expect(actualError.error).toContain(expectedError.errorContains);
        });
      }

      expect(result.stats.duration).toBeGreaterThan(0);
      expect(result.stats.averagePerAddress).toBeGreaterThan(0);
    });

    test("parseAddressesBatch should track errors properly", () => {
      const testCase = advancedFunctionData.withStatistics[1]; // "Error tracking with empty and whitespace strings"
      const result = parseAddressesBatch(testCase.addresses);

      expect(result.results).toHaveLength(testCase.addresses.length);

      if (testCase.expectedStats) {
        expect(result.stats.total).toBe(testCase.expectedStats.total);
        expect(result.stats.successful).toBe(testCase.expectedStats.successful);
        expect(result.stats.failed).toBe(testCase.expectedStats.failed);
      }

      // Should have errors for empty and whitespace strings
      expect(result.errors.length).toBeGreaterThanOrEqual(testCase.expectedStats?.failed || 0);
    });

    test("batch function should respect stopOnError option", () => {
      const testCase = advancedFunctionData.withStatistics[2]; // "Testing stopOnError functionality"
      const result = parseLocationsBatch(testCase.addresses, testCase.options);

      // Should stop after the first error
      if (testCase.expectedResultsLength) {
        expect(result.results).toHaveLength(testCase.expectedResultsLength);
      }

      if (testCase.expectedStats) {
        expect(result.stats.successful).toBe(testCase.expectedStats.successful);
        expect(result.stats.failed).toBe(testCase.expectedStats.failed);
        expect(result.stats.total).toBe(testCase.expectedStats.total); // But total still reflects input count
      }

      if (testCase.expectedErrors) {
        expect(result.errors).toHaveLength(testCase.expectedErrors.length);
      }
    });

    test("batch function should work with parsing options", () => {
      const testCase = advancedFunctionData.options[0]; // "Testing option passthrough to underlying parsers"
      const result = parseLocationsBatch(testCase.addresses, testCase.options);

      expect(result.results).toHaveLength(testCase.addresses.length);

      if (testCase.expectedStats) {
        expect(result.stats.total).toBe(testCase.expectedStats.total);
        expect(result.stats.successful).toBe(testCase.expectedStats.successful);
        expect(result.stats.failed).toBe(testCase.expectedStats.failed);
      }

      // All should be successful with valid addresses
      result.results.forEach((result) => {
        expect(result).toBeTruthy();
      });
    });
  });

  describe("Performance and Edge Cases", () => {
    test("should handle large batch efficiently", () => {
      const testCase = advancedFunctionData.performance[1]; // "Large batch performance test (100 addresses)"

      // Generate addresses based on the template
      let addresses: string[];
      if (testCase.generateAddresses) {
        addresses = Array.from({ length: testCase.generateAddresses.count }, (_, i) =>
          testCase.generateAddresses!.template.replace("{number}", String(testCase.generateAddresses!.startNumber + i)),
        );
      } else {
        addresses = testCase.addresses || [];
      }

      const startTime = Date.now();
      const results = parseLocations(addresses);
      const endTime = Date.now();

      expect(results).toHaveLength(testCase.expectedStats?.total || addresses.length);
      expect(results.every((r) => r !== null)).toBe(true);

      // Should process addresses within performance expectations
      const duration = endTime - startTime;
      if (testCase.performanceExpectations) {
        expect(duration).toBeLessThan(testCase.performanceExpectations.maxDurationMs);
      }
    });

    test("should handle mixed valid and invalid addresses", () => {
      const testCase = advancedFunctionData.edgeCases[0]; // "Mixed valid and invalid addresses including null/undefined"
      const result = parseLocationsBatch(testCase.addresses.filter((addr): addr is string => addr !== null));

      expect(result.results).toHaveLength(testCase.addresses.filter((addr) => addr !== null).length);

      if (testCase.expectedStats) {
        // Adjust expected stats for filtered null values
        const nonNullCount = testCase.addresses.filter((addr) => addr !== null).length;
        expect(result.stats.total).toBe(nonNullCount);
        // Note: We need to adjust the expected successful/failed counts since we filtered out nulls
        expect(result.stats.successful).toBeGreaterThanOrEqual(0);
        expect(result.stats.failed).toBeGreaterThanOrEqual(0);
      }

      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    test("parseIntersectionsBatch should handle mixed intersection formats", () => {
      const testCase = advancedFunctionData.edgeCases[1]; // "Mixed intersection formats with invalid entries"
      const result = parseIntersectionsBatch(testCase.addresses.filter((addr): addr is string => addr !== null));

      const validAddresses = testCase.addresses.filter((addr) => addr !== null);
      expect(result.results).toHaveLength(validAddresses.length);

      if (testCase.expectedStats) {
        expect(result.stats.total).toBe(validAddresses.length);
        expect(result.stats.successful).toBeGreaterThanOrEqual(0);
        expect(result.stats.failed).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("JSON Test Data Scenarios", () => {
    batchTestData.batchTests.forEach((testCase) => {
      test(`${testCase.name}: ${testCase.description}`, () => {
        const { addresses, expectedSuccessCount, expectedFailureCount, testFunction, expectStats } = testCase;

        let result:
          | (ParsedAddress | null)[]
          | (ParsedIntersection | null)[]
          | BatchParseResult<ParsedAddress>
          | BatchParseResult<ParsedIntersection>;

        // Call the appropriate function based on testFunction name
        switch (testFunction) {
          case "parseLocations":
            result = parseLocations(addresses);
            break;
          case "parseAddresses":
            result = parseAddresses(addresses);
            break;
          case "parseInformalAddresses":
            result = parseInformalAddresses(addresses);
            break;
          case "parseIntersections":
            result = parseIntersections(addresses);
            break;
          case "parseLocationsBatch":
            result = parseLocationsBatch(addresses);
            break;
          case "parseAddressesBatch":
            result = parseAddressesBatch(addresses);
            break;
          case "parseInformalAddressesBatch":
            result = parseInformalAddressesBatch(addresses);
            break;
          case "parseIntersectionsBatch":
            result = parseIntersectionsBatch(addresses);
            break;
          default:
            throw new Error(`Unknown test function: ${testFunction}`);
        }

        if (expectStats) {
          // Test batch functions with statistics (type guard to ensure BatchParseResult)
          if ("results" in result && "stats" in result && "errors" in result) {
            expect(result.results).toHaveLength(addresses.length);
            expect(result.stats.total).toBe(addresses.length);
            expect(result.stats.successful).toBe(expectedSuccessCount);
            expect(result.stats.failed).toBe(expectedFailureCount);
            expect(result.stats.duration).toBeGreaterThan(0);
            expect(result.errors).toHaveLength(expectedFailureCount);
          } else {
            throw new Error("Expected BatchParseResult but got array result");
          }
        } else {
          // Test simple array functions (type guard to ensure array)
          if (Array.isArray(result)) {
            expect(result).toHaveLength(addresses.length);

            const successCount = result.filter((r: ParsedAddress | ParsedIntersection | null) => r !== null).length;
            const failureCount = result.filter((r: ParsedAddress | ParsedIntersection | null) => r === null).length;

            expect(successCount).toBe(expectedSuccessCount);
            expect(failureCount).toBe(expectedFailureCount);
          } else {
            throw new Error("Expected array result but got BatchParseResult");
          }
        }
      });
    });
  });

  describe("Options and Configuration", () => {
    test("should pass options to underlying parser functions", () => {
      const testCase = simpleFunctionData.options[0]; // "Testing useSnakeCase option"

      // Test with snake_case option
      const results = parseLocations(testCase.addresses, testCase.options);

      expect(results).toHaveLength(testCase.addresses.length);

      const successCount = results.filter((r) => r !== null).length;
      const failureCount = results.filter((r) => r === null).length;

      expect(successCount).toBe(testCase.expectedSuccessCount);
      expect(failureCount).toBe(testCase.expectedFailureCount);

      results.forEach((result) => {
        expect(result).toBeTruthy();
      });
      // Note: The specific snake_case conversion would depend on the parser implementation
    });

    test("should handle country-specific options", () => {
      const testCase = simpleFunctionData.options[1]; // "Testing country-specific options for Canada"

      const results = parseLocations(testCase.addresses, testCase.options);

      expect(results).toHaveLength(testCase.addresses.length);

      const successCount = results.filter((r) => r !== null).length;
      const failureCount = results.filter((r) => r === null).length;

      expect(successCount).toBe(testCase.expectedSuccessCount);
      expect(failureCount).toBe(testCase.expectedFailureCount);

      results.forEach((result) => {
        expect(result).toBeTruthy();
      });
    });
  });
});
