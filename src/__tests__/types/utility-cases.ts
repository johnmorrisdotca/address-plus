// Test case shapes for region normalization, postal mappings and address cleaning.

interface RegionTestCase {
  input: string;
  expected: { abbr: string; country: "CA" | "US" } | null;
  description: string;
}

interface FuzzyMatchTestCase {
  input: string;
  expected: { abbr: string; country: "CA" | "US" };
  description: string;
}

interface NullTestCase {
  input: string;
  description: string;
}

interface PostalMappingTestCase {
  name: string;
  description?: string;
  input: string;
  expected: string | null;
}

interface CleanAddressTestCase {
  name: string;
  input: string;
  expected: string;
  options?: Record<string, unknown>;
}

interface CleanAddressDetailedTestCase {
  name: string;
  input: string;
  expected: {
    cleanedAddress?: string;
    cleaned?: string;
    wasModified: boolean;
    changes: string[];
  };
  options?: Record<string, unknown>;
}

interface FormatSpecificTestCase {
  name: string;
  input: string;
  expected: string;
  expectContains: string[];
  options?: Record<string, unknown>;
}

interface EdgeCaseTestCase {
  name: string;
  input: string;
  expected: string;
  options?: Record<string, unknown>;
}

interface AdditionalTestCase {
  name: string;
  description: string;
  input: string;
  expected: string;
}

export type {
  AdditionalTestCase,
  CleanAddressDetailedTestCase,
  CleanAddressTestCase,
  EdgeCaseTestCase,
  FormatSpecificTestCase,
  FuzzyMatchTestCase,
  NullTestCase,
  PostalMappingTestCase,
  RegionTestCase,
};
