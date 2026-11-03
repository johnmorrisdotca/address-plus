// Test case shapes for address formatting.

interface FormattingTestCase {
  description: string;
  input: Record<string, unknown>;
  expected: {
    lines?: string[];
    singleLine?: string;
    format?: string;
    shouldNotContain?: string;
    shouldContain?: string;
    regex?: string;
    country?: string;
    hasProperties?: string[];
    streetTypes?: Record<string, unknown>;
    directions?: Record<string, unknown>;
    states?: Record<string, unknown>;
    provinces?: Record<string, unknown>;
    unitTypes?: Record<string, unknown>;
    usps?: string;
    canadaPost?: string;
    informal?: string;
    formal?: string;
    directionals?: Record<string, string>;
    abbreviations?: Record<string, string>;
  };
  options?: Record<string, unknown>;
}

export type { FormattingTestCase };
