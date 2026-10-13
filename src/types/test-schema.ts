// Schema definitions for JSON test case files
// Provides type safety and consistency for all test data structures

/**
 * The fields every case in the package's JSON test files has: a name or description, the input, what is expected and
 * the options. Exported for tools that read those files.
 *
 * @example
 * ```ts
 * import type { TestCaseBase } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ name: "a ZIP code", input: "98101", expected: "WA" }).expected);
 * // → "WA"
 * ```
 */
interface TestCaseBase {
  name?: string; // Human-readable name or description of what this test case validates
  description?: string; // Human-readable description of what this test case validates (alternative to name)
  input: unknown; // The input data for the test
  expected: unknown; // The expected output/result of the test
  options?: Record<string, unknown>; // Optional configuration or parsing options for the test
}

// Schema for test case files with grouped test categories
interface TestFileSchema {
  description?: string; // Optional description of the entire test file's purpose
  [categoryName: string]: TestCaseBase[] | string | undefined; // Test cases organized by category/group name
}

/**
 * A parsing case in the package's JSON test files: an address and the fields expected from it.
 *
 * @example
 * ```ts
 * import type { AddressParsingTestCase } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ input: "123 Main St, Anytown, NY 12345", expected: { number: "123", state: "NY" } }).expected.state);
 * // → "NY"
 * ```
 */
interface AddressParsingTestCase extends TestCaseBase {
  input: string; // Input address string to parse
  expected: {
    number?: string;
    prefix?: string;
    street?: string;
    type?: string;
    suffix?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    [key: string]: unknown;
  }; // Expected parsed address components
  options?: {
    strict?: boolean;
    country?: string;
    [key: string]: unknown;
  }; // Optional parsing configuration
}

/**
 * A formatting case in the package's JSON test files: an address and the text expected.
 *
 * @example
 * ```ts
 * import type { AddressFormattingTestCase } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ input: "123 main st", expected: "123 Main St" }).expected);
 * // → "123 Main St"
 * ```
 */
interface AddressFormattingTestCase extends TestCaseBase {
  input: string; // Input address to format
  expected: string; // Expected formatted address string
  options?: {
    format?: string;
    abbreviate?: boolean;
    [key: string]: unknown;
  }; // Optional formatting configuration
}

/**
 * A validation case in the package's JSON test files: an address and the verdict and codes expected.
 *
 * @example
 * ```ts
 * import type { AddressValidationTestCase } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ input: "123 Main St", expected: { isValid: false } }).expected.isValid);
 * // → false
 * ```
 */
interface AddressValidationTestCase extends TestCaseBase {
  input: string; // Input address string to validate
  expected: {
    isValid: boolean;
    confidence?: number;
    completeness?: number;
    errors?: string[];
    warnings?: string[];
    [key: string]: unknown;
  }; // Expected validation results
}

/**
 * A comparison case in the package's JSON test files: two addresses and the match expected.
 *
 * @example
 * ```ts
 * import type { AddressComparisonTestCase } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ input: ["123 Main St", "123 Main Street"], expected: { isSame: true } }).expected.isSame);
 * // → true
 * ```
 */
interface AddressComparisonTestCase extends TestCaseBase {
  input: {
    address1: string;
    address2: string;
  }; // Two addresses to compare
  expected: {
    isSame?: boolean;
    similarity?: number;
    differences?: string[];
    [key: string]: unknown;
  }; // Expected comparison results
}

/**
 * A cleaning case in the package's JSON test files: an address and the tidied text expected.
 *
 * @example
 * ```ts
 * import type { CleanAddressTestCase } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ input: "123 MAIN ST", expected: "123 Main St" }).expected);
 * // → "123 Main St"
 * ```
 */
interface CleanAddressTestCase extends TestCaseBase {
  input: string; // Input address string to clean
  expected: {
    cleaned: string;
    changes?: string[];
    [key: string]: unknown;
  }; // Expected cleaned address and changes
  options?: {
    format?: string;
    abbreviate?: boolean;
    [key: string]: unknown;
  }; // Optional cleaning configuration
}

