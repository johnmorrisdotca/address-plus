// Test case shapes for the shapes every test case has.

// Basic test case structure used across multiple test files
interface BaseTestCase {
  description: string;
  input: string;
}

// Test case with expected result
interface TestCaseWithExpected<T = unknown> extends BaseTestCase {
  expected: T;
}

// Test case with optional name
interface NamedTestCase extends BaseTestCase {
  name?: string;
}

export type { BaseTestCase, NamedTestCase, TestCaseWithExpected };
