// Test case shapes for address comparison.

interface ComparisonTestCase {
  description: string;
  input: {
    address1: Record<string, unknown>;
    address2: Record<string, unknown>;
    options?: Record<string, unknown>;
  };
  expected: {
    isSame: boolean;
    similarity: number;
    score?: number;
  };
}

interface SimilarityTestCase {
  description: string;
  input: {
    address1: Record<string, unknown>;
    address2: Record<string, unknown>;
  };
  expected: {
    similarity: number;
  };
}

interface ComparisonEdgeCaseTestCase {
  description: string;
  input: {
    address1: Record<string, unknown> | null;
    address2: Record<string, unknown> | null;
    options?: Record<string, unknown>;
  };
  expected: {
    isSame: boolean;
    similarity?: number;
    similarityLessThan?: number;
    comparison?: {
      score?: number;
    };
  };
}

export type { ComparisonEdgeCaseTestCase, ComparisonTestCase, SimilarityTestCase };
