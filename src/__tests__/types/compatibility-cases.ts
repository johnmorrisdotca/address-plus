// Test case shapes for strict mode and the parse-address compatibility suite.

interface PostalExpectedResult {
  zip: string | null;
  zipValid: boolean;
  plus4?: string;
}

interface StrictModeTestCase {
  description: string;
  input: string;
  expected: {
    strict?: PostalExpectedResult;
    permissive?: PostalExpectedResult;
    zip?: string;
    zipValid?: boolean;
    plus4?: string;
  };
}

interface StrictModeTestData {
  tests: StrictModeTestCase[] | { [key: string]: StrictModeTestCase[] | StrictModeTestCase };
}

interface CompatibilityComparisonTestCase {
  id: number;
  description: string;
  input: string;
  category: string;
}

interface SnakeCaseTestCase {
  description: string;
  input: string;
  options?: { useSnakeCase?: boolean };
  expected: Record<string, unknown> | null;
  notExpected?: string[];
}

interface AddressTestCase {
  description: string;
  input: string;
  expected: Record<string, unknown> | null;
}

interface MultipleParserTestCase {
  description: string;
  input: string;
  functions: string[];
  expectedResult: string;
}

interface KeyTestCase {
  description: string;
  input: string;
  purpose: string;
}

interface CompatibilityTestData {
  tests: {
    parseAddressComparison?: CompatibilityComparisonTestCase[];
    snakeCaseCompatibility?: SnakeCaseTestCase[];
    multipleParserFunctions?: MultipleParserTestCase[];
    usBasicAddresses?: AddressTestCase[];
    canadaBasicAddresses?: AddressTestCase[];
    intersections?: AddressTestCase[];
    usSpecialFormats?: AddressTestCase[];
  };
}

interface LegacyTestData {
  description: string;
  testCases: CompatibilityComparisonTestCase[];
  keyTestCase: KeyTestCase;
}

export type {
  AddressTestCase,
  CompatibilityComparisonTestCase,
  CompatibilityTestData,
  KeyTestCase,
  LegacyTestData,
  MultipleParserTestCase,
  PostalExpectedResult,
  SnakeCaseTestCase,
  StrictModeTestCase,
  StrictModeTestData,
};
