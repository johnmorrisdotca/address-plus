// Test case shapes for the batch parser.

import type { BatchParseOptions, ParsedAddress, ParsedIntersection } from "../../types";

interface BatchTestCase {
  id: number;
  name: string;
  description: string;
  addresses: string[];
  expectedSuccessCount: number;
  expectedFailureCount: number;
  testFunction: string;
  expectStats?: boolean;
}

interface BatchTestData {
  batchTests: BatchTestCase[];
}

interface BatchParseFunctionTestData {
  parseLocations: Array<{
    description: string;
    addresses: string[];
    expectedResults?: (ParsedAddress | null)[];
    expectedSuccessCount?: number;
    expectedFailureCount?: number;
  }>;
  parseAddresses: Array<{
    description: string;
    addresses: string[];
    expectedResults?: (ParsedAddress | null)[];
    expectedSuccessCount?: number;
    expectedFailureCount?: number;
  }>;
  parseInformalAddresses: Array<{
    description: string;
    addresses: string[];
    expectedResults?: (ParsedAddress | null)[];
    expectedSuccessCount?: number;
    expectedFailureCount?: number;
  }>;
  parseIntersections: Array<{
    description: string;
    addresses: string[];
    expectedResults?: (ParsedIntersection | null)[];
    expectedSuccessCount?: number;
    expectedFailureCount?: number;
  }>;
  options: Array<{
    description: string;
    addresses: string[];
    options?: BatchParseOptions;
    expectedResults?: (ParsedAddress | null)[];
    expectedSuccessCount?: number;
    expectedFailureCount?: number;
  }>;
}

interface AdvancedFunctionTestData {
  withStatistics: Array<{
    description: string;
    addresses: string[];
    options?: BatchParseOptions;
    expectedStats?: {
      total: number;
      successful: number;
      failed: number;
    };
    expectedErrors?: Array<{
      index: number;
      errorContains: string;
    }>;
    expectedResultsLength?: number;
  }>;
  performance: Array<{
    description: string;
    addresses?: string[];
    generateAddresses?: {
      count: number;
      template: string;
      startNumber: number;
    };
    expectedStats?: {
      total: number;
      successful: number;
      failed: number;
    };
    performanceExpectations?: {
      maxDurationMs: number;
      minAddressesPerSecond: number;
    };
  }>;
  edgeCases: Array<{
    description: string;
    addresses: (string | null)[];
    expectedStats?: {
      total: number;
      successful: number;
      failed: number;
    };
  }>;
  options: Array<{
    description: string;
    addresses: string[];
    options?: BatchParseOptions;
    expectedStats?: {
      total: number;
      successful: number;
      failed: number;
    };
    expectedErrors?: Array<{
      index: number;
      errorContains: string;
    }>;
    expectedResultsLength?: number;
    performanceExpectations?: {
      maxDurationMs: number;
      minAddressesPerSecond: number;
    };
  }>;
}

export type { AdvancedFunctionTestData, BatchParseFunctionTestData, BatchTestCase, BatchTestData };
