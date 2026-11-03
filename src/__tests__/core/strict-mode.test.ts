// Tests for strict mode functionality
// Validates ZIP/postal code parsing behavior in strict vs permissive modes
// Covers US ZIP codes and Canadian postal codes with various validation scenarios

import { describe, expect, test } from "vitest";

import canadaStrictModeTestDataFile from "../../../test-data/canada/strict-mode.json";
import usStrictModeTestDataFile from "../../../test-data/us/strict-mode.json";
import { parseLocation } from "../../index";
import type { StrictModeTestCase, StrictModeTestData } from "../types/compatibility-cases";

// Helper function to extract test data from objects with $schema
function loadSchemaTestData<T>(testDataFile: T): T {
  // If the imported data has $schema property, extract everything except $schema
  if (testDataFile && typeof testDataFile === "object" && "$schema" in testDataFile) {
    const { $schema: _schema, ...data } = testDataFile as { $schema: string; [key: string]: unknown };

    return data as T;
  }

  return testDataFile;
}

// Helper function to extract test arrays from the new object-of-arrays structure
function extractTestsFromData(data: StrictModeTestData): StrictModeTestCase[] {
  if (!data.tests) {
    return [];
  }

  // If tests is already an array, return it
  if (Array.isArray(data.tests)) {
    return data.tests;
  }

  // If tests is an object, flatten all arrays within it
  const allTests: StrictModeTestCase[] = [];

  for (const value of Object.values(data.tests)) {
    if (Array.isArray(value)) {
      allTests.push(...value);
    } else if (typeof value === "object" && value !== null) {
      // Handle single test case objects
      allTests.push(value);
    }
  }

  return allTests;
}

// Extract test data
const usStrictModeData = loadSchemaTestData<StrictModeTestData>(usStrictModeTestDataFile);
const usStrictModeTestData = extractTestsFromData(usStrictModeData);
const canadaStrictModeData = loadSchemaTestData<StrictModeTestData>(canadaStrictModeTestDataFile);
const canadaStrictModeTestData = extractTestsFromData(canadaStrictModeData);

describe("Strict Mode - Core Working Functionality", () => {
  describe("US ZIP Code Validation", () => {
    usStrictModeTestData.forEach((testCase: StrictModeTestCase) => {
      test(`${testCase.description}`, () => {
        if (testCase.expected.strict) {
          const strictResult = parseLocation(testCase.input, { strict: true });

          if (testCase.expected.strict.zip === null) {
            expect(strictResult?.zip).toBeUndefined();
            expect(strictResult?.zipValid).toBe(false);
          } else {
            expect(strictResult?.zip).toBe(testCase.expected.strict.zip);
            expect(strictResult?.zipValid).toBe(testCase.expected.strict.zipValid);
          }
        }

        if (testCase.expected.permissive) {
          const permissiveResult = parseLocation(testCase.input, { strict: false });

          expect(permissiveResult?.zip).toBe(testCase.expected.permissive.zip);
          expect(permissiveResult?.zipValid).toBe(testCase.expected.permissive.zipValid);
        }

        if (!testCase.expected.strict && !testCase.expected.permissive) {
          const strictResult = parseLocation(testCase.input, { strict: true });
          const permissiveResult = parseLocation(testCase.input, { strict: false });

          expect(strictResult?.zip).toBe(testCase.expected.zip);
          expect(strictResult?.zipValid).toBe(testCase.expected.zipValid);
          expect(permissiveResult?.zip).toBe(testCase.expected.zip);
          expect(permissiveResult?.zipValid).toBe(testCase.expected.zipValid);

          if (testCase.expected.plus4) {
            expect(strictResult?.plus4).toBe(testCase.expected.plus4);
            expect(permissiveResult?.plus4).toBe(testCase.expected.plus4);
          }
        }
      });
    });
  });

  describe("Canadian Postal Code Validation", () => {
    canadaStrictModeTestData.forEach((testCase: StrictModeTestCase) => {
      test(`${testCase.description}`, () => {
        // Test strict mode if specified
        if (testCase.expected.strict) {
          const strictResult = parseLocation(testCase.input, { strict: true });

          if (testCase.expected.strict.zip === null) {
            expect(strictResult?.zip).toBeUndefined();
            expect(strictResult?.zipValid).toBe(false);
          } else {
            expect(strictResult?.zip).toBe(testCase.expected.strict.zip);
            expect(strictResult?.zipValid).toBe(testCase.expected.strict.zipValid);
          }
        }

        // Test permissive mode if specified
        if (testCase.expected.permissive) {
          const permissiveResult = parseLocation(testCase.input, { strict: false });

          expect(permissiveResult?.zip).toBe(testCase.expected.permissive.zip);
          expect(permissiveResult?.zipValid).toBe(testCase.expected.permissive.zipValid);
        }

        // Test both modes for basic cases
        if (!testCase.expected.strict && !testCase.expected.permissive) {
          const strictResult = parseLocation(testCase.input, { strict: true });
          const permissiveResult = parseLocation(testCase.input, { strict: false });

          expect(strictResult?.zip).toBe(testCase.expected.zip);
          expect(strictResult?.zipValid).toBe(testCase.expected.zipValid);
          expect(permissiveResult?.zip).toBe(testCase.expected.zip);
          expect(permissiveResult?.zipValid).toBe(testCase.expected.zipValid);
        }
      });
    });
  });
});