/**
 * A batch case in the package's JSON test files: several addresses and the counts expected.
 *
 * @example
 * ```ts
 * import type { BatchProcessingTestCase } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ input: ["123 Main St"], expected: { successful: 1 } }).expected.successful);
 * // → 1
 * ```
 */
interface BatchProcessingTestCase extends TestCaseBase {
  input: string[]; // Array of input addresses
  expected: {
    results?: unknown[];
    statistics?: {
      total: number;
      successful: number;
      failed: number;
    };
    errors?: Array<{
      index: number;
      error: string;
    }>;
    [key: string]: unknown;
  }; // Expected batch processing results
}

/**
 * Any case in the package's JSON test files.
 *
 * @example
 * ```ts
 * import type { TestCase } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ input: "98101", expected: "WA" }).input);
 * // → "98101"
 * ```
 */
type TestCase =
  | AddressParsingTestCase
  | AddressFormattingTestCase
  | AddressValidationTestCase
  | AddressComparisonTestCase
  | CleanAddressTestCase
  | BatchProcessingTestCase;

// Helper type for extracting test categories from file schema
type TestCategory<T extends TestFileSchema> = {
  [K in keyof T]: T[K] extends TestCase[] ? K : never;
}[keyof T];

// Validation function for test file schema
function validateTestFile(data: unknown): data is TestFileSchema {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  // Handle array format (direct array of test cases)
  if (Array.isArray(data)) {
    return data.every((item: unknown) => validateTestCase(item));
  }

  // Handle object format - recursively check for test case arrays
  function hasValidTestCases(obj: unknown, depth: number = 0): boolean {
    if (typeof obj !== "object" || obj === null || depth > 5) {
      return false;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key === "description" || key === "name") {
        continue; // Skip metadata fields
      }

      if (Array.isArray(value)) {
        // Check if this array contains valid test cases
        if (value.length > 0) {
          // Allow arrays that are mostly test cases (80% threshold)
          const validTestCases = value.filter((item: unknown) => validateTestCase(item));

          if (validTestCases.length >= Math.max(1, value.length * 0.8)) {
            return true;
          }
        }
      } else if (typeof value === "object" && value !== null) {
        // Recursively check nested objects
        if (hasValidTestCases(value, depth + 1)) {
          return true;
        }
      }
    }

    return false;
  }

  return hasValidTestCases(data);
}

// Validation function for individual test cases
function validateTestCase(input: unknown): input is TestCase {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const data = input as Record<string, unknown>;

  // Must have either name or description (but allow for very simple cases)
  if (
    !("name" in data) &&
    !("description" in data) &&
    !("input" in data) &&
    !("address" in data) &&
    !("addresses" in data)
  ) {
    return false;
  }

  // Must have some form of input or be a metadata container
  const hasInput = "input" in data || "address" in data || "addresses" in data;

  // Allow metadata objects that don't have input but have description/name
  const isMetadata = ("description" in data || "name" in data) && !hasInput;

  if (!hasInput && !isMetadata) {
    return false;
  }

  // If it has input, it should have some form of expected output
  if (hasInput) {
    const hasExpected =
      "expected" in data ||
      "expectedResult" in data ||
      "expectedResults" in data ||
      "expectedSuccessCount" in data ||
      "expectedFailureCount" in data ||
      "category" in data ||
      "id" in data;

    if (!hasExpected) {
      return false;
    }
  }

  // name/description must be string if present
  if ("name" in data && typeof data.name !== "string") {
    return false;
  }

  if ("description" in data && typeof data.description !== "string") {
    return false;
  }

  // options must be object if present
  if ("options" in data && (typeof data.options !== "object" || data.options === null)) {
    return false;
  }

  return true;
}

export type {
  AddressComparisonTestCase,
  AddressFormattingTestCase,
  AddressParsingTestCase,
  AddressValidationTestCase,
  BatchProcessingTestCase,
  CleanAddressTestCase,
  TestCase,
  TestCaseBase,
  TestCategory,
  TestFileSchema,
};

export { validateTestCase, validateTestFile };
